import { db } from "../db/client";

export interface ReportFilter {
  startIso: string;
  endIso: string;
}

export async function getAnalyticsReport(businessId: string, filter: ReportFilter) {
  const { startIso, endIso } = filter;

  // 1. Table Bills vs Counter Bills
  const billsSummaryRes = await db.execute({
    sql: `SELECT
            COUNT(CASE WHEN bill_type = 'TABLE' THEN id END) as table_bills_count,
            COUNT(CASE WHEN bill_type = 'COUNTER' THEN id END) as counter_bills_count,
            COALESCE(SUM(CASE WHEN bill_type = 'TABLE' THEN final_amount_paise ELSE 0 END), 0) as table_revenue_paise,
            COALESCE(SUM(CASE WHEN bill_type = 'COUNTER' THEN final_amount_paise ELSE 0 END), 0) as shop_sales_paise,
            COALESCE(SUM(final_amount_paise), 0) as total_billed_paise,
            COALESCE(SUM(outstanding_paise), 0) as credit_created_paise
          FROM bills
          WHERE business_id = ? AND created_at >= ? AND created_at <= ?`,
    args: [businessId, startIso, endIso],
  });

  const bSummary = billsSummaryRes.rows[0];

  // 2. Collections by Payment Method
  const paymentsRes = await db.execute({
    sql: `SELECT
            COALESCE(SUM(total_amount_paise), 0) as total_collected_paise,
            COALESCE(SUM(cash_amount_paise), 0) as cash_collected_paise,
            COALESCE(SUM(upi_amount_paise), 0) as upi_collected_paise,
            COALESCE(SUM(CASE WHEN payment_type = 'UDHAAR_REPAYMENT' THEN total_amount_paise ELSE 0 END), 0) as credit_collected_paise
          FROM payments
          WHERE business_id = ? AND created_at >= ? AND created_at <= ?`,
    args: [businessId, startIso, endIso],
  });

  const pSummary = paymentsRes.rows[0];

  // 3. Pool vs Snooker breakdown
  const gameStatsRes = await db.execute({
    sql: `SELECT
            t.type as game_type,
            COUNT(s.id) as games_count,
            COALESCE(SUM(s.duration_minutes), 0) as total_minutes,
            COALESCE(SUM(s.table_charge_paise), 0) as table_revenue_paise
          FROM game_sessions s
          JOIN tables t ON s.table_id = t.id
          WHERE s.business_id = ? AND s.start_time >= ? AND s.start_time <= ? AND s.status = 'COMPLETED'
          GROUP BY t.type`,
    args: [businessId, startIso, endIso],
  });

  let poolGames = 0;
  let poolMinutes = 0;
  let poolRevenuePaise = 0;
  let snookerGames = 0;
  let snookerMinutes = 0;
  let snookerRevenuePaise = 0;

  for (const row of gameStatsRes.rows) {
    if (row.game_type === "POOL") {
      poolGames = Number(row.games_count);
      poolMinutes = Number(row.total_minutes);
      poolRevenuePaise = Number(row.table_revenue_paise);
    } else if (row.game_type === "SNOOKER") {
      snookerGames = Number(row.games_count);
      snookerMinutes = Number(row.total_minutes);
      snookerRevenuePaise = Number(row.table_revenue_paise);
    }
  }

  // 4. Expenses breakdown
  const expensesRes = await db.execute({
    sql: `SELECT
            COALESCE(SUM(amount_paise), 0) as total_expenses_paise,
            COALESCE(SUM(CASE WHEN payment_method = 'CASH' THEN amount_paise ELSE 0 END), 0) as cash_expenses_paise,
            COALESCE(SUM(CASE WHEN payment_method = 'UPI' THEN amount_paise ELSE 0 END), 0) as upi_expenses_paise
          FROM expenses
          WHERE business_id = ? AND expense_date >= ? AND expense_date <= ?`,
    args: [businessId, startIso, endIso],
  });

  const expSummary = expensesRes.rows[0];

  const expensesByCategoryRes = await db.execute({
    sql: `SELECT ec.name as category_name, COALESCE(SUM(e.amount_paise), 0) as total_paise
          FROM expenses e
          JOIN expense_categories ec ON e.category_id = ec.id
          WHERE e.business_id = ? AND e.expense_date >= ? AND e.expense_date <= ?
          GROUP BY ec.id
          ORDER BY total_paise DESC`,
    args: [businessId, startIso, endIso],
  });

  // 5. Shop Gross Profit Estimate
  // (Selling Price - Cost Price) on products sold via Bill Items
  const shopProfitRes = await db.execute({
    sql: `SELECT
            COALESCE(SUM(bi.quantity * bi.unit_price_paise), 0) as shop_gross_sales_paise,
            COALESCE(SUM(bi.quantity * bi.unit_cost_paise), 0) as shop_cogs_paise
          FROM bill_items bi
          JOIN bills b ON bi.bill_id = b.id
          WHERE bi.business_id = ? AND bi.item_type = 'PRODUCT'
            AND b.created_at >= ? AND b.created_at <= ?`,
    args: [businessId, startIso, endIso],
  });

  const grossSalesPaise = Number(shopProfitRes.rows[0].shop_gross_sales_paise || 0);
  const cogsPaise = Number(shopProfitRes.rows[0].shop_cogs_paise || 0);
  const shopGrossProfitPaise = grossSalesPaise - cogsPaise;

  // 6. Table performance
  const tablePerfRes = await db.execute({
    sql: `SELECT
            t.id, t.name, t.type,
            COUNT(s.id) as sessions_count,
            COALESCE(SUM(s.duration_minutes), 0) as total_duration_minutes,
            COALESCE(SUM(s.table_charge_paise), 0) as total_revenue_paise
          FROM tables t
          LEFT JOIN game_sessions s ON t.id = s.table_id
            AND s.start_time >= ? AND s.start_time <= ? AND s.status = 'COMPLETED'
          WHERE t.business_id = ? AND t.is_active = 1
          GROUP BY t.id
          ORDER BY t.type ASC, total_revenue_paise DESC`,
    args: [startIso, endIso, businessId],
  });

  // 7. Product sales performance
  const prodPerfRes = await db.execute({
    sql: `SELECT
            bi.product_id, bi.item_name,
            COALESCE(SUM(bi.quantity), 0) as units_sold,
            COALESCE(SUM(bi.total_price_paise), 0) as total_sales_paise,
            COALESCE(SUM(bi.quantity * (bi.unit_price_paise - bi.unit_cost_paise)), 0) as estimated_profit_paise
          FROM bill_items bi
          JOIN bills b ON bi.bill_id = b.id
          WHERE bi.business_id = ? AND bi.item_type = 'PRODUCT'
            AND b.created_at >= ? AND b.created_at <= ?
          GROUP BY bi.item_name
          ORDER BY total_sales_paise DESC LIMIT 10`,
    args: [businessId, startIso, endIso],
  });

  // Net operating cash flow / operating result
  const totalCollected = Number(pSummary.total_collected_paise || 0);
  const totalExpenses = Number(expSummary.total_expenses_paise || 0);
  const netOperatingResultPaise = totalCollected - totalExpenses;

  return {
    overview: {
      totalBilledPaise: Number(bSummary.total_billed_paise || 0),
      totalCollectedPaise: totalCollected,
      cashCollectedPaise: Number(pSummary.cash_collected_paise || 0),
      upiCollectedPaise: Number(pSummary.upi_collected_paise || 0),
      tableRevenuePaise: Number(bSummary.table_revenue_paise || 0),
      shopSalesPaise: Number(bSummary.shop_sales_paise || 0),
      totalExpensesPaise: totalExpenses,
      cashExpensesPaise: Number(expSummary.cash_expenses_paise || 0),
      upiExpensesPaise: Number(expSummary.upi_expenses_paise || 0),
      creditCreatedPaise: Number(bSummary.credit_created_paise || 0),
      creditCollectedPaise: Number(pSummary.credit_collected_paise || 0),
      shopGrossProfitPaise,
      shopCogsPaise: cogsPaise,
      netOperatingResultPaise,
      poolGames,
      poolMinutes,
      poolRevenuePaise,
      snookerGames,
      snookerMinutes,
      snookerRevenuePaise,
    },
    tables: tablePerfRes.rows.map((r) => ({
      id: String(r.id),
      name: String(r.name),
      type: String(r.type),
      sessionsCount: Number(r.sessions_count || 0),
      totalDurationMinutes: Number(r.total_duration_minutes || 0),
      totalRevenuePaise: Number(r.total_revenue_paise || 0),
    })),
    products: prodPerfRes.rows.map((r) => ({
      name: String(r.item_name),
      unitsSold: Number(r.units_sold || 0),
      totalSalesPaise: Number(r.total_sales_paise || 0),
      profitPaise: Number(r.estimated_profit_paise || 0),
    })),
    expensesByCategory: expensesByCategoryRes.rows.map((r) => ({
      name: String(r.category_name),
      totalPaise: Number(r.total_paise || 0),
    })),
  };
}

export async function exportCsvData(
  businessId: string,
  type: "bills" | "expenses" | "customers" | "products"
): Promise<string> {
  if (type === "bills") {
    const res = await db.execute({
      sql: `SELECT b.bill_number, b.created_at, b.bill_type, c.name as customer,
                   b.final_amount_paise, b.paid_amount_paise, b.outstanding_paise, b.payment_status
            FROM bills b
            LEFT JOIN customers c ON b.customer_id = c.id
            WHERE b.business_id = ?
            ORDER BY b.created_at DESC`,
      args: [businessId],
    });

    const header = "Bill Number,Date,Type,Customer,Final Amount (Rs),Paid (Rs),Outstanding (Rs),Status\n";
    const rows = res.rows.map((r) =>
      `"${r.bill_number}","${r.created_at}","${r.bill_type}","${r.customer || "Walk-in"}",${(Number(r.final_amount_paise) / 100).toFixed(2)},${(Number(r.paid_amount_paise) / 100).toFixed(2)},${(Number(r.outstanding_paise) / 100).toFixed(2)},"${r.payment_status}"`
    );
    return header + rows.join("\n");
  }

  if (type === "expenses") {
    const res = await db.execute({
      sql: `SELECT expense_date, title, category_name, amount_paise, payment_method, paid_by, payee, notes
            FROM expenses
            WHERE business_id = ?
            ORDER BY expense_date DESC`,
      args: [businessId],
    });

    const header = "Date,Title,Category,Amount (Rs),Payment Method,Paid By,Payee,Notes\n";
    const rows = res.rows.map((r) =>
      `"${r.expense_date}","${r.title}","${r.category_name}",${(Number(r.amount_paise) / 100).toFixed(2)},"${r.payment_method}","${r.paid_by}","${r.payee || ""}","${r.notes || ""}"`
    );
    return header + rows.join("\n");
  }

  if (type === "customers") {
    const res = await db.execute({
      sql: `SELECT name, phone, outstanding_credit_paise, notes, created_at
            FROM customers
            WHERE business_id = ?
            ORDER BY outstanding_credit_paise DESC, name ASC`,
      args: [businessId],
    });

    const header = "Customer Name,Phone,Outstanding Credit (Rs),Notes,Created At\n";
    const rows = res.rows.map((r) =>
      `"${r.name}","${r.phone || ""}",${(Number(r.outstanding_credit_paise) / 100).toFixed(2)},"${r.notes || ""}","${r.created_at}"`
    );
    return header + rows.join("\n");
  }

  // products
  const res = await db.execute({
    sql: `SELECT name, category, selling_price_paise, cost_price_paise, current_stock, unit
          FROM products
          WHERE business_id = ? AND is_active = 1
          ORDER BY category ASC, name ASC`,
    args: [businessId],
  });

  const header = "Product Name,Category,Selling Price (Rs),Cost Price (Rs),Current Stock,Unit\n";
  const rows = res.rows.map((r) =>
    `"${r.name}","${r.category}",${(Number(r.selling_price_paise) / 100).toFixed(2)},${(Number(r.cost_price_paise) / 100).toFixed(2)},${r.current_stock},"${r.unit}"`
  );
  return header + rows.join("\n");
}
