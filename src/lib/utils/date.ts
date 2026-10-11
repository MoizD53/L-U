/**
 * Asia/Kolkata Date and Time Utilities for Level Up Arena (Dahod, Gujarat).
 */

export const TIMEZONE = "Asia/Kolkata";

/**
 * Returns today's date in YYYY-MM-DD format in Asia/Kolkata timezone.
 */
export function getKolkataDateString(date: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(date); // Output: "YYYY-MM-DD"
}

export function formatTimeIST(isoOrDate: string | Date | null | undefined): string {
  if (!isoOrDate) return "--:--";
  const date = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  if (isNaN(date.getTime())) return "--:--";

  return new Intl.DateTimeFormat("en-IN", {
    timeZone: TIMEZONE,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

export function formatDateIST(isoOrDate: string | Date | null | undefined): string {
  if (!isoOrDate) return "--";
  const date = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  if (isNaN(date.getTime())) return "--";

  return new Intl.DateTimeFormat("en-IN", {
    timeZone: TIMEZONE,
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatDateTimeIST(isoOrDate: string | Date | null | undefined): string {
  if (!isoOrDate) return "--";
  const date = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  if (isNaN(date.getTime())) return "--";

  return new Intl.DateTimeFormat("en-IN", {
    timeZone: TIMEZONE,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

export function formatDurationMinutes(totalMinutes: number): string {
  if (totalMinutes <= 0) return "0m";
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.floor(totalMinutes % 60);

  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

export function calculateElapsedMinutes(startTimeIso: string, endTimeIso?: string | null): number {
  const start = new Date(startTimeIso).getTime();
  const end = endTimeIso ? new Date(endTimeIso).getTime() : Date.now();
  if (isNaN(start) || isNaN(end) || end < start) return 0;
  return Math.max(0, Math.ceil((end - start) / 60000));
}

/**
 * Returns ISO boundary range for an Asia/Kolkata date string (YYYY-MM-DD).
 * IST is UTC+05:30.
 * Day start 00:00:00 IST is previous day 18:30:00 UTC.
 * Day end 23:59:59.999 IST is current day 18:29:59.999 UTC.
 */
export function getKolkataDayBoundaries(dateStr: string): { startIso: string; endIso: string } {
  const [year, month, day] = dateStr.split("-").map(Number);
  // IST is +05:30, so 00:00:00 IST = date with - 330 minutes
  const startUtc = new Date(Date.UTC(year, month - 1, day, 0, 0, 0) - 330 * 60 * 1000);
  const endUtc = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999) - 330 * 60 * 1000);

  return {
    startIso: startUtc.toISOString(),
    endIso: endUtc.toISOString(),
  };
}
