import { describe, it, expect } from "vitest";
import { calculateSessionBill, reconcilePayment } from "../src/lib/billing/engine";
import { formatPaise, rupeesToPaise, paiseToRupees } from "../src/lib/utils/money";
import { calculateElapsedMinutes, getKolkataDayBoundaries } from "../src/lib/utils/date";

describe("Level Up Billing Engine", () => {
  it("calculates exact per-minute pool charges correctly", () => {
    // 30 minutes at ₹200/hr (20,000 paise/hr) = ₹100 (10,000 paise)
    const start = "2026-10-11T10:00:00.000Z";
    const end = "2026-10-11T10:30:00.000Z";
    const result = calculateSessionBill({
      startTimeIso: start,
      endTimeIso: end,
      hourlyRatePaise: 20000,
      minimumChargePaise: 5000,
      billingIncrementMinutes: 1,
      roundingMode: "CEIL",
    });

    expect(result.durationMinutes).toBe(30);
    expect(result.billableMinutes).toBe(30);
    expect(result.tableChargePaise).toBe(10000);
    expect(result.finalAmountPaise).toBe(10000);
    expect(result.minimumChargeApplied).toBe(false);
  });

  it("enforces minimum charges when play duration is short", () => {
    // 10 minutes at ₹200/hr = ₹33.33, but minimum charge is ₹50 (5,000 paise)
    const start = "2026-10-11T10:00:00.000Z";
    const end = "2026-10-11T10:10:00.000Z";
    const result = calculateSessionBill({
      startTimeIso: start,
      endTimeIso: end,
      hourlyRatePaise: 20000,
      minimumChargePaise: 5000,
      billingIncrementMinutes: 1,
      roundingMode: "CEIL",
    });

    expect(result.durationMinutes).toBe(10);
    expect(result.tableChargePaise).toBe(5000);
    expect(result.minimumChargeApplied).toBe(true);
    expect(result.finalAmountPaise).toBe(5000);
  });

  it("handles 15-minute billing block increments", () => {
    // 35 minutes played with 15-min increment -> rounds up to 45 billable minutes
    // At ₹200/hr: 45/60 * 200 = ₹150 (15,000 paise)
    const start = "2026-10-11T10:00:00.000Z";
    const end = "2026-10-11T10:35:00.000Z";
    const result = calculateSessionBill({
      startTimeIso: start,
      endTimeIso: end,
      hourlyRatePaise: 20000,
      billingIncrementMinutes: 15,
      roundingMode: "CEIL",
    });

    expect(result.durationMinutes).toBe(35);
    expect(result.billableMinutes).toBe(45);
    expect(result.tableChargePaise).toBe(15000);
  });

  it("combines table charges, add-on shop items, and discounts accurately", () => {
    // 60 minutes pool (₹200 = 20,000 paise) + ₹120 snacks (12,000 paise) - ₹50 discount (5,000 paise)
    // Final = ₹270 (27,000 paise)
    const start = "2026-10-11T10:00:00.000Z";
    const end = "2026-10-11T11:00:00.000Z";
    const result = calculateSessionBill({
      startTimeIso: start,
      endTimeIso: end,
      hourlyRatePaise: 20000,
      itemsChargePaise: 12000,
      discountPaise: 5000,
    });

    expect(result.tableChargePaise).toBe(20000);
    expect(result.itemsChargePaise).toBe(12000);
    expect(result.subtotalPaise).toBe(32000);
    expect(result.discountPaise).toBe(5000);
    expect(result.finalAmountPaise).toBe(27000);
  });

  it("reconciles split payment (Cash + UPI) cleanly", () => {
    const finalAmount = 50000; // ₹500
    // Paid ₹200 Cash + ₹300 UPI = ₹500 Full payment
    const paymentResult = reconcilePayment(finalAmount, 20000, 30000);
    expect(paymentResult.paidAmountPaise).toBe(50000);
    expect(paymentResult.outstandingPaise).toBe(0);
    expect(paymentResult.paymentStatus).toBe("PAID");
  });

  it("handles partial payment and calculates udhaar balance without loss", () => {
    const finalAmount = 50000; // ₹500
    // Paid ₹200 Cash, remaining ₹300 udhaar
    const paymentResult = reconcilePayment(finalAmount, 20000, 0);
    expect(paymentResult.paidAmountPaise).toBe(20000);
    expect(paymentResult.outstandingPaise).toBe(30000);
    expect(paymentResult.paymentStatus).toBe("PARTIAL");
  });

  it("handles zero cash/upi for full udhaar (credit)", () => {
    const finalAmount = 45000; // ₹450
    const paymentResult = reconcilePayment(finalAmount, 0, 0);
    expect(paymentResult.paidAmountPaise).toBe(0);
    expect(paymentResult.outstandingPaise).toBe(45000);
    expect(paymentResult.paymentStatus).toBe("UNPAID");
  });
});

describe("Money Utilities", () => {
  it("converts between rupees and paise accurately", () => {
    expect(rupeesToPaise(150.5)).toBe(15050);
    expect(rupeesToPaise("200")).toBe(20000);
    expect(paiseToRupees(15050)).toBe(150.5);
    expect(formatPaise(25000)).toBe("₹250");
    expect(formatPaise(25050)).toBe("₹250.50");
  });
});

describe("Date & Timezone Boundaries", () => {
  it("determines elapsed minutes correctly across hours", () => {
    const start = "2026-10-11T12:00:00.000Z";
    const end = "2026-10-11T13:45:00.000Z";
    expect(calculateElapsedMinutes(start, end)).toBe(105);
  });

  it("provides valid ISO boundaries for Asia/Kolkata dates", () => {
    const boundaries = getKolkataDayBoundaries("2026-10-11");
    expect(boundaries.startIso).toBeTruthy();
    expect(boundaries.endIso).toBeTruthy();
    expect(new Date(boundaries.startIso).getTime()).toBeLessThan(new Date(boundaries.endIso).getTime());
  });
});
