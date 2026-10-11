import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticateApi } from "@/lib/auth/api-guard";
import { recordCounterSale } from "@/lib/services/shop.service";

const saleSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string().min(1),
      quantity: z.number().int().positive(),
    })
  ).min(1, "At least one item is required"),
  paymentMethod: z.enum(["CASH", "UPI", "SPLIT", "CREDIT"]),
  cashAmountPaise: z.number().int().min(0).optional(),
  upiAmountPaise: z.number().int().min(0).optional(),
  discountPaise: z.number().int().min(0).default(0),
  customerId: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export async function POST(req: NextRequest) {
  const { session, errorResponse } = await authenticateApi();
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const parsed = saleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const result = await recordCounterSale({
      businessId: session!.businessId,
      items: parsed.data.items,
      paymentMethod: parsed.data.paymentMethod,
      cashAmountPaise: parsed.data.cashAmountPaise,
      upiAmountPaise: parsed.data.upiAmountPaise,
      discountPaise: parsed.data.discountPaise,
      customerId: parsed.data.customerId,
      notes: parsed.data.notes,
      userId: session!.userId,
    });

    return NextResponse.json({
      success: true,
      message: `Counter sale completed! Bill #${result.billNumber}`,
      data: result,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to record counter sale" },
      { status: 400 }
    );
  }
}
