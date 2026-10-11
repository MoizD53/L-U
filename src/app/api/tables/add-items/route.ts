import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticateApi } from "@/lib/auth/api-guard";
import { addItemsToSession } from "@/lib/services/tables.service";

const addItemsSchema = z.object({
  sessionId: z.string().min(1, "Session ID is required"),
  items: z.array(
    z.object({
      productId: z.string().min(1),
      quantity: z.number().int().positive("Quantity must be at least 1"),
    })
  ).min(1, "At least one item must be added"),
});

export async function POST(req: NextRequest) {
  const { session, errorResponse } = await authenticateApi();
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const parsed = addItemsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const added = await addItemsToSession({
      businessId: session!.businessId,
      sessionId: parsed.data.sessionId,
      items: parsed.data.items,
      userId: session!.userId,
    });

    return NextResponse.json({
      success: true,
      message: `Added ${added.length} item(s) to table session`,
      data: added,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to add items to session" },
      { status: 400 }
    );
  }
}
