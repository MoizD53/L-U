import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticateApi } from "@/lib/auth/api-guard";
import { recordCashMovement } from "@/lib/services/closing.service";

const movementSchema = z.object({
  shiftId: z.string().min(1, "Shift ID is required"),
  movementType: z.enum(["ADDITION", "WITHDRAWAL"]),
  amountPaise: z.number().int().positive("Amount must be greater than zero"),
  reason: z.string().min(2, "Reason is required"),
});

export async function POST(req: NextRequest) {
  const { session, errorResponse } = await authenticateApi();
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const parsed = movementSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    await recordCashMovement({
      businessId: session!.businessId,
      shiftId: parsed.data.shiftId,
      movementType: parsed.data.movementType,
      amountPaise: parsed.data.amountPaise,
      reason: parsed.data.reason,
      userId: session!.userId,
    });

    return NextResponse.json({
      success: true,
      message: `Cash ${parsed.data.movementType.toLowerCase()} of ₹${(parsed.data.amountPaise / 100).toFixed(2)} recorded!`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to record cash movement" },
      { status: 400 }
    );
  }
}
