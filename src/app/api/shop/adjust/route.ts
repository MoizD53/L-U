import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticateApi } from "@/lib/auth/api-guard";
import { adjustStock } from "@/lib/services/shop.service";

const adjustSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  newStock: z.number().int().min(0, "Stock cannot be negative"),
  reason: z.string().min(3, "Reason for stock adjustment is required"),
});

export async function POST(req: NextRequest) {
  const { session, errorResponse } = await authenticateApi("OWNER");
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const parsed = adjustSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    await adjustStock({
      businessId: session!.businessId,
      productId: parsed.data.productId,
      newStock: parsed.data.newStock,
      reason: parsed.data.reason,
      userId: session!.userId,
    });

    return NextResponse.json({
      success: true,
      message: "Stock adjusted and audit logged successfully!",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to adjust stock" },
      { status: 400 }
    );
  }
}
