import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticateApi } from "@/lib/auth/api-guard";
import { getTodayCashShift, closeTodayHisab } from "@/lib/services/closing.service";

const closeHisabSchema = z.object({
  shiftId: z.string().min(1, "Shift ID is required"),
  actualCountedCashPaise: z.number().int().min(0, "Counted cash cannot be negative"),
  closingNotes: z.string().optional().nullable(),
});

export async function GET() {
  const { session, errorResponse } = await authenticateApi();
  if (errorResponse) return errorResponse;

  try {
    const shiftData = await getTodayCashShift(session!.businessId);
    return NextResponse.json({ success: true, data: shiftData });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to load daily closing data" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const { session, errorResponse } = await authenticateApi();
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const parsed = closeHisabSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const closedShift = await closeTodayHisab({
      businessId: session!.businessId,
      shiftId: parsed.data.shiftId,
      actualCountedCashPaise: parsed.data.actualCountedCashPaise,
      closingNotes: parsed.data.closingNotes,
      userId: session!.userId,
      userName: session!.name,
    });

    return NextResponse.json({
      success: true,
      message: "Today's hisab has been closed and locked successfully!",
      data: closedShift,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to close hisab" },
      { status: 400 }
    );
  }
}
