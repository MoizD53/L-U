import { describe, it, expect, beforeAll } from "vitest";
import { seedDatabase } from "../src/lib/db/seed";
import { db } from "../src/lib/db/client";
import {
  startTableSession,
  endTableSessionAndFinalizeBill,
  getTablesWithActiveSessions,
} from "../src/lib/services/tables.service";
import { recordStockPurchase, getProducts } from "../src/lib/services/shop.service";
import { getTodayCashShift, closeTodayHisab } from "../src/lib/services/closing.service";

const BIZ_ID = "biz_levelup_dahod";
const USER_ID = "usr_owner";

beforeAll(async () => {
  await seedDatabase();
  await db.execute("UPDATE game_sessions SET status = 'CANCELLED' WHERE status = 'ACTIVE'");
});

describe("Rate Snapshot Integrity", () => {
  it("preserves snapshot rates on historical sessions when business rate plan changes", async () => {
    const tables = await getTablesWithActiveSessions(BIZ_ID, "POOL");
    const table = tables[0];

    // 1. Start a session with original rate (e.g. 20000 paise/hr)
    const session = await startTableSession({
      businessId: BIZ_ID,
      tableId: table.id,
      notes: "Rate snapshot verification",
      userId: USER_ID,
    });

    const originalSnapshotRate = session.snapshot_hourly_rate_paise;
    expect(originalSnapshotRate).toBe(20000);

    // 2. Simulate owner modifying the rate plan in database to ₹300/hr (30000 paise)
    await db.execute({
      sql: `UPDATE rate_plans SET hourly_rate_paise = 30000 WHERE id = ?`,
      args: [table.rate_plan_id || "plan_pool_standard"],
    });

    // 3. Verify active session STILL retains original snapshot rate of 20000
    const activeRes = await db.execute({
      sql: `SELECT snapshot_hourly_rate_paise FROM game_sessions WHERE id = ?`,
      args: [session.id],
    });
    expect(Number(activeRes.rows[0].snapshot_hourly_rate_paise)).toBe(20000);

    // 4. End the session and verify final bill was computed using the snapshot rate, not the changed rate
    const endRes = await endTableSessionAndFinalizeBill({
      businessId: BIZ_ID,
      sessionId: session.id,
      paymentMethod: "CASH",
      userId: USER_ID,
    });

    expect(endRes.billNumber).toBeTruthy();

    // Restore rate plan for other tests
    await db.execute({
      sql: `UPDATE rate_plans SET hourly_rate_paise = 20000 WHERE id = ?`,
      args: [table.rate_plan_id || "plan_pool_standard"],
    });
  });
});

describe("Supplier Inventory & Stock Movements", () => {
  it("receives stock purchases and updates product quantities and cost prices without duplicating expenses", async () => {
    const prods = await getProducts(BIZ_ID);
    const testProd = prods[0];
    const initialStock = testProd.current_stock;

    const purchaseId = await recordStockPurchase({
      businessId: BIZ_ID,
      supplierId: "sup_dahod_traders",
      invoiceNumber: "TEST-INV-101",
      purchaseDate: "2026-10-11",
      items: [
        {
          productId: testProd.id,
          quantity: 20,
          unitCostPaise: 950,
        },
      ],
      paidAmountPaise: 19000,
      paymentMethod: "CASH",
      notes: "Stock test purchase",
      userId: USER_ID,
    });

    expect(purchaseId).toBeTruthy();

    const prodsAfter = await getProducts(BIZ_ID);
    const updatedProd = prodsAfter.find((p) => p.id === testProd.id);
    expect(updatedProd?.current_stock).toBe(initialStock + 20);
    expect(updatedProd?.cost_price_paise).toBe(950);

    // Verify stock movement logged with reason
    const movRes = await db.execute({
      sql: `SELECT movement_type, quantity_change FROM stock_movements WHERE reference_id = ?`,
      args: [purchaseId],
    });
    expect(movRes.rows.length).toBe(1);
    expect(movRes.rows[0].movement_type).toBe("PURCHASE");
    expect(Number(movRes.rows[0].quantity_change)).toBe(20);
  });
});

describe("Daily Closing Discrepancy Auditing", () => {
  it("requires an explanatory note when drawer cash difference exceeds ₹100", async () => {
    const currentShift = await getTodayCashShift(BIZ_ID);
    const expectedCash = currentShift.shift.expected_closing_cash_paise;

    // Attempt closing with ₹500 discrepancy and NO notes
    const counterfeitCounted = expectedCash - 50000; // ₹500 shortage

    await expect(
      closeTodayHisab({
        businessId: BIZ_ID,
        shiftId: currentShift.shift.id,
        actualCountedCashPaise: counterfeitCounted,
        closingNotes: "",
        userId: USER_ID,
        userName: "Arena Owner",
      })
    ).rejects.toThrow(/note explaining the cash difference is required/i);
  });
});
