import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticateApi } from "@/lib/auth/api-guard";
import { startTableSession } from "@/lib/services/tables.service";

const startSessionSchema = z.object({
  tableId: z.string().min(1, "Table ID is required"),
  customerId: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  customHourlyRatePaise: z.number().int().positive().optional(),
});

export async function POST(req: NextRequest) {
  const { session, errorResponse } = await authenticateApi();
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const parsed = startSessionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const gameSession = await startTableSession({
      businessId: session!.businessId,
      tableId: parsed.data.tableId,
      customerId: parsed.data.customerId,
      notes: parsed.data.notes,
      customHourlyRatePaise: parsed.data.customHourlyRatePaise,
      userId: session!.userId,
    });

    return NextResponse.json({
      success: true,
      message: "Game session started!",
      data: gameSession,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to start table game" },
      { status: 400 }
    );
  }
}
