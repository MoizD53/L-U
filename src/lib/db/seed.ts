import bcrypt from "bcryptjs";
import { db } from "./client";
import { initDatabase } from "./init";

export async function seedDatabase(): Promise<void> {
  await initDatabase();

  const now = new Date().toISOString();
  const businessId = "biz_levelup_dahod";

  // Check if business already exists
  const existingBiz = await db.execute({
    sql: "SELECT id FROM businesses WHERE id = ?",
    args: [businessId],
  });

  if (existingBiz.rows.length === 0) {
    await db.execute({
      sql: `INSERT INTO businesses (id, name, tagline, location, phone, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [
        businessId,
        "LEVEL UP",
        "Pool & Snooker Arena",
        "Dahod, Gujarat, India",
        "+91 98765 43210",
        now,
        now,
      ],
    });
  }

  // Users: Owner & Manager
  const salt = await bcrypt.genSalt(10);
  const ownerHash = await bcrypt.hash("admin123", salt);
  const managerHash = await bcrypt.hash("manager123", salt);

  const existingOwner = await db.execute({
    sql: "SELECT id FROM users WHERE username = ?",
    args: ["owner"],
  });

  if (existingOwner.rows.length === 0) {
    await db.execute({
      sql: `INSERT INTO users (id, business_id, username, password_hash, name, role, phone, is_active, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
      args: [
        "usr_owner",
        businessId,
        "owner",
        ownerHash,
        "Arena Owner",
        "OWNER",
        "+91 98765 00001",
        now,
        now,
      ],
    });
  }

  const existingManager = await db.execute({
    sql: "SELECT id FROM users WHERE username = ?",
    args: ["manager"],
  });

  if (existingManager.rows.length === 0) {
    await db.execute({
      sql: `INSERT INTO users (id, business_id, username, password_hash, name, role, phone, is_active, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
      args: [
        "usr_manager",
        businessId,
        "manager",
        managerHash,
        "Shift Manager",
        "MANAGER",
        "+91 98765 00002",
        now,
        now,
      ],
    });
  }

  // Default Rate Plans:
  // Pool: ₹200/hr (20000 paise/hr) = ₹3.33/min, min ₹50 (5000 paise)
  // Snooker: ₹350/hr (35000 paise/hr) = ₹5.83/min, min ₹100 (10000 paise)
  const poolPlanId = "plan_pool_standard";
  const snookerPlanId = "plan_snooker_standard";

  const existingPoolPlan = await db.execute({
    sql: "SELECT id FROM rate_plans WHERE id = ?",
    args: [poolPlanId],
  });

  if (existingPoolPlan.rows.length === 0) {
    await db.execute({
      sql: `INSERT INTO rate_plans (id, business_id, name, game_type, hourly_rate_paise, minimum_charge_paise, billing_increment_minutes, rounding_mode, is_default, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
      args: [
        poolPlanId,
        businessId,
        "Standard Pool Rate (₹200/hr)",
        "POOL",
        20000,
        5000,
        1,
        "CEIL",
        now,
        now,
      ],
    });
  }

  const existingSnookerPlan = await db.execute({
    sql: "SELECT id FROM rate_plans WHERE id = ?",
    args: [snookerPlanId],
  });

  if (existingSnookerPlan.rows.length === 0) {
    await db.execute({
      sql: `INSERT INTO rate_plans (id, business_id, name, game_type, hourly_rate_paise, minimum_charge_paise, billing_increment_minutes, rounding_mode, is_default, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
      args: [
        snookerPlanId,
        businessId,
        "Standard Snooker Rate (₹350/hr)",
        "SNOOKER",
        35000,
        10000,
        1,
        "CEIL",
        now,
        now,
      ],
    });
  }

  // Tables: 3 Pool Tables, 2 Snooker Tables
  const defaultTables = [
    { id: "tbl_pool_1", name: "Pool Table 1 (Green Felt)", type: "POOL", planId: poolPlanId, order: 1 },
    { id: "tbl_pool_2", name: "Pool Table 2 (Blue Felt)", type: "POOL", planId: poolPlanId, order: 2 },
    { id: "tbl_pool_3", name: "Pool Table 3 (Championship)", type: "POOL", planId: poolPlanId, order: 3 },
    { id: "tbl_snooker_1", name: "Snooker Table 1 (Pro 12ft)", type: "SNOOKER", planId: snookerPlanId, order: 4 },
    { id: "tbl_snooker_2", name: "Snooker Table 2 (Club 12ft)", type: "SNOOKER", planId: snookerPlanId, order: 5 },
  ];

  for (const t of defaultTables) {
    const existing = await db.execute({
      sql: "SELECT id FROM tables WHERE id = ?",
      args: [t.id],
    });
    if (existing.rows.length === 0) {
      await db.execute({
        sql: `INSERT INTO tables (id, business_id, name, type, rate_plan_id, display_order, is_active, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)`,
        args: [t.id, businessId, t.name, t.type, t.planId, t.order, now, now],
      });
    }
  }

  // Default Shop Products (Selling in Dahod Arena)
  const defaultProducts = [
    { id: "prod_water_500", name: "Bisleri Mineral Water (500ml)", category: "Cold drinks", price: 1500, cost: 800, stock: 48, threshold: 10, unit: "bottle" },
    { id: "prod_water_1000", name: "Bisleri Water (1L)", category: "Cold drinks", price: 2000, cost: 1200, stock: 36, threshold: 10, unit: "bottle" },
    { id: "prod_thumsup_can", name: "Thums Up Can (300ml)", category: "Cold drinks", price: 4000, cost: 2800, stock: 30, threshold: 8, unit: "can" },
    { id: "prod_coca_cola_can", name: "Coca Cola Can (300ml)", category: "Cold drinks", price: 4000, cost: 2800, stock: 30, threshold: 8, unit: "can" },
    { id: "prod_redbull", name: "Red Bull Energy Drink (250ml)", category: "Cold drinks", price: 12500, cost: 9500, stock: 20, threshold: 5, unit: "can" },
    { id: "prod_sting", name: "Sting Energy (250ml)", category: "Cold drinks", price: 2000, cost: 1400, stock: 40, threshold: 10, unit: "bottle" },
    { id: "prod_lays_blue", name: "Lays Magic Masala (₹20)", category: "Chips", price: 2000, cost: 1600, stock: 25, threshold: 6, unit: "pkt" },
    { id: "prod_lays_green", name: "Lays American Cream & Onion (₹20)", category: "Chips", price: 2000, cost: 1600, stock: 25, threshold: 6, unit: "pkt" },
    { id: "prod_kurkure", name: "Kurkure Masala Munch (₹20)", category: "Chips", price: 2000, cost: 1600, stock: 25, threshold: 6, unit: "pkt" },
    { id: "prod_biscuit_hide", name: "Hide & Seek Chocolate Biscuit", category: "Biscuits", price: 3000, cost: 2400, stock: 15, threshold: 5, unit: "pkt" },
    { id: "prod_biscuit_bourbon", name: "Britannia Bourbon Biscuit", category: "Biscuits", price: 2500, cost: 2000, stock: 15, threshold: 5, unit: "pkt" },
    { id: "prod_cigt_goldflake_piece", name: "Gold Flake Lights (Single Piece)", category: "Cigarettes", price: 1800, cost: 1400, stock: 100, threshold: 20, unit: "stick", packRatio: 10 },
    { id: "prod_cigt_goldflake_pack", name: "Gold Flake Lights (Pack of 10)", category: "Cigarettes", price: 18000, cost: 14000, stock: 15, threshold: 3, unit: "pack", packRatio: 10 },
    { id: "prod_cigt_classic_piece", name: "Classic Regular (Single Piece)", category: "Cigarettes", price: 1900, cost: 1500, stock: 80, threshold: 20, unit: "stick", packRatio: 10 },
    { id: "prod_cigt_classic_pack", name: "Classic Regular (Pack of 10)", category: "Cigarettes", price: 19000, cost: 15000, stock: 10, threshold: 3, unit: "pack", packRatio: 10 },
    { id: "prod_cigt_marlboro_piece", name: "Marlboro Gold (Single Piece)", category: "Cigarettes", price: 2000, cost: 1600, stock: 60, threshold: 15, unit: "stick", packRatio: 20 },
    { id: "prod_chalk_cube", name: "Silver Cup Pool Cue Chalk", category: "Other", price: 5000, cost: 3000, stock: 20, threshold: 5, unit: "cube" },
  ];

  for (const p of defaultProducts) {
    const existing = await db.execute({
      sql: "SELECT id FROM products WHERE id = ?",
      args: [p.id],
    });
    if (existing.rows.length === 0) {
      await db.execute({
        sql: `INSERT INTO products (id, business_id, name, category, selling_price_paise, cost_price_paise, current_stock, low_stock_threshold, unit, pack_piece_ratio, is_active, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
        args: [
          p.id,
          businessId,
          p.name,
          p.category,
          p.price,
          p.cost,
          p.stock,
          p.threshold,
          p.unit,
          p.packRatio || 1,
          now,
          now,
        ],
      });

      // Add initial stock movement record
      await db.execute({
        sql: `INSERT INTO stock_movements (id, business_id, product_id, movement_type, quantity_change, previous_stock, new_stock, reason, created_by_user_id, created_at)
              VALUES (?, ?, ?, 'INITIAL', ?, 0, ?, 'Opening stock initialization', 'usr_owner', ?)`,
        args: [
          `sm_init_${p.id}`,
          businessId,
          p.id,
          p.stock,
          p.stock,
          now,
        ],
      });
    }
  }

  // Default Expense Categories
  const expenseCategories = [
    { id: "expcat_salary", name: "Staff Salaries", order: 1 },
    { id: "expcat_advance", name: "Staff Advances", order: 2 },
    { id: "expcat_rent", name: "Rent", order: 3 },
    { id: "expcat_elec", name: "Electricity", order: 4 },
    { id: "expcat_water", name: "Water Supply", order: 5 },
    { id: "expcat_wifi", name: "Internet / Wi-Fi", order: 6 },
    { id: "expcat_clean", name: "Cleaning & Sanitation", order: 7 },
    { id: "expcat_repair", name: "Repairs & Maintenance", order: 8 },
    { id: "expcat_equip", name: "Pool & Snooker Equipment", order: 9 },
    { id: "expcat_gaming", name: "Gaming-related Expenses", order: 10 },
    { id: "expcat_stock_snack", name: "Snacks & Beverage Stock Purchases", order: 11 },
    { id: "expcat_stock_cigt", name: "Cigarette Stock Purchases", order: 12 },
    { id: "expcat_transport", name: "Transport & Logistics", order: 13 },
    { id: "expcat_misc", name: "Miscellaneous Expenses", order: 14 },
  ];

  for (const c of expenseCategories) {
    const existing = await db.execute({
      sql: "SELECT id FROM expense_categories WHERE id = ?",
      args: [c.id],
    });
    if (existing.rows.length === 0) {
      await db.execute({
        sql: `INSERT INTO expense_categories (id, business_id, name, is_active, display_order, created_at)
              VALUES (?, ?, ?, 1, ?, ?)`,
        args: [c.id, businessId, c.name, c.order, now],
      });
    }
  }

  // Seed sample supplier
  const supplierId = "sup_dahod_traders";
  const existingSupplier = await db.execute({
    sql: "SELECT id FROM suppliers WHERE id = ?",
    args: [supplierId],
  });
  if (existingSupplier.rows.length === 0) {
    await db.execute({
      sql: `INSERT INTO suppliers (id, business_id, name, phone, contact_person, outstanding_payable_paise, notes, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?)`,
      args: [
        supplierId,
        businessId,
        "Dahod Wholesale Beverage & Snacks",
        "+91 99000 11223",
        "Rameshbhai",
        "Primary local snacks and soft drinks distributor in Dahod market",
        now,
        now,
      ],
    });
  }

  // Seed sample regular customers
  const sampleCustomers = [
    { id: "cust_mohit", name: "Mohit Patel", phone: "9825012345", notes: "Regular pool player, weekend evenings" },
    { id: "cust_rahul", name: "Rahul Soni", phone: "9879054321", notes: "Snooker enthusiast" },
    { id: "cust_arjun", name: "Arjun Verma", phone: "9924098765", notes: "College group captain" },
  ];

  for (const cust of sampleCustomers) {
    const existing = await db.execute({
      sql: "SELECT id FROM customers WHERE id = ?",
      args: [cust.id],
    });
    if (existing.rows.length === 0) {
      await db.execute({
        sql: `INSERT INTO customers (id, business_id, name, phone, notes, outstanding_credit_paise, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, 0, ?, ?)`,
        args: [cust.id, businessId, cust.name, cust.phone, cust.notes, now, now],
      });
    }
  }

  // Ensure an open cash shift exists for today
  const todayDateStr = new Date().toISOString().split("T")[0];
  const existingShift = await db.execute({
    sql: "SELECT id FROM cash_shifts WHERE business_id = ? AND shift_date = ?",
    args: [businessId, todayDateStr],
  });

  if (existingShift.rows.length === 0) {
    await db.execute({
      sql: `INSERT INTO cash_shifts (id, business_id, shift_date, opened_at, status, opening_cash_paise, created_at, updated_at)
            VALUES (?, ?, ?, ?, 'OPEN', 200000, ?, ?)`,
      args: [
        `shift_${todayDateStr}`,
        businessId,
        todayDateStr,
        now,
        now,
        now,
      ],
    });
  }
}
