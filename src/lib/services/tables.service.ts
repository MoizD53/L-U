import { db } from "../db/client";
import { calculateSessionBill, reconcilePayment } from "../billing/engine";
import { getKolkataDateString } from "../utils/date";
import type {
  GameType,
  TableItem,
  GameSessionItem,
  SessionItem,
  PaymentMethod,
  RoundingMode,
} from "../types";

export async function getTablesWithActiveSessions(
  businessId: string,
  typeFilter?: GameType
): Promise<TableItem[]> {
  const query = typeFilter
    ? `SELECT t.*, rp.name as rate_plan_name, rp.hourly_rate_paise, rp.minimum_charge_paise,
              rp.billing_increment_minutes, rp.rounding_mode
       FROM tables t
       LEFT JOIN rate_plans rp ON t.rate_plan_id = rp.id
       WHERE t.business_id = ? AND t.type = ? AND t.is_active = 1
       ORDER BY t.display_order ASC, t.name ASC`
    : `SELECT t.*, rp.name as rate_plan_name, rp.hourly_rate_paise, rp.minimum_charge_paise,
              rp.billing_increment_minutes, rp.rounding_mode
       FROM tables t
       LEFT JOIN rate_plans rp ON t.rate_plan_id = rp.id
       WHERE t.business_id = ? AND t.is_active = 1
       ORDER BY t.type ASC, t.display_order ASC, t.name ASC`;

  const args = typeFilter ? [businessId, typeFilter] : [businessId];
  const tablesRes = await db.execute({ sql: query, args });

  // Fetch all currently active sessions for this business
  const activeSessionsRes = await db.execute({
    sql: `SELECT s.*, c.name as customer_name, c.phone as customer_phone,
                 t.name as table_name, t.type as table_type
          FROM game_sessions s
          JOIN tables t ON s.table_id = t.id
          LEFT JOIN customers c ON s.customer_id = c.id
          WHERE s.business_id = ? AND s.status = 'ACTIVE'`,
    args: [businessId],
  });

  const sessionMap = new Map<string, GameSessionItem>();

  for (const sRow of activeSessionsRes.rows) {
    const sessionId = String(sRow.id);

    // Fetch attached items for this session
    const itemsRes = await db.execute({
      sql: `SELECT * FROM bill_items WHERE session_id = ?`,
      args: [sessionId],
    });

    const items: SessionItem[] = itemsRes.rows.map((i) => ({
      id: String(i.id),
      bill_id: i.bill_id ? String(i.bill_id) : undefined,
      session_id: String(i.session_id),
      product_id: i.product_id ? String(i.product_id) : null,
      item_name: String(i.item_name),
      item_type: i.item_type as "TABLE_TIME" | "PRODUCT" | "SERVICE",
      quantity: Number(i.quantity),
      unit_price_paise: Number(i.unit_price_paise),
      unit_cost_paise: Number(i.unit_cost_paise),
      total_price_paise: Number(i.total_price_paise),
      created_at: String(i.created_at),
    }));

    const itemsChargePaise = items.reduce(
      (sum, item) => sum + item.total_price_paise,
      0
    );

    // Calculate live bill estimation
    const liveCalc = calculateSessionBill({
      startTimeIso: String(sRow.start_time),
      endTimeIso: null, // live now
      hourlyRatePaise: Number(sRow.snapshot_hourly_rate_paise),
      minimumChargePaise: Number(sRow.snapshot_minimum_charge_paise),
      billingIncrementMinutes: Number(sRow.snapshot_increment_minutes),
      roundingMode: sRow.snapshot_rounding_mode as RoundingMode,
      itemsChargePaise,
      discountPaise: Number(sRow.discount_paise || 0),
    });

    const sessionItem: GameSessionItem = {
      id: sessionId,
      business_id: String(sRow.business_id),
      table_id: String(sRow.table_id),
      customer_id: sRow.customer_id ? String(sRow.customer_id) : null,
      customer_name: sRow.customer_name ? String(sRow.customer_name) : null,
      customer_phone: sRow.customer_phone ? String(sRow.customer_phone) : null,
      table_name: sRow.table_name ? String(sRow.table_name) : undefined,
      table_type: sRow.table_type as GameType,
      start_time: String(sRow.start_time),
      end_time: null,
      status: "ACTIVE",
      snapshot_hourly_rate_paise: Number(sRow.snapshot_hourly_rate_paise),
      snapshot_minimum_charge_paise: Number(sRow.snapshot_minimum_charge_paise),
      snapshot_increment_minutes: Number(sRow.snapshot_increment_minutes),
      snapshot_rounding_mode: sRow.snapshot_rounding_mode as RoundingMode,
      duration_minutes: liveCalc.durationMinutes,
      table_charge_paise: liveCalc.tableChargePaise,
      items_charge_paise: itemsChargePaise,
      total_amount_paise: liveCalc.subtotalPaise,
      discount_paise: liveCalc.discountPaise,
      final_amount_paise: liveCalc.finalAmountPaise,
      notes: sRow.notes ? String(sRow.notes) : null,
      created_by_user_id: String(sRow.created_by_user_id),
      created_at: String(sRow.created_at),
      items,
    };

    sessionMap.set(sessionItem.table_id, sessionItem);
  }

  return tablesRes.rows.map((row) => {
    const tableId = String(row.id);
    return {
      id: tableId,
      business_id: String(row.business_id),
      name: String(row.name),
      type: row.type as GameType,
      rate_plan_id: row.rate_plan_id ? String(row.rate_plan_id) : null,
      display_order: Number(row.display_order),
      is_active: Number(row.is_active),
      rate_plan_name: row.rate_plan_name ? String(row.rate_plan_name) : undefined,
      hourly_rate_paise: row.hourly_rate_paise
        ? Number(row.hourly_rate_paise)
        : undefined,
      minimum_charge_paise: row.minimum_charge_paise
        ? Number(row.minimum_charge_paise)
        : undefined,
      active_session: sessionMap.get(tableId) || null,
    };
  });
}

export async function startTableSession(params: {
  businessId: string;
  tableId: string;
  customerId?: string | null;
  notes?: string | null;
  userId: string;
  customHourlyRatePaise?: number;
}): Promise<GameSessionItem> {
  const { businessId, tableId, customerId, notes, userId, customHourlyRatePaise } =
    params;

  // 1. Verify table exists and has no active session
  const tableRes = await db.execute({
    sql: `SELECT t.*, rp.hourly_rate_paise, rp.minimum_charge_paise,
                 rp.billing_increment_minutes, rp.rounding_mode
          FROM tables t
          LEFT JOIN rate_plans rp ON t.rate_plan_id = rp.id
          WHERE t.id = ? AND t.business_id = ?`,
    args: [tableId, businessId],
  });

  if (tableRes.rows.length === 0) {
    throw new Error("Table not found");
  }

  const table = tableRes.rows[0];

  // Prevent overlapping active sessions
  const activeCheck = await db.execute({
    sql: `SELECT id FROM game_sessions WHERE table_id = ? AND status = 'ACTIVE'`,
    args: [tableId],
  });

  if (activeCheck.rows.length > 0) {
    throw new Error("This table already has an active running session");
  }

  // 2. Snapshot rate plan
  let hourlyRatePaise = customHourlyRatePaise || Number(table.hourly_rate_paise || 0);
  let minimumChargePaise = Number(table.minimum_charge_paise || 0);
  let incrementMinutes = Number(table.billing_increment_minutes || 1);
  let roundingMode: RoundingMode = (table.rounding_mode as RoundingMode) || "CEIL";

  // If table had no assigned rate plan, lookup default plan for this type
  if (!hourlyRatePaise) {
    const defaultPlanRes = await db.execute({
      sql: `SELECT * FROM rate_plans WHERE business_id = ? AND game_type = ? AND is_default = 1`,
      args: [businessId, table.type],
    });
    if (defaultPlanRes.rows.length > 0) {
      const defPlan = defaultPlanRes.rows[0];
      hourlyRatePaise = Number(defPlan.hourly_rate_paise);
      minimumChargePaise = Number(defPlan.minimum_charge_paise || 0);
      incrementMinutes = Number(defPlan.billing_increment_minutes || 1);
      roundingMode = (defPlan.rounding_mode as RoundingMode) || "CEIL";
    } else {
      // Fallback sensible defaults
      hourlyRatePaise = table.type === "POOL" ? 20000 : 35000;
      minimumChargePaise = table.type === "POOL" ? 5000 : 10000;
      incrementMinutes = 1;
      roundingMode = "CEIL";
    }
  }

  const sessionId = `ses_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const nowIso = new Date().toISOString();

  await db.execute({
    sql: `INSERT INTO game_sessions (
            id, business_id, table_id, customer_id, start_time, status,
            snapshot_hourly_rate_paise, snapshot_minimum_charge_paise,
            snapshot_increment_minutes, snapshot_rounding_mode,
            duration_minutes, table_charge_paise, items_charge_paise,
            total_amount_paise, discount_paise, final_amount_paise,
            notes, created_by_user_id, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, 'ACTIVE', ?, ?, ?, ?, 0, 0, 0, 0, 0, 0, ?, ?, ?, ?)`,
    args: [
      sessionId,
      businessId,
      tableId,
      customerId || null,
      nowIso,
      hourlyRatePaise,
      minimumChargePaise,
      incrementMinutes,
      roundingMode,
      notes || null,
      userId,
      nowIso,
      nowIso,
    ],
  });

  return {
    id: sessionId,
    business_id: businessId,
    table_id: tableId,
    customer_id: customerId || null,
    table_name: String(table.name),
    table_type: table.type as GameType,
    start_time: nowIso,
    end_time: null,
    status: "ACTIVE",
    snapshot_hourly_rate_paise: hourlyRatePaise,
    snapshot_minimum_charge_paise: minimumChargePaise,
    snapshot_increment_minutes: incrementMinutes,
    snapshot_rounding_mode: roundingMode,
    duration_minutes: 0,
    table_charge_paise: 0,
    items_charge_paise: 0,
    total_amount_paise: 0,
    discount_paise: 0,
    final_amount_paise: 0,
    notes: notes || null,
    created_by_user_id: userId,
    created_at: nowIso,
    items: [],
  };
}

export async function addItemsToSession(params: {
  businessId: string;
  sessionId: string;
  items: { productId: string; quantity: number }[];
  userId: string;
}): Promise<SessionItem[]> {
  const { businessId, sessionId, items, userId } = params;

  // Verify session is active
  const sessionRes = await db.execute({
    sql: `SELECT * FROM game_sessions WHERE id = ? AND business_id = ? AND status = 'ACTIVE'`,
    args: [sessionId, businessId],
  });

  if (sessionRes.rows.length === 0) {
    throw new Error("Active game session not found");
  }

  const addedItems: SessionItem[] = [];
  const nowIso = new Date().toISOString();

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

    const unitPricePaise = Number(prod.selling_price_paise);
    const unitCostPaise = Number(prod.cost_price_paise || 0);
    const totalPricePaise = unitPricePaise * item.quantity;
    const newStock = currentStock - item.quantity;

    // Deduct stock
    await db.execute({
      sql: `UPDATE products SET current_stock = ?, updated_at = ? WHERE id = ?`,
      args: [newStock, nowIso, item.productId],
    });

    // Record stock movement
    await db.execute({
      sql: `INSERT INTO stock_movements (
              id, business_id, product_id, movement_type, quantity_change,
              previous_stock, new_stock, reference_id, reason, created_by_user_id, created_at
            ) VALUES (?, ?, ?, 'SESSION_ADDON', ?, ?, ?, ?, 'Added to table session', ?, ?)`,
      args: [
        `sm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        businessId,
        item.productId,
        -item.quantity,
        currentStock,
        newStock,
        sessionId,
        userId,
        nowIso,
      ],
    });

    // Create bill item
    const billItemId = `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    await db.execute({
      sql: `INSERT INTO bill_items (
              id, business_id, bill_id, session_id, product_id, item_name,
              item_type, quantity, unit_price_paise, unit_cost_paise, total_price_paise, created_at
            ) VALUES (?, ?, NULL, ?, ?, ?, 'PRODUCT', ?, ?, ?, ?, ?)`,
      args: [
        billItemId,
        businessId,
        sessionId,
        item.productId,
        String(prod.name),
        item.quantity,
        unitPricePaise,
        unitCostPaise,
        totalPricePaise,
        nowIso,
      ],
    });

    addedItems.push({
      id: billItemId,
      session_id: sessionId,
      product_id: item.productId,
      item_name: String(prod.name),
      item_type: "PRODUCT",
      quantity: item.quantity,
      unit_price_paise: unitPricePaise,
      unit_cost_paise: unitCostPaise,
      total_price_paise: totalPricePaise,
      created_at: nowIso,
    });
  }

  // Update total items charge on session
  const totalItemsRes = await db.execute({
    sql: `SELECT COALESCE(SUM(total_price_paise), 0) as total FROM bill_items WHERE session_id = ?`,
    args: [sessionId],
  });

  const totalItemsPaise = Number(totalItemsRes.rows[0].total || 0);

  await db.execute({
    sql: `UPDATE game_sessions SET items_charge_paise = ?, updated_at = ? WHERE id = ?`,
    args: [totalItemsPaise, nowIso, sessionId],
  });

  return addedItems;
}

export async function endTableSessionAndFinalizeBill(params: {
  businessId: string;
  sessionId: string;
  discountPaise?: number;
  cashAmountPaise?: number;
  upiAmountPaise?: number;
  paymentMethod: PaymentMethod;
  customerId?: string | null;
  notes?: string | null;
  userId: string;
}): Promise<{ billId: string; billNumber: string; finalAmountPaise: number; outstandingPaise: number }> {
  const {
    businessId,
    sessionId,
    discountPaise = 0,
    cashAmountPaise,
    upiAmountPaise,
    paymentMethod,
    customerId,
    notes,
    userId,
  } = params;

  // 1. Fetch active session
  const sessionRes = await db.execute({
    sql: `SELECT s.*, t.name as table_name FROM game_sessions s
          JOIN tables t ON s.table_id = t.id
          WHERE s.id = ? AND s.business_id = ? AND s.status = 'ACTIVE'`,
    args: [sessionId, businessId],
  });

  if (sessionRes.rows.length === 0) {
    throw new Error("Active session not found or already ended");
  }

  const session = sessionRes.rows[0];
  const endIso = new Date().toISOString();

  // Fetch all items attached to session
  const itemsRes = await db.execute({
    sql: `SELECT * FROM bill_items WHERE session_id = ?`,
    args: [sessionId],
  });

  const itemsChargePaise = itemsRes.rows.reduce(
    (sum, item) => sum + Number(item.total_price_paise),
    0
  );

  // 2. Calculate final charges
  const calc = calculateSessionBill({
    startTimeIso: String(session.start_time),
    endTimeIso: endIso,
    hourlyRatePaise: Number(session.snapshot_hourly_rate_paise),
    minimumChargePaise: Number(session.snapshot_minimum_charge_paise),
    billingIncrementMinutes: Number(session.snapshot_increment_minutes),
    roundingMode: session.snapshot_rounding_mode as RoundingMode,
    itemsChargePaise,
    discountPaise,
  });

  // 3. Reconcile payment
  const effectiveCash: number =
    paymentMethod === "CASH"
      ? (cashAmountPaise !== undefined ? cashAmountPaise : calc.finalAmountPaise)
      : paymentMethod === "SPLIT"
      ? (cashAmountPaise ?? 0)
      : 0;
  const effectiveUpi: number =
    paymentMethod === "UPI"
      ? (upiAmountPaise !== undefined ? upiAmountPaise : calc.finalAmountPaise)
      : paymentMethod === "SPLIT"
      ? (upiAmountPaise ?? 0)
      : 0;

  const paymentReconciliation = reconcilePayment(
    calc.finalAmountPaise,
    effectiveCash,
    effectiveUpi
  );

  const effectiveCustomerId = customerId || session.customer_id ? String(customerId || session.customer_id) : null;

  // If there's outstanding credit (udhaar), customer must be recorded!
  if (paymentReconciliation.outstandingPaise > 0 && !effectiveCustomerId) {
    throw new Error(
      "Customer must be selected or registered when saving an unpaid or partial credit (Udhaar) bill"
    );
  }

  // 4. Generate unique Bill number: LU-YYYYMMDD-XXXX
  const todayStr = getKolkataDateString().replace(/-/g, "");
  const billCountRes = await db.execute({
    sql: `SELECT COUNT(*) as count FROM bills WHERE business_id = ? AND bill_number LIKE ?`,
    args: [businessId, `LU-${todayStr}-%`],
  });
  const seq = Number(billCountRes.rows[0].count) + 1;
  const billNumber = `LU-${todayStr}-${String(seq).padStart(4, "0")}`;
  const billId = `bill_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  // 5. Create Bill record
  await db.execute({
    sql: `INSERT INTO bills (
            id, business_id, bill_number, session_id, customer_id, bill_type,
            subtotal_paise, discount_paise, final_amount_paise, paid_amount_paise,
            outstanding_paise, payment_status, notes, created_by_user_id, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, 'TABLE', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      billId,
      businessId,
      billNumber,
      sessionId,
      effectiveCustomerId,
      calc.subtotalPaise,
      calc.discountPaise,
      calc.finalAmountPaise,
      paymentReconciliation.paidAmountPaise,
      paymentReconciliation.outstandingPaise,
      paymentReconciliation.paymentStatus,
      notes || null,
      userId,
      endIso,
      endIso,
    ],
  });

  // Link bill items to bill_id
  await db.execute({
    sql: `UPDATE bill_items SET bill_id = ? WHERE session_id = ?`,
    args: [billId, sessionId],
  });

  // Also add Table Time line item to bill_items for complete breakdown
  await db.execute({
    sql: `INSERT INTO bill_items (
            id, business_id, bill_id, session_id, item_name, item_type,
            quantity, unit_price_paise, unit_cost_paise, total_price_paise, created_at
          ) VALUES (?, ?, ?, ?, ?, 'TABLE_TIME', 1, ?, 0, ?, ?)`,
    args: [
      `item_time_${billId}`,
      businessId,
      billId,
      sessionId,
      `Table Time (${session.table_name || "Game"}) - ${calc.durationMinutes} mins`,
      calc.tableChargePaise,
      calc.tableChargePaise,
      endIso,
    ],
  });

  // 6. Record Payment if any money was collected
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
        effectiveCustomerId ? String(effectiveCustomerId) : null,
        paymentMethod,
        effectiveCash,
        effectiveUpi,
        paymentReconciliation.paidAmountPaise,
        notes ? String(notes) : "Table session bill settlement",
        userId,
        endIso,
      ],
    });

    // Update active cash shift drawer collections
    const todayDate = getKolkataDateString();
    if (effectiveCash > 0) {
      await db.execute({
        sql: `UPDATE cash_shifts
              SET table_cash_collected_paise = table_cash_collected_paise + ?,
                  updated_at = ?
              WHERE business_id = ? AND shift_date = ? AND status = 'OPEN'`,
        args: [effectiveCash, endIso, businessId, todayDate],
      });
    }

    if (effectiveUpi > 0) {
      await db.execute({
        sql: `UPDATE cash_shifts
              SET total_upi_collected_paise = total_upi_collected_paise + ?,
                  updated_at = ?
              WHERE business_id = ? AND shift_date = ? AND status = 'OPEN'`,
        args: [effectiveUpi, endIso, businessId, todayDate],
      });
    }
  }

  // 7. If outstanding credit exists, update customer balance
  if (paymentReconciliation.outstandingPaise > 0 && effectiveCustomerId) {
    await db.execute({
      sql: `UPDATE customers
            SET outstanding_credit_paise = outstanding_credit_paise + ?,
                updated_at = ?
            WHERE id = ? AND business_id = ?`,
      args: [paymentReconciliation.outstandingPaise, endIso, effectiveCustomerId, businessId],
    });

    // Update shift credit given
    const todayDate = getKolkataDateString();
    await db.execute({
      sql: `UPDATE cash_shifts
            SET total_credit_given_paise = total_credit_given_paise + ?,
                updated_at = ?
            WHERE business_id = ? AND shift_date = ? AND status = 'OPEN'`,
      args: [paymentReconciliation.outstandingPaise, endIso, businessId, todayDate],
    });
  }

  // 8. Update game_session to COMPLETED
  await db.execute({
    sql: `UPDATE game_sessions
          SET end_time = ?, status = 'COMPLETED', duration_minutes = ?,
              table_charge_paise = ?, total_amount_paise = ?, discount_paise = ?,
              final_amount_paise = ?, customer_id = ?, notes = ?, updated_at = ?
          WHERE id = ?`,
    args: [
      endIso,
      calc.durationMinutes,
      calc.tableChargePaise,
      calc.subtotalPaise,
      calc.discountPaise,
      calc.finalAmountPaise,
      effectiveCustomerId,
      notes || null,
      endIso,
      sessionId,
    ],
  });

  return {
    billId,
    billNumber,
    finalAmountPaise: calc.finalAmountPaise,
    outstandingPaise: paymentReconciliation.outstandingPaise,
  };
}
