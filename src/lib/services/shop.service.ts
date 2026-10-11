import { db } from "../db/client";
import { getKolkataDateString } from "../utils/date";
import { reconcilePayment } from "../billing/engine";
import type { ProductItem, PaymentMethod } from "../types";

export async function getProducts(
  businessId: string,
  categoryFilter?: string,
  search?: string
): Promise<ProductItem[]> {
  let sql = `SELECT * FROM products WHERE business_id = ? AND is_active = 1`;
  const args: (string | number)[] = [businessId];

  if (categoryFilter && categoryFilter !== "ALL") {
    sql += ` AND category = ?`;
    args.push(categoryFilter);
  }

  if (search && search.trim().length > 0) {
    sql += ` AND (name LIKE ? OR brand LIKE ? OR category LIKE ?)`;
    const term = `%${search.trim()}%`;
    args.push(term, term, term);
  }

  sql += ` ORDER BY category ASC, name ASC`;

  const res = await db.execute({ sql, args });

  return res.rows.map((row) => ({
    id: String(row.id),
    business_id: String(row.business_id),
    name: String(row.name),
    category: String(row.category),
    brand: row.brand ? String(row.brand) : null,
    sku: row.sku ? String(row.sku) : null,
    selling_price_paise: Number(row.selling_price_paise),
    cost_price_paise: Number(row.cost_price_paise),
    current_stock: Number(row.current_stock),
    low_stock_threshold: Number(row.low_stock_threshold),
    unit: String(row.unit),
    pack_piece_ratio: Number(row.pack_piece_ratio || 1),
    is_active: Number(row.is_active),
  }));
}

export async function recordCounterSale(params: {
  businessId: string;
  items: { productId: string; quantity: number }[];
  paymentMethod: PaymentMethod;
  cashAmountPaise?: number;
  upiAmountPaise?: number;
  discountPaise?: number;
  customerId?: string | null;
  notes?: string | null;
  userId: string;
}): Promise<{ billId: string; billNumber: string; finalAmountPaise: number }> {
  const {
    businessId,
    items,
    paymentMethod,
    cashAmountPaise,
    upiAmountPaise,
    discountPaise = 0,
    customerId,
    notes,
    userId,
  } = params;

  if (items.length === 0) {
    throw new Error("No items selected for counter sale");
  }

  const nowIso = new Date().toISOString();
  let subtotalPaise = 0;

  // Validate all items and stock first
  const validatedItems: {
    product: any;
    quantity: number;
    unitPricePaise: number;
    unitCostPaise: number;
    totalPricePaise: number;
  }[] = [];

  for (const item of items) {
    if (item.quantity <= 0) continue;

    const prodRes = await db.execute({
      sql: `SELECT * FROM products WHERE id = ? AND business_id = ?`,
      args: [item.productId, businessId],
    });

    if (prodRes.rows.length === 0) {
      throw new Error(`Product not found: ${item.productId}`);
    }

    const prod = prodRes.rows[0];
    const currentStock = Number(prod.current_stock);

    if (currentStock < item.quantity) {
      throw new Error(
        `Insufficient stock for "${prod.name}". Available: ${currentStock}, Requested: ${item.quantity}`
      );
    }

    const unitPrice = Number(prod.selling_price_paise);
    const unitCost = Number(prod.cost_price_paise || 0);
    const lineTotal = unitPrice * item.quantity;
    subtotalPaise += lineTotal;

    validatedItems.push({
      product: prod,
      quantity: item.quantity,
      unitPricePaise: unitPrice,
      unitCostPaise: unitCost,
      totalPricePaise: lineTotal,
    });
  }

  const safeDiscount = Math.min(discountPaise, subtotalPaise);
  const finalAmountPaise = Math.max(0, subtotalPaise - safeDiscount);

  // Reconcile payment
  const effectiveCash: number =
    paymentMethod === "CASH"
      ? (cashAmountPaise !== undefined ? cashAmountPaise : finalAmountPaise)
      : paymentMethod === "SPLIT"
      ? (cashAmountPaise ?? 0)
      : 0;
  const effectiveUpi: number =
    paymentMethod === "UPI"
      ? (upiAmountPaise !== undefined ? upiAmountPaise : finalAmountPaise)
      : paymentMethod === "SPLIT"
      ? (upiAmountPaise ?? 0)
      : 0;

  const paymentReconciliation = reconcilePayment(
    finalAmountPaise,
    effectiveCash,
    effectiveUpi
  );

  if (paymentReconciliation.outstandingPaise > 0 && !customerId) {
    throw new Error(
      "Customer must be selected or registered when saving an unpaid or partial credit (Udhaar) sale"
    );
  }

  // Generate unique Bill number: LU-YYYYMMDD-XXXX
  const todayStr = getKolkataDateString().replace(/-/g, "");
  const billCountRes = await db.execute({
    sql: `SELECT COUNT(*) as count FROM bills WHERE business_id = ? AND bill_number LIKE ?`,
    args: [businessId, `LU-${todayStr}-%`],
  });
  const seq = Number(billCountRes.rows[0].count) + 1;
  const billNumber = `LU-${todayStr}-${String(seq).padStart(4, "0")}`;
  const billId = `bill_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  // Create Bill
  await db.execute({
    sql: `INSERT INTO bills (
            id, business_id, bill_number, session_id, customer_id, bill_type,
            subtotal_paise, discount_paise, final_amount_paise, paid_amount_paise,
            outstanding_paise, payment_status, notes, created_by_user_id, created_at, updated_at
          ) VALUES (?, ?, ?, NULL, ?, 'COUNTER', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      billId,
      businessId,
      billNumber,
      customerId || null,
      subtotalPaise,
      safeDiscount,
      finalAmountPaise,
      paymentReconciliation.paidAmountPaise,
      paymentReconciliation.outstandingPaise,
      paymentReconciliation.paymentStatus,
      notes || null,
      userId,
      nowIso,
      nowIso,
    ],
  });

  // Create Bill Items and deduct stock
  for (const v of validatedItems) {
    const currentStock = Number(v.product.current_stock);
    const newStock = currentStock - v.quantity;

    await db.execute({
      sql: `UPDATE products SET current_stock = ?, updated_at = ? WHERE id = ?`,
      args: [newStock, nowIso, v.product.id],
    });

    await db.execute({
      sql: `INSERT INTO stock_movements (
              id, business_id, product_id, movement_type, quantity_change,
              previous_stock, new_stock, reference_id, reason, created_by_user_id, created_at
            ) VALUES (?, ?, ?, 'SALE', ?, ?, ?, ?, 'Counter Sale', ?, ?)`,
      args: [
        `sm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        businessId,
        v.product.id,
        -v.quantity,
        currentStock,
        newStock,
        billId,
        userId,
        nowIso,
      ],
    });

    await db.execute({
      sql: `INSERT INTO bill_items (
              id, business_id, bill_id, session_id, product_id, item_name,
              item_type, quantity, unit_price_paise, unit_cost_paise, total_price_paise, created_at
            ) VALUES (?, ?, ?, NULL, ?, ?, 'PRODUCT', ?, ?, ?, ?, ?)`,
      args: [
        `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        businessId,
        billId,
        v.product.id,
        String(v.product.name),
        v.quantity,
        v.unitPricePaise,
        v.unitCostPaise,
        v.totalPricePaise,
        nowIso,
      ],
    });
  }

  // Record Payment
  if (paymentReconciliation.paidAmountPaise > 0) {
    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    await db.execute({
      sql: `INSERT INTO payments (
              id, business_id, bill_id, customer_id, payment_type, payment_method,
              cash_amount_paise, upi_amount_paise, total_amount_paise, reference_note,
              created_by_user_id, created_at
            ) VALUES (?, ?, ?, ?, 'BILL_PAYMENT', ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        paymentId,
        businessId,
        billId,
        customerId ? String(customerId) : null,
        paymentMethod,
        effectiveCash,
        effectiveUpi,
        paymentReconciliation.paidAmountPaise,
        notes ? String(notes) : "Counter sale settlement",
        userId,
        nowIso,
      ],
    });

    // Update cash drawer in shift
    const todayDate = getKolkataDateString();
    if (effectiveCash > 0) {
      await db.execute({
        sql: `UPDATE cash_shifts
              SET shop_cash_collected_paise = shop_cash_collected_paise + ?,
                  updated_at = ?
              WHERE business_id = ? AND shift_date = ? AND status = 'OPEN'`,
        args: [effectiveCash, nowIso, businessId, todayDate],
      });
    }

    if (effectiveUpi > 0) {
      await db.execute({
        sql: `UPDATE cash_shifts
              SET total_upi_collected_paise = total_upi_collected_paise + ?,
                  updated_at = ?
              WHERE business_id = ? AND shift_date = ? AND status = 'OPEN'`,
        args: [effectiveUpi, nowIso, businessId, todayDate],
      });
    }
  }

  // If customer credit given, update customer's balance
  if (paymentReconciliation.outstandingPaise > 0 && customerId) {
    await db.execute({
      sql: `UPDATE customers
            SET outstanding_credit_paise = outstanding_credit_paise + ?,
                updated_at = ?
            WHERE id = ? AND business_id = ?`,
      args: [paymentReconciliation.outstandingPaise, nowIso, customerId, businessId],
    });

    const todayDate = getKolkataDateString();
    await db.execute({
      sql: `UPDATE cash_shifts
            SET total_credit_given_paise = total_credit_given_paise + ?,
                updated_at = ?
            WHERE business_id = ? AND shift_date = ? AND status = 'OPEN'`,
      args: [paymentReconciliation.outstandingPaise, nowIso, businessId, todayDate],
    });
  }

  return {
    billId,
    billNumber,
    finalAmountPaise,
  };
}

export async function recordStockPurchase(params: {
  businessId: string;
  supplierId: string;
  invoiceNumber?: string;
  purchaseDate: string;
  items: { productId: string; quantity: number; unitCostPaise: number }[];
  paidAmountPaise: number;
  paymentMethod: "CASH" | "UPI" | "CREDIT";
  notes?: string;
  userId: string;
}): Promise<string> {
  const {
    businessId,
    supplierId,
    invoiceNumber,
    purchaseDate,
    items,
    paidAmountPaise,
    paymentMethod,
    notes,
    userId,
  } = params;

  const nowIso = new Date().toISOString();
  let totalPurchaseAmountPaise = 0;

  for (const item of items) {
    totalPurchaseAmountPaise += item.quantity * item.unitCostPaise;
  }

  const remainingPayable = Math.max(0, totalPurchaseAmountPaise - paidAmountPaise);
  const purchaseId = `purch_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  await db.execute({
    sql: `INSERT INTO purchases (
            id, business_id, supplier_id, invoice_number, purchase_date,
            total_amount_paise, paid_amount_paise, remaining_payable_paise,
            payment_method, notes, created_by_user_id, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      purchaseId,
      businessId,
      supplierId,
      invoiceNumber || `INV-${Date.now().toString().slice(-6)}`,
      purchaseDate,
      totalPurchaseAmountPaise,
      paidAmountPaise,
      remainingPayable,
      paymentMethod,
      notes || null,
      userId,
      nowIso,
    ],
  });

  // Update inventory and log stock movements
  for (const item of items) {
    const prodRes = await db.execute({
      sql: `SELECT current_stock, cost_price_paise FROM products WHERE id = ?`,
      args: [item.productId],
    });

    if (prodRes.rows.length > 0) {
      const currentStock = Number(prodRes.rows[0].current_stock);
      const newStock = currentStock + item.quantity;

      await db.execute({
        sql: `UPDATE products SET current_stock = ?, cost_price_paise = ?, updated_at = ? WHERE id = ?`,
        args: [newStock, item.unitCostPaise, nowIso, item.productId],
      });

      await db.execute({
        sql: `INSERT INTO stock_movements (
                id, business_id, product_id, movement_type, quantity_change,
                previous_stock, new_stock, reference_id, reason, created_by_user_id, created_at
              ) VALUES (?, ?, ?, 'PURCHASE', ?, ?, ?, ?, 'Supplier Purchase Received', ?, ?)`,
        args: [
          `sm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          businessId,
          item.productId,
          item.quantity,
          currentStock,
          newStock,
          purchaseId,
          userId,
          nowIso,
        ],
      });

      await db.execute({
        sql: `INSERT INTO purchase_items (
                id, purchase_id, product_id, quantity, unit_cost_paise, total_cost_paise, created_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [
          `pitem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          purchaseId,
          item.productId,
          item.quantity,
          item.unitCostPaise,
          item.quantity * item.unitCostPaise,
          nowIso,
        ],
      });
    }
  }

  // Update supplier payable if credit remains
  if (remainingPayable > 0) {
    await db.execute({
      sql: `UPDATE suppliers SET outstanding_payable_paise = outstanding_payable_paise + ?, updated_at = ? WHERE id = ?`,
      args: [remainingPayable, nowIso, supplierId],
    });
  }

  return purchaseId;
}

export async function adjustStock(params: {
  businessId: string;
  productId: string;
  newStock: number;
  reason: string;
  userId: string;
}): Promise<void> {
  const { businessId, productId, newStock, reason, userId } = params;
  const nowIso = new Date().toISOString();

  const prodRes = await db.execute({
    sql: `SELECT current_stock, name FROM products WHERE id = ? AND business_id = ?`,
    args: [productId, businessId],
  });

  if (prodRes.rows.length === 0) {
    throw new Error("Product not found");
  }

  const prevStock = Number(prodRes.rows[0].current_stock);
  const diff = newStock - prevStock;

  await db.execute({
    sql: `UPDATE products SET current_stock = ?, updated_at = ? WHERE id = ?`,
    args: [newStock, nowIso, productId],
  });

  await db.execute({
    sql: `INSERT INTO stock_movements (
            id, business_id, product_id, movement_type, quantity_change,
            previous_stock, new_stock, reason, created_by_user_id, created_at
          ) VALUES (?, ?, ?, 'ADJUSTMENT', ?, ?, ?, ?, ?, ?)`,
    args: [
      `sm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      businessId,
      productId,
      diff,
      prevStock,
      newStock,
      reason,
      userId,
      nowIso,
    ],
  });
}
