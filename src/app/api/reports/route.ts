import { NextRequest, NextResponse } from "next/server";
import { authenticateApi } from "@/lib/auth/api-guard";
import { getAnalyticsReport } from "@/lib/services/reports.service";
import { getKolkataDateString, getKolkataDayBoundaries } from "@/lib/utils/date";

export async function GET(req: NextRequest) {
  const { session, errorResponse } = await authenticateApi();
  if (errorResponse) return errorResponse;

  const url = new URL(req.url);
  const range = url.searchParams.get("range") || "today";
  const customStart = url.searchParams.get("start");
  const customEnd = url.searchParams.get("end");

  const todayStr = getKolkataDateString();
  let startIso: string;
  let endIso: string;

  if (range === "today") {
    const b = getKolkataDayBoundaries(todayStr);
    startIso = b.startIso;
    endIso = b.endIso;
  } else if (range === "yesterday") {
    const yDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const yStr = getKolkataDateString(yDate);
    const b = getKolkataDayBoundaries(yStr);
    startIso = b.startIso;
    endIso = b.endIso;
  } else if (range === "week") {
    const wDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const wStr = getKolkataDateString(wDate);
    startIso = getKolkataDayBoundaries(wStr).startIso;
    endIso = getKolkataDayBoundaries(todayStr).endIso;
  } else if (range === "month") {
    const mDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const mStr = getKolkataDateString(mDate);
    startIso = getKolkataDayBoundaries(mStr).startIso;
    endIso = getKolkataDayBoundaries(todayStr).endIso;
  } else if (customStart && customEnd) {
    startIso = getKolkataDayBoundaries(customStart).startIso;
    endIso = getKolkataDayBoundaries(customEnd).endIso;
  } else {
    const b = getKolkataDayBoundaries(todayStr);
    startIso = b.startIso;
    endIso = b.endIso;
  }

  try {
    const data = await getAnalyticsReport(session!.businessId, { startIso, endIso });
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to generate analytics report" },
      { status: 500 }
    );
  }
}
