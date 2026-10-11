import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticateApi } from "@/lib/auth/api-guard";
import { getProducts } from "@/lib/services/shop.service";
import { db } from "@/lib/db/client";

const productSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Product name is required"),
  category: z.string().min(1, "Category is required"),
  brand: z.string().optional().nullable(),
  sellingPricePaise: z.number().int().positive("Selling price must be positive"),
  costPricePaise: z.number().int().min(0).default(0),
  currentStock: z.number().int().min(0).default(0),
  lowStockThreshold: z.number().int().min(0).default(5),
  unit: z.string().default("pcs"),
  packPieceRatio: z.number().int().positive().default(1),
});

export async function GET(req: NextRequest) {
  const { session, errorResponse } = await authenticateApi();
  if (errorResponse) return errorResponse;

  const url = new URL(req.url);
  const category = url.searchParams.get("category") || undefined;
  const search = url.searchParams.get("search") || undefined;

  try {
    const products = await getProducts(session!.businessId, category, search);
    return NextResponse.json({ success: true, data: products });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to load products" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  // Only OWNER can add or edit product catalog
  const { session, errorResponse } = await authenticateApi("OWNER");
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const parsed = productSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const nowIso = new Date().toISOString();

    if (data.id) {
      // Update existing
      await db.execute({
        sql: `UPDATE products
              SET name = ?, category = ?, brand = ?, selling_price_paise = ?,
                  cost_price_paise = ?, current_stock = ?, low_stock_threshold = ?,
                  unit = ?, pack_piece_ratio = ?, updated_at = ?
              WHERE id = ? AND business_id = ?`,
        args: [
          data.name,
          data.category,
          data.brand || null,
          data.sellingPricePaise,
          data.costPricePaise,
          data.currentStock,
          data.lowStockThreshold,
          data.unit,
          data.packPieceRatio,
          nowIso,
          data.id,
          session!.businessId,
        ],
      });
      return NextResponse.json({ success: true, message: `Product "${data.name}" updated!` });
    } else {
      // Create new
      const prodId = `prod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      await db.execute({
        sql: `INSERT INTO products (
                id, business_id, name, category, brand, selling_price_paise,
                cost_price_paise, current_stock, low_stock_threshold, unit,
                pack_piece_ratio, is_active, created_at, updated_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
        args: [
          prodId,
          session!.businessId,
          data.name,
          data.category,
          data.brand || null,
          data.sellingPricePaise,
          data.costPricePaise,
          data.currentStock,
          data.lowStockThreshold,
          data.unit,
          data.packPieceRatio,
          nowIso,
          nowIso,
        ],
      });
      return NextResponse.json({ success: true, message: `Product "${data.name}" created!` });
    }
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to save product" },
      { status: 400 }
    );
  }
}
