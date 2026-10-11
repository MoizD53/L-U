import { NextRequest, NextResponse } from "next/server";
import { authenticateApi } from "@/lib/auth/api-guard";
import { exportCsvData } from "@/lib/services/reports.service";

export async function GET(req: NextRequest) {
  const { session, errorResponse } = await authenticateApi();
  if (errorResponse) return errorResponse;

  const url = new URL(req.url);
  const typeParam = url.searchParams.get("type") as "bills" | "expenses" | "customers" | "products";
  const validTypes = ["bills", "expenses", "customers", "products"];

  if (!typeParam || !validTypes.includes(typeParam)) {
    return NextResponse.json({ error: "Invalid export type" }, { status: 400 });
  }

  try {
    const csvContent = await exportCsvData(session!.businessId, typeParam);
    const filename = `levelup_${typeParam}_${new Date().toISOString().split("T")[0]}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to generate CSV export" },
      { status: 500 }
    );
  }
}
