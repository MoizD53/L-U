import { NextRequest, NextResponse } from "next/server";
import { authenticateApi } from "@/lib/auth/api-guard";
import { getTablesWithActiveSessions } from "@/lib/services/tables.service";
import type { GameType } from "@/lib/types";

export async function GET(req: NextRequest) {
  const { session, errorResponse } = await authenticateApi();
  if (errorResponse) return errorResponse;

  const url = new URL(req.url);
  const typeParam = url.searchParams.get("type");
  const typeFilter = typeParam === "POOL" || typeParam === "SNOOKER" ? (typeParam as GameType) : undefined;

  try {
    const tables = await getTablesWithActiveSessions(session!.businessId, typeFilter);
    return NextResponse.json({ success: true, data: tables });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to load tables" },
      { status: 500 }
    );
  }
}
