import { db } from "./client";

export async function initDatabase(): Promise<void> {
  const url = process.env.DATABASE_URL || "";
  const isRemote = url.startsWith("libsql://") || url.startsWith("https://");
  if (!isRemote) {
    try {
      await db.execute(`PRAGMA foreign_keys = ON;`);
      await db.execute(`PRAGMA journal_mode = WAL;`);
      await db.execute(`PRAGMA busy_timeout = 5000;`);
    } catch {
      // Ignored for environments that don't support pragma execution
    }
  }

  await db.execute(`
    CREATE TABLE IF NOT EXISTS businesses (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      tagline TEXT,
      location TEXT NOT NULL,
      phone TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      business_id TEXT NOT NULL,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('OWNER', 'MANAGER')),
      phone TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS rate_plans (
      id TEXT PRIMARY KEY,
      business_id TEXT NOT NULL,
      name TEXT NOT NULL,
      game_type TEXT NOT NULL CHECK(game_type IN ('POOL', 'SNOOKER')),
      hourly_rate_paise INTEGER NOT NULL,
      minimum_charge_paise INTEGER NOT NULL DEFAULT 0,
      billing_increment_minutes INTEGER NOT NULL DEFAULT 1,
      rounding_mode TEXT NOT NULL DEFAULT 'CEIL' CHECK(rounding_mode IN ('CEIL', 'ROUND', 'EXACT')),
      is_default INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS tables (
      id TEXT PRIMARY KEY,
      business_id TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('POOL', 'SNOOKER')),
      rate_plan_id TEXT,
      display_order INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
      FOREIGN KEY (rate_plan_id) REFERENCES rate_plans(id) ON DELETE SET NULL
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      business_id TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      notes TEXT,
      outstanding_credit_paise INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS game_sessions (
      id TEXT PRIMARY KEY,
      business_id TEXT NOT NULL,
      table_id TEXT NOT NULL,
      customer_id TEXT,
      start_time TEXT NOT NULL,
      end_time TEXT,
      status TEXT NOT NULL CHECK(status IN ('ACTIVE', 'COMPLETED', 'CANCELLED')),
      snapshot_hourly_rate_paise INTEGER NOT NULL,
      snapshot_minimum_charge_paise INTEGER NOT NULL DEFAULT 0,
      snapshot_increment_minutes INTEGER NOT NULL DEFAULT 1,
      snapshot_rounding_mode TEXT NOT NULL DEFAULT 'CEIL',
      duration_minutes INTEGER NOT NULL DEFAULT 0,
      table_charge_paise INTEGER NOT NULL DEFAULT 0,
      items_charge_paise INTEGER NOT NULL DEFAULT 0,
      total_amount_paise INTEGER NOT NULL DEFAULT 0,
      discount_paise INTEGER NOT NULL DEFAULT 0,
      final_amount_paise INTEGER NOT NULL DEFAULT 0,
      notes TEXT,
      created_by_user_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
      FOREIGN KEY (table_id) REFERENCES tables(id) ON DELETE CASCADE,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
      FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE RESTRICT
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS bills (
      id TEXT PRIMARY KEY,
      business_id TEXT NOT NULL,
      bill_number TEXT NOT NULL UNIQUE,
      session_id TEXT UNIQUE,
      customer_id TEXT,
      bill_type TEXT NOT NULL CHECK(bill_type IN ('TABLE', 'COUNTER')),
      subtotal_paise INTEGER NOT NULL,
      discount_paise INTEGER NOT NULL DEFAULT 0,
      final_amount_paise INTEGER NOT NULL,
      paid_amount_paise INTEGER NOT NULL DEFAULT 0,
      outstanding_paise INTEGER NOT NULL DEFAULT 0,
      payment_status TEXT NOT NULL CHECK(payment_status IN ('PAID', 'PARTIAL', 'UNPAID')),
      notes TEXT,
      created_by_user_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
      FOREIGN KEY (session_id) REFERENCES game_sessions(id) ON DELETE SET NULL,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
      FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE RESTRICT
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS bill_items (
      id TEXT PRIMARY KEY,
      business_id TEXT NOT NULL,
      bill_id TEXT,
      session_id TEXT,
      product_id TEXT,
      item_name TEXT NOT NULL,
      item_type TEXT NOT NULL DEFAULT 'PRODUCT' CHECK(item_type IN ('TABLE_TIME', 'PRODUCT', 'SERVICE')),
      quantity INTEGER NOT NULL DEFAULT 1,
      unit_price_paise INTEGER NOT NULL,
      unit_cost_paise INTEGER NOT NULL DEFAULT 0,
      total_price_paise INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
      FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE,
      FOREIGN KEY (session_id) REFERENCES game_sessions(id) ON DELETE SET NULL,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      business_id TEXT NOT NULL,
      bill_id TEXT,
      customer_id TEXT,
      payment_type TEXT NOT NULL CHECK(payment_type IN ('BILL_PAYMENT', 'UDHAAR_REPAYMENT', 'ADVANCE')),
      payment_method TEXT NOT NULL CHECK(payment_method IN ('CASH', 'UPI', 'SPLIT')),
      cash_amount_paise INTEGER NOT NULL DEFAULT 0,
      upi_amount_paise INTEGER NOT NULL DEFAULT 0,
      total_amount_paise INTEGER NOT NULL,
      reference_note TEXT,
      created_by_user_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
      FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE SET NULL,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
      FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE RESTRICT
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      business_id TEXT NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      brand TEXT,
      sku TEXT,
      selling_price_paise INTEGER NOT NULL,
      cost_price_paise INTEGER NOT NULL DEFAULT 0,
      current_stock INTEGER NOT NULL DEFAULT 0,
      low_stock_threshold INTEGER NOT NULL DEFAULT 5,
      unit TEXT NOT NULL DEFAULT 'pcs',
      is_active INTEGER NOT NULL DEFAULT 1,
      pack_piece_ratio INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS stock_movements (
      id TEXT PRIMARY KEY,
      business_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      movement_type TEXT NOT NULL CHECK(movement_type IN ('INITIAL', 'PURCHASE', 'SALE', 'SESSION_ADDON', 'DAMAGE', 'RETURN', 'ADJUSTMENT')),
      quantity_change INTEGER NOT NULL,
      previous_stock INTEGER NOT NULL,
      new_stock INTEGER NOT NULL,
      reference_id TEXT,
      reason TEXT,
      created_by_user_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE RESTRICT
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS suppliers (
      id TEXT PRIMARY KEY,
      business_id TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      contact_person TEXT,
      outstanding_payable_paise INTEGER NOT NULL DEFAULT 0,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS purchases (
      id TEXT PRIMARY KEY,
      business_id TEXT NOT NULL,
      supplier_id TEXT,
      invoice_number TEXT,
      purchase_date TEXT NOT NULL,
      total_amount_paise INTEGER NOT NULL,
      paid_amount_paise INTEGER NOT NULL DEFAULT 0,
      remaining_payable_paise INTEGER NOT NULL DEFAULT 0,
      payment_method TEXT NOT NULL CHECK(payment_method IN ('CASH', 'UPI', 'CREDIT')),
      notes TEXT,
      created_by_user_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
      FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE RESTRICT
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS purchase_items (
      id TEXT PRIMARY KEY,
      purchase_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unit_cost_paise INTEGER NOT NULL,
      total_cost_paise INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS expense_categories (
      id TEXT PRIMARY KEY,
      business_id TEXT NOT NULL,
      name TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      display_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      business_id TEXT NOT NULL,
      category_id TEXT NOT NULL,
      category_name TEXT NOT NULL,
      title TEXT NOT NULL,
      amount_paise INTEGER NOT NULL,
      expense_date TEXT NOT NULL,
      payment_method TEXT NOT NULL CHECK(payment_method IN ('CASH', 'UPI')),
      paid_by TEXT NOT NULL CHECK(paid_by IN ('BUSINESS_DRAWER', 'PERSONAL_FUNDS', 'BANK')),
      payee TEXT,
      notes TEXT,
      receipt_url TEXT,
      created_by_user_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
      FOREIGN KEY (category_id) REFERENCES expense_categories(id) ON DELETE RESTRICT,
      FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE RESTRICT
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS cash_shifts (
      id TEXT PRIMARY KEY,
      business_id TEXT NOT NULL,
      shift_date TEXT NOT NULL,
      opened_at TEXT NOT NULL,
      closed_at TEXT,
      status TEXT NOT NULL CHECK(status IN ('OPEN', 'CLOSED')),
      opening_cash_paise INTEGER NOT NULL DEFAULT 0,
      table_cash_collected_paise INTEGER NOT NULL DEFAULT 0,
      shop_cash_collected_paise INTEGER NOT NULL DEFAULT 0,
      udhaar_cash_collected_paise INTEGER NOT NULL DEFAULT 0,
      cash_expenses_paid_from_drawer_paise INTEGER NOT NULL DEFAULT 0,
      cash_added_paise INTEGER NOT NULL DEFAULT 0,
      cash_withdrawn_paise INTEGER NOT NULL DEFAULT 0,
      expected_closing_cash_paise INTEGER NOT NULL DEFAULT 0,
      actual_counted_cash_paise INTEGER NOT NULL DEFAULT 0,
      cash_difference_paise INTEGER NOT NULL DEFAULT 0,
      total_upi_collected_paise INTEGER NOT NULL DEFAULT 0,
      total_billed_paise INTEGER NOT NULL DEFAULT 0,
      total_credit_given_paise INTEGER NOT NULL DEFAULT 0,
      closing_notes TEXT,
      closed_by_user_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
      FOREIGN KEY (closed_by_user_id) REFERENCES users(id) ON DELETE SET NULL
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS cash_movements (
      id TEXT PRIMARY KEY,
      shift_id TEXT NOT NULL,
      business_id TEXT NOT NULL,
      movement_type TEXT NOT NULL CHECK(movement_type IN ('CASH_IN', 'CASH_OUT', 'WITHDRAWAL', 'ADDITION')),
      amount_paise INTEGER NOT NULL,
      reason TEXT NOT NULL,
      created_by_user_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (shift_id) REFERENCES cash_shifts(id) ON DELETE CASCADE,
      FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
      FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE RESTRICT
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      business_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      user_name TEXT NOT NULL,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      old_values_json TEXT,
      new_values_json TEXT,
      reason TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
    );
  `);

  // Indexes for high performance queries
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_sessions_active ON game_sessions(table_id, status);`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_sessions_biz_time ON game_sessions(business_id, start_time);`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_bills_biz_time ON bills(business_id, created_at);`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_bills_session ON bills(session_id);`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_payments_biz_time ON payments(business_id, created_at);`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_expenses_biz_date ON expenses(business_id, expense_date);`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_customers_biz_phone ON customers(business_id, phone);`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_stock_prod_time ON stock_movements(product_id, created_at);`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_shifts_biz_date ON cash_shifts(business_id, shift_date);`);
}
