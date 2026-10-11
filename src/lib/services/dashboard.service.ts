import { db } from "../db/client";
import { getKolkataDateString, getKolkataDayBoundaries } from "../utils/date";
import { getTablesWithActiveSessions } from "./tables.service";
import type { DashboardOverview, BillItemRecord, ExpenseItem, CustomerItem } from "../types";

export async function getDashboardOverview(businessId: string): Promise<DashboardOverview> {
  const todayStr = getKolkataDateString();
  const { startIso, endIso } = getKolkataDayBoundaries(todayStr);

  // 1. Total Billed today (from bills created today)
  const billedRes = await db.execute({
    sql: `SELECT COALESCE(SUM(final_amount_paise), 0) as total_billed
          FROM bills
          WHERE business_id = ? AND created_at >= ? AND created_at <= ?`,
    args: [businessId, startIso, endIso],
  });
  const todayBilledPaise = Number(billedRes.rows[0].total_billed || 0);

  // 2. Payments collected today (from payments table)
  const paymentsRes = await db.execute({
    sql: `SELECT
            COALESCE(SUM(total_amount_paise), 0) as total_collected,
            COALESCE(SUM(cash_amount_paise), 0) as cash_collected,
            COALESCE(SUM(upi_amount_paise), 0) as upi_collected
          FROM payments
          WHERE business_id = ? AND created_at >= ? AND created_at <= ?`,
    args: [businessId, startIso, endIso],
  });

  const todayCollectedPaise = Number(paymentsRes.rows[0].total_collected || 0);
  const cashCollectedPaise = Number(paymentsRes.rows[0].cash_collected || 0);
  const upiCollectedPaise = Number(paymentsRes.rows[0].upi_collected || 0);

  // 3. Expenses today
  const expensesRes = await db.execute({
    sql: `SELECT
            COALESCE(SUM(amount_paise), 0) as total_expenses,
            COALESCE(SUM(CASE WHEN payment_method = 'CASH' AND paid_by = 'BUSINESS_DRAWER' THEN amount_paise ELSE 0 END), 0) as drawer_cash_expenses
          FROM expenses
          WHERE business_id = ? AND expense_date >= ? AND expense_date <= ?`,
    args: [businessId, startIso, endIso],
  });
  const todayExpensesPaise = Number(expensesRes.rows[0].total_expenses || 0);
  const drawerCashExpensesPaise = Number(expensesRes.rows[0].drawer_cash_expenses || 0);

  // 4. Total outstanding customer credit (all-time active)
  const creditRes = await db.execute({
    sql: `SELECT COALESCE(SUM(outstanding_credit_paise), 0) as total_credit
          FROM customers
          WHERE business_id = ? AND outstanding_credit_paise > 0`,
    args: [businessId],
  });
  const totalOutstandingCreditPaise = Number(creditRes.rows[0].total_credit || 0);

  // 5. Games played today (completed or active sessions created today)
  const gamesRes = await db.execute({
    sql: `SELECT
            COUNT(CASE WHEN t.type = 'POOL' THEN s.id END) as pool_games,
            COUNT(CASE WHEN t.type = 'SNOOKER' THEN s.id END) as snooker_games
          FROM game_sessions s
          JOIN tables t ON s.table_id = t.id
          WHERE s.business_id = ? AND s.start_time >= ? AND s.start_time <= ? AND s.status != 'CANCELLED'`,
    args: [businessId, startIso, endIso],
  });
  const poolGamesPlayedToday = Number(gamesRes.rows[0].pool_games || 0);
  const snookerGamesPlayedToday = Number(gamesRes.rows[0].snooker_games || 0);

  // 6. Active tables count
  const allTables = await getTablesWithActiveSessions(businessId);
  const activePoolTables = allTables.filter((t) => t.type === "POOL" && t.active_session).length;
  const activeSnookerTables = allTables.filter((t) => t.type === "SNOOKER" && t.active_session).length;

  const activeSessions = allTables
    .map((t) => t.active_session)
    .filter((s): s is NonNullable<typeof s> => !!s);

  // 7. Counter sales billed today
  const counterSalesRes = await db.execute({
    sql: `SELECT COALESCE(SUM(final_amount_paise), 0) as counter_sales
          FROM bills
          WHERE business_id = ? AND bill_type = 'COUNTER' AND created_at >= ? AND created_at <= ?`,
    args: [businessId, startIso, endIso],
  });
  const counterSalesPaise = Number(counterSalesRes.rows[0].counter_sales || 0);

  // 8. Shift status
  const shiftRes = await db.execute({
    sql: `SELECT status FROM cash_shifts WHERE business_id = ? AND shift_date = ?`,
    args: [businessId, todayStr],
  });
  const isShiftOpen = shiftRes.rows.length === 0 || shiftRes.rows[0].status === "OPEN";

  // 9. Recent bills (last 8)
  const recentBillsRes = await db.execute({
    sql: `SELECT b.*, c.name as customer_name
          FROM bills b
          LEFT JOIN customers c ON b.customer_id = c.id
          WHERE b.business_id = ?
          ORDER BY b.created_at DESC LIMIT 8`,
    args: [businessId],
  });

  const recentBills: BillItemRecord[] = recentBillsRes.rows.map((r) => ({
    id: String(r.id),
    bill_number: String(r.bill_number),
    session_id: r.session_id ? String(r.session_id) : null,
    customer_id: r.customer_id ? String(r.customer_id) : null,
    customer_name: r.customer_name ? String(r.customer_name) : undefined,
    bill_type: r.bill_type as any,
    subtotal_paise: Number(r.subtotal_paise),
    discount_paise: Number(r.discount_paise || 0),
    final_amount_paise: Number(r.final_amount_paise),
    paid_amount_paise: Number(r.paid_amount_paise),
    outstanding_paise: Number(r.outstanding_paise),
    payment_status: r.payment_status as any,
    notes: r.notes ? String(r.notes) : null,
    created_at: String(r.created_at),
  }));

  // 10. Recent expenses (last 5)
  const recentExpRes = await db.execute({
    sql: `SELECT e.*, ec.name as category_name
          FROM expenses e
          LEFT JOIN expense_categories ec ON e.category_id = ec.id
          WHERE e.business_id = ?
          ORDER BY e.expense_date DESC LIMIT 5`,
    args: [businessId],
  });

  const recentExpenses: ExpenseItem[] = recentExpRes.rows.map((r) => ({
    id: String(r.id),
    business_id: String(r.business_id),
    category_id: String(r.category_id),
    category_name: String(r.category_name || "Misc"),
    title: String(r.title),
    amount_paise: Number(r.amount_paise),
    expense_date: String(r.expense_date),
    payment_method: r.payment_method as any,
    paid_by: r.paid_by as any,
    payee: r.payee ? String(r.payee) : null,
    notes: r.notes ? String(r.notes) : null,
    receipt_url: r.receipt_url ? String(r.receipt_url) : null,
    created_by_user_id: String(r.created_by_user_id),
    created_at: String(r.created_at),
  }));

  // 11. Top debtors (customers with highest outstanding balances)
  const debtorsRes = await db.execute({
    sql: `SELECT * FROM customers
          WHERE business_id = ? AND outstanding_credit_paise > 0
          ORDER BY outstanding_credit_paise DESC LIMIT 5`,
    args: [businessId],
  });

  const topDebtors: CustomerItem[] = debtorsRes.rows.map((r) => ({
    id: String(r.id),
    business_id: String(r.business_id),
    name: String(r.name),
    phone: r.phone ? String(r.phone) : null,
    notes: r.notes ? String(r.notes) : null,
    outstanding_credit_paise: Number(r.outstanding_credit_paise),
    created_at: String(r.created_at),
    updated_at: String(r.updated_at),
  }));

  return {
    date: todayStr,
    todayBilledPaise,
    todayCollectedPaise,
    cashCollectedPaise,
    upiCollectedPaise,
    todayExpensesPaise,
    drawerCashExpensesPaise,
    totalOutstandingCreditPaise,
    poolGamesPlayedToday,
    snookerGamesPlayedToday,
    activePoolTables,
    activeSnookerTables,
    counterSalesPaise,
    isShiftOpen,
    activeSessions,
    recentBills,
    recentExpenses,
    topDebtors,
  };
}
