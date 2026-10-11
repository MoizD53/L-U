import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticateApi } from "@/lib/auth/api-guard";
import { getExpenses, addExpense, getExpenseCategories } from "@/lib/services/expenses.service";

const addExpenseSchema = z.object({
  categoryId: z.string().min(1, "Category is required"),
  title: z.string().min(2, "Expense title is required"),
  amountPaise: z.number().int().positive("Amount must be greater than zero"),
  paymentMethod: z.enum(["CASH", "UPI"]),
  paidBy: z.enum(["BUSINESS_DRAWER", "PERSONAL_FUNDS", "BANK"]),
  payee: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  receiptUrl: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  const { session, errorResponse } = await authenticateApi();
  if (errorResponse) return errorResponse;

  const url = new URL(req.url);
  const categoryId = url.searchParams.get("categoryId") || undefined;
  const startDate = url.searchParams.get("startDate") || undefined;
  const endDate = url.searchParams.get("endDate") || undefined;

  try {
    const expenses = await getExpenses(session!.businessId, {
      categoryId,
      startDateIso: startDate,
      endDateIso: endDate,
    });
    const categories = await getExpenseCategories(session!.businessId);
    return NextResponse.json({ success: true, data: { expenses, categories } });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to load expenses" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const { session, errorResponse } = await authenticateApi();
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const parsed = addExpenseSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const created = await addExpense({
      businessId: session!.businessId,
      categoryId: parsed.data.categoryId,
      title: parsed.data.title,
      amountPaise: parsed.data.amountPaise,
      paymentMethod: parsed.data.paymentMethod,
      paidBy: parsed.data.paidBy,
      payee: parsed.data.payee,
      notes: parsed.data.notes,
      receiptUrl: parsed.data.receiptUrl,
      userId: session!.userId,
    });

    return NextResponse.json({
      success: true,
      message: `Expense of ₹${(created.amount_paise / 100).toFixed(2)} recorded!`,
      data: created,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to add expense" },
      { status: 400 }
    );
  }
}
