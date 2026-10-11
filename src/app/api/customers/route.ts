import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticateApi } from "@/lib/auth/api-guard";
import { getCustomers, createCustomer } from "@/lib/services/customers.service";

const createCustomerSchema = z.object({
  name: z.string().min(2, "Customer name must be at least 2 characters"),
  phone: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  const { session, errorResponse } = await authenticateApi();
  if (errorResponse) return errorResponse;

  const url = new URL(req.url);
  const search = url.searchParams.get("search") || undefined;

  try {
    const customers = await getCustomers(session!.businessId, search);
    return NextResponse.json({ success: true, data: customers });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to load customers" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const { session, errorResponse } = await authenticateApi();
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const parsed = createCustomerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const newCust = await createCustomer({
      businessId: session!.businessId,
      name: parsed.data.name,
      phone: parsed.data.phone,
      notes: parsed.data.notes,
    });

    return NextResponse.json({
      success: true,
      message: `Customer "${newCust.name}" registered successfully!`,
      data: newCust,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to register customer" },
      { status: 400 }
    );
  }
}
