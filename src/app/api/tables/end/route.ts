import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticateApi } from "@/lib/auth/api-guard";
import { endTableSessionAndFinalizeBill } from "@/lib/services/tables.service";

const endSessionSchema = z.object({
  sessionId: z.string().min(1, "Session ID is required"),
  discountPaise: z.number().int().min(0).default(0),
  cashAmountPaise: z.number().int().min(0).optional(),
  upiAmountPaise: z.number().int().min(0).optional(),
  paymentMethod: z.enum(["CASH", "UPI", "SPLIT", "CREDIT"]),
  customerId: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export async function POST(req: NextRequest) {
  const { session, errorResponse } = await authenticateApi();
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const parsed = endSessionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const result = await endTableSessionAndFinalizeBill({
      businessId: session!.businessId,
      sessionId: parsed.data.sessionId,
      discountPaise: parsed.data.discountPaise,
      cashAmountPaise: parsed.data.cashAmountPaise,
      upiAmountPaise: parsed.data.upiAmountPaise,
      paymentMethod: parsed.data.paymentMethod,
      customerId: parsed.data.customerId,
      notes: parsed.data.notes,
      userId: session!.userId,
    });

    return NextResponse.json({
      success: true,
      message: `Bill ${result.billNumber} created successfully! Table is now free.`,
      data: result,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to finalize bill and end table session" },
      { status: 400 }
    );
  }
}
