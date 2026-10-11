import { describe, it, expect, beforeAll } from "vitest";
import { seedDatabase } from "../src/lib/db/seed";
import { getTablesWithActiveSessions, startTableSession, addItemsToSession, endTableSessionAndFinalizeBill } from "../src/lib/services/tables.service";
import { createCustomer, collectUdhaarRepayment, getCustomers } from "../src/lib/services/customers.service";
import { recordCounterSale, getProducts } from "../src/lib/services/shop.service";
import { addExpense, getExpenses } from "../src/lib/services/expenses.service";
import { getTodayCashShift, closeTodayHisab } from "../src/lib/services/closing.service";

import { db } from "../src/lib/db/client";

const BIZ_ID = "biz_levelup_dahod";
const USER_ID = "usr_owner";

beforeAll(async () => {
  await seedDatabase();
  await db.execute("UPDATE game_sessions SET status = 'CANCELLED' WHERE status = 'ACTIVE'");
});

describe("Level Up Table Management & Sessions", () => {
  it("prevents starting two concurrent sessions on the same table", async () => {
    const tables = await getTablesWithActiveSessions(BIZ_ID, "POOL");
    const testTable = tables[0];

    // Start session
    const session1 = await startTableSession({
      businessId: BIZ_ID,
      tableId: testTable.id,
      notes: "Test Game 1",
      userId: USER_ID,
    });

    expect(session1.status).toBe("ACTIVE");

    // Attempt starting another session on the same table
    await expect(
      startTableSession({
        businessId: BIZ_ID,
        tableId: testTable.id,
        notes: "Overlapping attempt",
        userId: USER_ID,
      })
    ).rejects.toThrow(/already has an active running session/i);

    // End session1 cleanly
    const endRes = await endTableSessionAndFinalizeBill({
      businessId: BIZ_ID,
      sessionId: session1.id,
      paymentMethod: "CASH",
      userId: USER_ID,
    });

    expect(endRes.billNumber).toBeTruthy();
    expect(endRes.outstandingPaise).toBe(0);
  });

  it("attaches add-on shop items to a table session and updates inventory", async () => {
    const tables = await getTablesWithActiveSessions(BIZ_ID, "POOL");
    const testTable = tables[1]; // Table 2

    const prods = await getProducts(BIZ_ID);
    const waterProd = prods.find((p) => p.name.includes("Bisleri")) || prods[0];
    const initialStock = waterProd.current_stock;

    const session = await startTableSession({
      businessId: BIZ_ID,
      tableId: testTable.id,
      userId: USER_ID,
    });

    const added = await addItemsToSession({
      businessId: BIZ_ID,
      sessionId: session.id,
      items: [{ productId: waterProd.id, quantity: 2 }],
      userId: USER_ID,
    });

    expect(added.length).toBe(1);
    expect(added[0].quantity).toBe(2);

    // Verify stock decreased by 2
    const updatedProds = await getProducts(BIZ_ID);
    const updatedWater = updatedProds.find((p) => p.id === waterProd.id);
    expect(updatedWater?.current_stock).toBe(initialStock - 2);

    // End session
    const endRes = await endTableSessionAndFinalizeBill({
      businessId: BIZ_ID,
      sessionId: session.id,
      paymentMethod: "CASH",
      userId: USER_ID,
    });

    expect(endRes.finalAmountPaise).toBeGreaterThan(0);
  });
});

describe("Udhaar and Customer Credit Lifecycle", () => {
  it("tracks unpaid bills and allows auditable repayments", async () => {
    const cust = await createCustomer({
      businessId: BIZ_ID,
      name: "Test Udhaar Player",
      phone: `98980${Date.now().toString().slice(-5)}`,
    });

    // Make a counter sale with zero payment (full Udhaar)
    const prods = await getProducts(BIZ_ID);
    const snack = prods[0];

    const saleRes = await recordCounterSale({
      businessId: BIZ_ID,
      items: [{ productId: snack.id, quantity: 1 }],
      paymentMethod: "CASH",
      cashAmountPaise: 0,
      customerId: cust.id,
      notes: "Full credit sale",
      userId: USER_ID,
    });

    expect(saleRes.finalAmountPaise).toBeGreaterThan(0);

    // Verify customer outstanding credit updated
    const customersAfter = await getCustomers(BIZ_ID, cust.name);
    const debtor = customersAfter.find((c) => c.id === cust.id);
    expect(debtor?.outstanding_credit_paise).toBe(saleRes.finalAmountPaise);

    // Collect partial repayment
    const repaymentAmt = Math.floor(saleRes.finalAmountPaise / 2);
    const repayRes = await collectUdhaarRepayment({
      businessId: BIZ_ID,
      customerId: cust.id,
      amountPaise: repaymentAmt,
      paymentMethod: "UPI",
      userId: USER_ID,
      userName: "Arena Owner",
    });

    expect(repayRes.remainingBalancePaise).toBe(saleRes.finalAmountPaise - repaymentAmt);
  });
});

describe("Expense Source Accounting", () => {
  it("differentiates drawer cash expenses from UPI or personal expenses", async () => {
    const expCats = await getExpenses(BIZ_ID);

    // Add personal fund expense
    const personalExp = await addExpense({
      businessId: BIZ_ID,
      categoryId: "expcat_misc",
      title: "Owner Personal Snack",
      amountPaise: 5000,
      paymentMethod: "CASH",
      paidBy: "PERSONAL_FUNDS",
      userId: USER_ID,
    });

    expect(personalExp.paid_by).toBe("PERSONAL_FUNDS");

    // Add drawer cash expense
    const drawerExp = await addExpense({
      businessId: BIZ_ID,
      categoryId: "expcat_clean",
      title: "Phenyl and Mop",
      amountPaise: 15000,
      paymentMethod: "CASH",
      paidBy: "BUSINESS_DRAWER",
      userId: USER_ID,
    });

    expect(drawerExp.paid_by).toBe("BUSINESS_DRAWER");

    // Verify today's cash shift expected closing accounts for drawer expense
    const shiftInfo = await getTodayCashShift(BIZ_ID);
    expect(shiftInfo.shift.cash_expenses_paid_from_drawer_paise).toBeGreaterThanOrEqual(15000);
  });
});
