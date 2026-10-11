import { db } from "../db/client";
import { getKolkataDateString } from "../utils/date";
import type { ExpenseItem, ExpensePaidBy } from "../types";

export async function getExpenses(
  businessId: string,
  options?: {
    startDateIso?: string;
    endDateIso?: string;
    categoryId?: string;
  }
): Promise<ExpenseItem[]> {
  let sql = `
    SELECT e.*, ec.name as category_name
    FROM expenses e
    LEFT JOIN expense_categories ec ON e.category_id = ec.id
    WHERE e.business_id = ?
  `;
  const args: (string | number)[] = [businessId];

  if (options?.startDateIso) {
    sql += ` AND e.expense_date >= ?`;
    args.push(options.startDateIso);
  }

  if (options?.endDateIso) {
    sql += ` AND e.expense_date <= ?`;
    args.push(options.endDateIso);
  }

  if (options?.categoryId && options.categoryId !== "ALL") {
    sql += ` AND e.category_id = ?`;
    args.push(options.categoryId);
  }

  sql += ` ORDER BY e.expense_date DESC`;

  const res = await db.execute({ sql, args });

  return res.rows.map((row) => ({
    id: String(row.id),
    business_id: String(row.business_id),
    category_id: String(row.category_id),
    category_name: String(row.category_name || "Uncategorized"),
    title: String(row.title),
    amount_paise: Number(row.amount_paise),
    expense_date: String(row.expense_date),
    payment_method: row.payment_method as "CASH" | "UPI",
    paid_by: row.paid_by as ExpensePaidBy,
    payee: row.payee ? String(row.payee) : null,
    notes: row.notes ? String(row.notes) : null,
    receipt_url: row.receipt_url ? String(row.receipt_url) : null,
    created_by_user_id: String(row.created_by_user_id),
    created_at: String(row.created_at),
  }));
}

export async function getExpenseCategories(businessId: string): Promise<{ id: string; name: string }[]> {
  const res = await db.execute({
    sql: `SELECT id, name FROM expense_categories WHERE business_id = ? AND is_active = 1 ORDER BY display_order ASC, name ASC`,
    args: [businessId],
  });
  return res.rows.map((r) => ({ id: String(r.id), name: String(r.name) }));
}

export async function addExpense(params: {
  businessId: string;
  categoryId: string;
  title: string;
  amountPaise: number;
  expenseDate?: string;
  paymentMethod: "CASH" | "UPI";
  paidBy: ExpensePaidBy;
  payee?: string | null;
  notes?: string | null;
  receiptUrl?: string | null;
  userId: string;
}): Promise<ExpenseItem> {
  const {
    businessId,
    categoryId,
    title,
    amountPaise,
    expenseDate,
    paymentMethod,
    paidBy,
    payee,
    notes,
    receiptUrl,
    userId,
  } = params;

  if (amountPaise <= 0) {
    throw new Error("Expense amount must be greater than zero");
  }

  // Lookup category name
  const catRes = await db.execute({
    sql: `SELECT name FROM expense_categories WHERE id = ? AND business_id = ?`,
    args: [categoryId, businessId],
  });

  const categoryName = catRes.rows.length > 0 ? String(catRes.rows[0].name) : "Miscellaneous";
  const nowIso = new Date().toISOString();
  const dateToRecord = expenseDate || nowIso;
  const expenseId = `exp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  await db.execute({
    sql: `INSERT INTO expenses (
            id, business_id, category_id, category_name, title, amount_paise,
            expense_date, payment_method, paid_by, payee, notes, receipt_url,
            created_by_user_id, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      expenseId,
      businessId,
      categoryId,
      categoryName,
      title.trim(),
      amountPaise,
      dateToRecord,
      paymentMethod,
      paidBy,
      payee?.trim() || null,
      notes?.trim() || null,
      receiptUrl || null,
      userId,
      nowIso,
      nowIso,
    ],
  });

  // Important accounting rule:
  // ONLY if expense is CASH and paid from BUSINESS_DRAWER, it reduces physical drawer cash!
  // If paid by UPI or PERSONAL_FUNDS, drawer cash is untouched!
  if (paymentMethod === "CASH" && paidBy === "BUSINESS_DRAWER") {
    const todayDate = getKolkataDateString();
    await db.execute({
      sql: `UPDATE cash_shifts
            SET cash_expenses_paid_from_drawer_paise = cash_expenses_paid_from_drawer_paise + ?,
                updated_at = ?
            WHERE business_id = ? AND shift_date = ? AND status = 'OPEN'`,
      args: [amountPaise, nowIso, businessId, todayDate],
    });
  }

  return {
    id: expenseId,
    business_id: businessId,
    category_id: categoryId,
    category_name: categoryName,
    title: title.trim(),
    amount_paise: amountPaise,
    expense_date: dateToRecord,
    payment_method: paymentMethod,
    paid_by: paidBy,
    payee: payee?.trim() || null,
    notes: notes?.trim() || null,
    receipt_url: receiptUrl || null,
    created_by_user_id: userId,
    created_at: nowIso,
  };
}
