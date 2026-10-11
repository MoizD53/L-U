import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticateApi } from "@/lib/auth/api-guard";
import { collectUdhaarRepayment } from "@/lib/services/customers.service";

const collectUdhaarSchema = z.object({
  customerId: z.string().min(1, "Customer ID is required"),
  amountPaise: z.number().int().positive("Repayment amount must be greater than zero"),
  paymentMethod: z.enum(["CASH", "UPI", "SPLIT"]),
  cashAmountPaise: z.number().int().min(0).optional(),
  upiAmountPaise: z.number().int().min(0).optional(),
  notes: z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  const { session, errorResponse } = await authenticateApi();
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const parsed = collectUdhaarSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const result = await collectUdhaarRepayment({
      businessId: session!.businessId,
      customerId: parsed.data.customerId,
      amountPaise: parsed.data.amountPaise,
      paymentMethod: parsed.data.paymentMethod,
      cashAmountPaise: parsed.data.cashAmountPaise,
      upiAmountPaise: parsed.data.upiAmountPaise,
      notes: parsed.data.notes,
      userId: session!.userId,
      userName: session!.name,
    });

    return NextResponse.json({
      success: true,
      message: "Udhaar repayment recorded in daily hisab!",
      data: result,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to record udhaar collection" },
      { status: 400 }
    );
  }
}
