import { NextRequest, NextResponse } from "next/server";
import { authenticateApi } from "@/lib/auth/api-guard";
import { getCustomerDetail } from "@/lib/services/customers.service";

export async function GET(
  _req: NextRequest,
  segmentData: { params: Promise<{ id: string }> }
) {
  const { session, errorResponse } = await authenticateApi();
  if (errorResponse) return errorResponse;

  const { id } = await segmentData.params;

  try {
    const detail = await getCustomerDetail(session!.businessId, id);
    return NextResponse.json({ success: true, data: detail });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to load customer profile" },
      { status: 404 }
    );
  }
}
