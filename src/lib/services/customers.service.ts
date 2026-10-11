import { db } from "../db/client";
import { getKolkataDateString } from "../utils/date";
import type { CustomerItem, PaymentMethod } from "../types";

export async function getCustomers(
  businessId: string,
  search?: string
): Promise<CustomerItem[]> {
  let sql = `
    SELECT c.*,
      COUNT(DISTINCT s.id) as total_games_played,
      COUNT(DISTINCT CASE WHEN t.type = 'POOL' THEN s.id END) as pool_games_played,
      COUNT(DISTINCT CASE WHEN t.type = 'SNOOKER' THEN s.id END) as snooker_games_played,
      COALESCE(SUM(b.final_amount_paise), 0) as total_billed_paise,
      COALESCE(SUM(b.paid_amount_paise), 0) as total_paid_paise,
      MAX(s.start_time) as last_visit
    FROM customers c
    LEFT JOIN game_sessions s ON c.id = s.customer_id
    LEFT JOIN tables t ON s.table_id = t.id
    LEFT JOIN bills b ON c.id = b.customer_id
    WHERE c.business_id = ?
  `;

  const args: (string | number)[] = [businessId];

  if (search && search.trim().length > 0) {
    sql += ` AND (c.name LIKE ? OR c.phone LIKE ?)`;
    const term = `%${search.trim()}%`;
    args.push(term, term);
  }

  sql += ` GROUP BY c.id ORDER BY c.outstanding_credit_paise DESC, c.name ASC`;

  const res = await db.execute({ sql, args });

  return res.rows.map((row) => ({
    id: String(row.id),
    business_id: String(row.business_id),
    name: String(row.name),
    phone: row.phone ? String(row.phone) : null,
    notes: row.notes ? String(row.notes) : null,
    outstanding_credit_paise: Number(row.outstanding_credit_paise || 0),
    total_games_played: Number(row.total_games_played || 0),
    pool_games_played: Number(row.pool_games_played || 0),
    snooker_games_played: Number(row.snooker_games_played || 0),
    total_billed_paise: Number(row.total_billed_paise || 0),
    total_paid_paise: Number(row.total_paid_paise || 0),
    last_visit: row.last_visit ? String(row.last_visit) : null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  }));
}

export async function getCustomerDetail(
  businessId: string,
  customerId: string
): Promise<{
  customer: CustomerItem;
  sessions: any[];
  bills: any[];
  payments: any[];
}> {
  const custRes = await db.execute({
    sql: `SELECT * FROM customers WHERE id = ? AND business_id = ?`,
    args: [customerId, businessId],
  });

  if (custRes.rows.length === 0) {
    throw new Error("Customer not found");
  }

  const cRow = custRes.rows[0];

  const sessionsRes = await db.execute({
    sql: `SELECT s.*, t.name as table_name, t.type as table_type
          FROM game_sessions s
          JOIN tables t ON s.table_id = t.id
          WHERE s.customer_id = ?
          ORDER BY s.start_time DESC`,
    args: [customerId],
  });

  const billsRes = await db.execute({
    sql: `SELECT * FROM bills WHERE customer_id = ? ORDER BY created_at DESC`,
    args: [customerId],
  });

  const paymentsRes = await db.execute({
    sql: `SELECT * FROM payments WHERE customer_id = ? ORDER BY created_at DESC`,
    args: [customerId],
  });

  return {
    customer: {
      id: String(cRow.id),
      business_id: String(cRow.business_id),
      name: String(cRow.name),
      phone: cRow.phone ? String(cRow.phone) : null,
      notes: cRow.notes ? String(cRow.notes) : null,
      outstanding_credit_paise: Number(cRow.outstanding_credit_paise || 0),
      created_at: String(cRow.created_at),
      updated_at: String(cRow.updated_at),
    },
    sessions: sessionsRes.rows.map((r) => ({ ...r })),
    bills: billsRes.rows.map((r) => ({ ...r })),
    payments: paymentsRes.rows.map((r) => ({ ...r })),
  };
}

export async function createCustomer(params: {
  businessId: string;
  name: string;
  phone?: string | null;
  notes?: string | null;
}): Promise<CustomerItem> {
  const { businessId, name, phone, notes } = params;
  const nowIso = new Date().toISOString();

  // If phone is provided, check if already exists
  if (phone && phone.trim().length > 0) {
    const existing = await db.execute({
      sql: `SELECT * FROM customers WHERE business_id = ? AND phone = ?`,
      args: [businessId, phone.trim()],
    });
    if (existing.rows.length > 0) {
      throw new Error(`A customer with phone number ${phone} is already registered as "${existing.rows[0].name}"`);
    }
  }

  const customerId = `cust_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  await db.execute({
    sql: `INSERT INTO customers (id, business_id, name, phone, notes, outstanding_credit_paise, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, 0, ?, ?)`,
    args: [customerId, businessId, name.trim(), phone?.trim() || null, notes?.trim() || null, nowIso, nowIso],
  });

  return {
    id: customerId,
    business_id: businessId,
    name: name.trim(),
    phone: phone?.trim() || null,
    notes: notes?.trim() || null,
    outstanding_credit_paise: 0,
    created_at: nowIso,
    updated_at: nowIso,
  };
}

export async function collectUdhaarRepayment(params: {
  businessId: string;
  customerId: string;
  amountPaise: number;
  paymentMethod: PaymentMethod;
  cashAmountPaise?: number;
  upiAmountPaise?: number;
  notes?: string | null;
  userId: string;
  userName: string;
}): Promise<{ remainingBalancePaise: number; paymentId: string }> {
  const {
    businessId,
    customerId,
    amountPaise,
    paymentMethod,
    cashAmountPaise = 0,
    upiAmountPaise = 0,
    notes,
    userId,
    userName,
  } = params;

  if (amountPaise <= 0) {
    throw new Error("Repayment amount must be greater than zero");
  }

  const custRes = await db.execute({
    sql: `SELECT * FROM customers WHERE id = ? AND business_id = ?`,
    args: [customerId, businessId],
  });

  if (custRes.rows.length === 0) {
    throw new Error("Customer not found");
  }

  const customer = custRes.rows[0];
  const currentCredit = Number(customer.outstanding_credit_paise || 0);

  if (currentCredit <= 0) {
    throw new Error("This customer currently has zero outstanding credit (Udhaar).");
  }

  if (amountPaise > currentCredit) {
    throw new Error(`Repayment amount exceeds outstanding balance of ₹${(currentCredit / 100).toFixed(2)}`);
  }

  const effectiveCash = paymentMethod === "CASH" ? amountPaise : paymentMethod === "SPLIT" ? cashAmountPaise : 0;
  const effectiveUpi = paymentMethod === "UPI" ? amountPaise : paymentMethod === "SPLIT" ? upiAmountPaise : 0;

  if (effectiveCash + effectiveUpi !== amountPaise) {
    throw new Error("Split cash and UPI amounts must equal the total repayment amount");
  }

  const nowIso = new Date().toISOString();
  const paymentId = `pay_udh_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  // 1. Record payment transaction
  await db.execute({
    sql: `INSERT INTO payments (
            id, business_id, bill_id, customer_id, payment_type, payment_method,
            cash_amount_paise, upi_amount_paise, total_amount_paise, reference_note,
            created_by_user_id, created_at
          ) VALUES (?, ?, NULL, ?, 'UDHAAR_REPAYMENT', ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      paymentId,
      businessId,
      customerId,
      paymentMethod,
      effectiveCash,
      effectiveUpi,
      amountPaise,
      notes || "Udhaar credit repayment",
      userId,
      nowIso,
    ],
  });

  // 2. Safely deduct from customer outstanding balance
  const remainingBalancePaise = currentCredit - amountPaise;
  await db.execute({
    sql: `UPDATE customers
          SET outstanding_credit_paise = ?, updated_at = ?
          WHERE id = ?`,
    args: [remainingBalancePaise, nowIso, customerId],
  });

  // 3. Update shift drawer cash collections
  const todayDate = getKolkataDateString();
  if (effectiveCash > 0) {
    await db.execute({
      sql: `UPDATE cash_shifts
            SET udhaar_cash_collected_paise = udhaar_cash_collected_paise + ?,
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

  // 4. Record audit log
  await db.execute({
    sql: `INSERT INTO audit_logs (
            id, business_id, user_id, user_name, action, entity_type, entity_id,
            old_values_json, new_values_json, reason, created_at
          ) VALUES (?, ?, ?, ?, 'UDHAAR_COLLECTED', 'CUSTOMER', ?, ?, ?, ?, ?)`,
    args: [
      `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      businessId,
      userId,
      userName,
      customerId,
      JSON.stringify({ previousCreditPaise: currentCredit }),
      JSON.stringify({ repaidPaise: amountPaise, remainingCreditPaise: remainingBalancePaise, method: paymentMethod }),
      notes || "Collected udhaar repayment",
      nowIso,
    ],
  });

  return { remainingBalancePaise, paymentId };
}
