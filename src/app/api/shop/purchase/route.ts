import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticateApi } from "@/lib/auth/api-guard";
import { recordStockPurchase } from "@/lib/services/shop.service";

const purchaseSchema = z.object({
  supplierId: z.string().min(1, "Supplier is required"),
  invoiceNumber: z.string().optional(),
  purchaseDate: z.string().min(1, "Purchase date is required"),
  items: z.array(
    z.object({
      productId: z.string().min(1),
      quantity: z.number().int().positive(),
      unitCostPaise: z.number().int().positive(),
    })
  ).min(1, "At least one product required"),
  paidAmountPaise: z.number().int().min(0),
  paymentMethod: z.enum(["CASH", "UPI", "CREDIT"]),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const { session, errorResponse } = await authenticateApi("OWNER");
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const parsed = purchaseSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const purchaseId = await recordStockPurchase({
      businessId: session!.businessId,
      supplierId: parsed.data.supplierId,
      invoiceNumber: parsed.data.invoiceNumber,
      purchaseDate: parsed.data.purchaseDate,
      items: parsed.data.items,
      paidAmountPaise: parsed.data.paidAmountPaise,
      paymentMethod: parsed.data.paymentMethod,
      notes: parsed.data.notes,
      userId: session!.userId,
    });

    return NextResponse.json({
      success: true,
      message: "Supplier purchase recorded and inventory updated!",
      data: { purchaseId },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to record stock purchase" },
      { status: 400 }
    );
  }
}
