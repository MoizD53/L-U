import { db } from "../db/client";
import { getKolkataDateString } from "../utils/date";
import type { ShiftItem } from "../types";

export async function getTodayCashShift(
  businessId: string,
  dateStr?: string
): Promise<{
  shift: ShiftItem;
  hasActiveSessions: boolean;
  activeSessionsCount: number;
  cashMovements: any[];
}> {
  const targetDate = dateStr || getKolkataDateString();
  const nowIso = new Date().toISOString();

  // Find or automatically initialize today's shift
  let shiftRes = await db.execute({
    sql: `SELECT * FROM cash_shifts WHERE business_id = ? AND shift_date = ?`,
    args: [businessId, targetDate],
  });

  if (shiftRes.rows.length === 0) {
    // Check previous day closing cash to carry forward as opening cash
    const prevShiftRes = await db.execute({
      sql: `SELECT actual_counted_cash_paise, expected_closing_cash_paise
            FROM cash_shifts
            WHERE business_id = ? AND shift_date < ?
            ORDER BY shift_date DESC LIMIT 1`,
      args: [businessId, targetDate],
    });

    let carriedOpeningCash = 200000; // Default ₹2,000 opening float
    if (prevShiftRes.rows.length > 0) {
      carriedOpeningCash = Number(
        prevShiftRes.rows[0].actual_counted_cash_paise ||
          prevShiftRes.rows[0].expected_closing_cash_paise ||
          200000
      );
    }

    const shiftId = `shift_${targetDate}`;
    await db.execute({
      sql: `INSERT INTO cash_shifts (
              id, business_id, shift_date, opened_at, status, opening_cash_paise,
              created_at, updated_at
            ) VALUES (?, ?, ?, ?, 'OPEN', ?, ?, ?)`,
      args: [
        shiftId,
        businessId,
        targetDate,
        nowIso,
        carriedOpeningCash,
        nowIso,
        nowIso,
      ],
    });

    shiftRes = await db.execute({
      sql: `SELECT * FROM cash_shifts WHERE id = ?`,
      args: [shiftId],
    });
  }

  const s = shiftRes.rows[0];

  // Fetch cash movements (additions / withdrawals)
  const movRes = await db.execute({
    sql: `SELECT * FROM cash_movements WHERE shift_id = ? ORDER BY created_at ASC`,
    args: [s.id],
  });

  let cashAdded = 0;
  let cashWithdrawn = 0;

  for (const m of movRes.rows) {
    const amt = Number(m.amount_paise);
    if (m.movement_type === "ADDITION" || m.movement_type === "CASH_IN") {
      cashAdded += amt;
    } else {
      cashWithdrawn += amt;
    }
  }

  const opening = Number(s.opening_cash_paise || 0);
  const tableCash = Number(s.table_cash_collected_paise || 0);
  const shopCash = Number(s.shop_cash_collected_paise || 0);
  const udhaarCash = Number(s.udhaar_cash_collected_paise || 0);
  const drawerExpenses = Number(s.cash_expenses_paid_from_drawer_paise || 0);

  const expectedClosing =
    opening + tableCash + shopCash + udhaarCash + cashAdded - drawerExpenses - cashWithdrawn;

  // Check running active sessions
  const activeSessionsRes = await db.execute({
    sql: `SELECT COUNT(*) as count FROM game_sessions WHERE business_id = ? AND status = 'ACTIVE'`,
    args: [businessId],
  });

  const activeCount = Number(activeSessionsRes.rows[0].count || 0);

  const shiftItem: ShiftItem = {
    id: String(s.id),
    business_id: String(s.business_id),
    shift_date: String(s.shift_date),
    opened_at: String(s.opened_at),
    closed_at: s.closed_at ? String(s.closed_at) : null,
    status: s.status as "OPEN" | "CLOSED",
    opening_cash_paise: opening,
    table_cash_collected_paise: tableCash,
    shop_cash_collected_paise: shopCash,
    udhaar_cash_collected_paise: udhaarCash,
    cash_expenses_paid_from_drawer_paise: drawerExpenses,
    cash_added_paise: cashAdded,
    cash_withdrawn_paise: cashWithdrawn,
    expected_closing_cash_paise: expectedClosing,
    actual_counted_cash_paise: Number(s.actual_counted_cash_paise || 0),
    cash_difference_paise: Number(s.cash_difference_paise || 0),
    total_upi_collected_paise: Number(s.total_upi_collected_paise || 0),
    total_billed_paise: Number(s.total_billed_paise || 0),
    total_credit_given_paise: Number(s.total_credit_given_paise || 0),
    closing_notes: s.closing_notes ? String(s.closing_notes) : null,
    closed_by_user_id: s.closed_by_user_id ? String(s.closed_by_user_id) : null,
  };

  return {
    shift: shiftItem,
    hasActiveSessions: activeCount > 0,
    activeSessionsCount: activeCount,
    cashMovements: movRes.rows.map((r) => ({ ...r })),
  };
}

export async function recordCashMovement(params: {
  businessId: string;
  shiftId: string;
  movementType: "ADDITION" | "WITHDRAWAL";
  amountPaise: number;
  reason: string;
  userId: string;
}): Promise<void> {
  const { businessId, shiftId, movementType, amountPaise, reason, userId } = params;
  if (amountPaise <= 0) throw new Error("Amount must be greater than zero");

  const nowIso = new Date().toISOString();
  await db.execute({
    sql: `INSERT INTO cash_movements (
            id, shift_id, business_id, movement_type, amount_paise, reason,
            created_by_user_id, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      `cmov_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      shiftId,
      businessId,
      movementType,
      amountPaise,
      reason.trim(),
      userId,
      nowIso,
    ],
  });
}

export async function closeTodayHisab(params: {
  businessId: string;
  shiftId: string;
  actualCountedCashPaise: number;
  closingNotes?: string | null;
  userId: string;
  userName: string;
}): Promise<ShiftItem> {
  const {
    businessId,
    shiftId,
    actualCountedCashPaise,
    closingNotes,
    userId,
    userName,
  } = params;

  const current = await getTodayCashShift(businessId);
  const shift = current.shift;

  if (shift.status === "CLOSED") {
    throw new Error("This daily hisab shift has already been closed.");
  }

  const expectedClosing = shift.expected_closing_cash_paise;
  const cashDifference = actualCountedCashPaise - expectedClosing;

  // If cash difference exceeds ₹100 (10000 paise) require note
  if (Math.abs(cashDifference) > 10000 && (!closingNotes || closingNotes.trim().length === 0)) {
    throw new Error(
      "A note explaining the cash difference is required when drawer discrepancy exceeds ₹100."
    );
  }

  const nowIso = new Date().toISOString();

  await db.execute({
    sql: `UPDATE cash_shifts
          SET status = 'CLOSED', closed_at = ?, expected_closing_cash_paise = ?,
              actual_counted_cash_paise = ?, cash_difference_paise = ?,
              closing_notes = ?, closed_by_user_id = ?, updated_at = ?
          WHERE id = ? AND business_id = ?`,
    args: [
      nowIso,
      expectedClosing,
      actualCountedCashPaise,
      cashDifference,
      closingNotes?.trim() || null,
      userId,
      nowIso,
      shiftId,
      businessId,
    ],
  });

  // Audit log
  await db.execute({
    sql: `INSERT INTO audit_logs (
            id, business_id, user_id, user_name, action, entity_type, entity_id,
            old_values_json, new_values_json, reason, created_at
          ) VALUES (?, ?, ?, ?, 'DAILY_HISAB_CLOSED', 'CASH_SHIFT', ?, ?, ?, ?, ?)`,
    args: [
      `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      businessId,
      userId,
      userName,
      shiftId,
      JSON.stringify({ status: "OPEN" }),
      JSON.stringify({
        status: "CLOSED",
        expectedClosing,
        actualCountedCashPaise,
        cashDifference,
      }),
      closingNotes || "Daily hisab closing finalized",
      nowIso,
    ],
  });

  return (await getTodayCashShift(businessId)).shift;
}
