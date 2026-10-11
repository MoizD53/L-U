/**
 * Currency utilities for Level Up Arena (Dahod, Gujarat).
 * All money is stored internally in integer paise (1 Rupee = 100 paise).
 */

export function paiseToRupees(paise: number): number {
  return Number((paise / 100).toFixed(2));
}

export function rupeesToPaise(rupees: number | string): number {
  const num = typeof rupees === "string" ? parseFloat(rupees) : rupees;
  if (isNaN(num)) return 0;
  return Math.round(num * 100);
}

export function formatRupees(paise: number, includeDecimals = false): string {
  if (paise === null || paise === undefined || isNaN(paise)) return "₹0";

  const rupees = paise / 100;
  const isNegative = rupees < 0;
  const absRupees = Math.abs(rupees);

  const formatted = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: includeDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(absRupees);

  return `${isNegative ? "-" : ""}₹${formatted}`;
}

export function formatPaise(paise: number): string {
  // If paise has decimal fraction (e.g. ₹150.50), show decimals, otherwise round rupees
  const hasDecimals = paise % 100 !== 0;
  return formatRupees(paise, hasDecimals);
}
