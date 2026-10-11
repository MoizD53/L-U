import { calculateElapsedMinutes } from "../utils/date";
import type { RoundingMode } from "../types";

export interface BillingInput {
  startTimeIso: string;
  endTimeIso?: string | null;
  hourlyRatePaise: number;
  minimumChargePaise?: number;
  billingIncrementMinutes?: number; // e.g. 1 for per-minute, 15 for 15-min blocks
  roundingMode?: RoundingMode; // 'CEIL', 'ROUND', 'EXACT'
  itemsChargePaise?: number;
  discountPaise?: number;
}

export interface BillingCalculation {
  durationMinutes: number;
  billableMinutes: number;
  tableChargePaise: number;
  minimumChargeApplied: boolean;
  itemsChargePaise: number;
  subtotalPaise: number;
  discountPaise: number;
  finalAmountPaise: number;
}

/**
 * Server-side billing engine for Pool and Snooker table sessions.
 * Accurately calculates charges based on real timestamps and rate snapshots.
 */
export function calculateSessionBill(input: BillingInput): BillingCalculation {
  const {
    startTimeIso,
    endTimeIso,
    hourlyRatePaise,
    minimumChargePaise = 0,
    billingIncrementMinutes = 1,
    roundingMode = "CEIL",
    itemsChargePaise = 0,
    discountPaise = 0,
  } = input;

  const durationMinutes = calculateElapsedMinutes(startTimeIso, endTimeIso);

  // If 0 duration (e.g. just started and cancelled immediately), 0 billable unless min charge applies after grace
  let billableMinutes = durationMinutes;

  if (billingIncrementMinutes > 1 && durationMinutes > 0) {
    if (roundingMode === "CEIL") {
      billableMinutes = Math.ceil(durationMinutes / billingIncrementMinutes) * billingIncrementMinutes;
    } else if (roundingMode === "ROUND") {
      billableMinutes = Math.round(durationMinutes / billingIncrementMinutes) * billingIncrementMinutes;
    }
  }

  // Calculate raw table charge from hourly rate (stored in paise)
  // charge = (billableMinutes / 60) * hourlyRatePaise
  let rawTableCharge = (billableMinutes / 60) * hourlyRatePaise;

  let computedTableChargePaise: number;
  if (roundingMode === "CEIL") {
    // Ceiling to nearest 100 paise (nearest ₹1)
    computedTableChargePaise = Math.ceil(rawTableCharge / 100) * 100;
  } else if (roundingMode === "ROUND") {
    computedTableChargePaise = Math.round(rawTableCharge / 100) * 100;
  } else {
    // EXACT integer paise
    computedTableChargePaise = Math.round(rawTableCharge);
  }

  // Minimum charge rule: if session had any play (duration > 0), ensure table charge >= minimumChargePaise
  let minimumChargeApplied = false;
  if (durationMinutes > 0 && computedTableChargePaise < minimumChargePaise) {
    computedTableChargePaise = minimumChargePaise;
    minimumChargeApplied = true;
  }

  const subtotalPaise = computedTableChargePaise + itemsChargePaise;
  const safeDiscountPaise = Math.min(discountPaise, subtotalPaise);
  const finalAmountPaise = Math.max(0, subtotalPaise - safeDiscountPaise);

  return {
    durationMinutes,
    billableMinutes,
    tableChargePaise: computedTableChargePaise,
    minimumChargeApplied,
    itemsChargePaise,
    subtotalPaise,
    discountPaise: safeDiscountPaise,
    finalAmountPaise,
  };
}

/**
 * Validates and reconciles split or single payments against a final bill amount.
 */
export function reconcilePayment(
  finalAmountPaise: number,
  cashAmountPaise = 0,
  upiAmountPaise = 0
): {
  paidAmountPaise: number;
  outstandingPaise: number;
  paymentStatus: "PAID" | "PARTIAL" | "UNPAID";
} {
  const safeCash = Math.max(0, Math.round(cashAmountPaise));
  const safeUpi = Math.max(0, Math.round(upiAmountPaise));
  const totalPaid = safeCash + safeUpi;

  const paidAmountPaise = Math.min(finalAmountPaise, totalPaid);
  const outstandingPaise = Math.max(0, finalAmountPaise - paidAmountPaise);

  let paymentStatus: "PAID" | "PARTIAL" | "UNPAID" = "UNPAID";
  if (paidAmountPaise >= finalAmountPaise && finalAmountPaise > 0) {
    paymentStatus = "PAID";
  } else if (paidAmountPaise > 0) {
    paymentStatus = "PARTIAL";
  } else if (finalAmountPaise === 0) {
    paymentStatus = "PAID";
  }

  return {
    paidAmountPaise,
    outstandingPaise,
    paymentStatus,
  };
}
