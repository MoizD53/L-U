import { NextResponse } from "next/server";
import { authenticateApi } from "@/lib/auth/api-guard";
import { getDashboardOverview } from "@/lib/services/dashboard.service";

export async function GET() {
  const { session, errorResponse } = await authenticateApi();
  if (errorResponse) return errorResponse;

  try {
    const data = await getDashboardOverview(session!.businessId);
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to load dashboard overview" },
      { status: 500 }
    );
  }
}
