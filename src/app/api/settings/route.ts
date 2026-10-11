import { NextRequest, NextResponse } from "next/server";
import { authenticateApi } from "@/lib/auth/api-guard";
import { db } from "@/lib/db/client";

export async function GET() {
  const { session, errorResponse } = await authenticateApi();
  if (errorResponse) return errorResponse;

  const bizId = session!.businessId;

  const [bizRes, tablesRes, ratePlansRes, usersRes, expCatsRes] = await Promise.all([
    db.execute({ sql: `SELECT * FROM businesses WHERE id = ?`, args: [bizId] }),
    db.execute({
      sql: `SELECT t.*, rp.name as rate_plan_name, rp.hourly_rate_paise
            FROM tables t
            LEFT JOIN rate_plans rp ON t.rate_plan_id = rp.id
            WHERE t.business_id = ?
            ORDER BY t.type ASC, t.display_order ASC`,
      args: [bizId],
    }),
    db.execute({
      sql: `SELECT * FROM rate_plans WHERE business_id = ? ORDER BY game_type ASC, name ASC`,
      args: [bizId],
    }),
    db.execute({
      sql: `SELECT id, username, name, role, phone, is_active, created_at FROM users WHERE business_id = ?`,
      args: [bizId],
    }),
    db.execute({
      sql: `SELECT * FROM expense_categories WHERE business_id = ? ORDER BY display_order ASC`,
      args: [bizId],
    }),
  ]);

  return NextResponse.json({
    success: true,
    data: {
      business: bizRes.rows[0],
      tables: tablesRes.rows,
      ratePlans: ratePlansRes.rows,
      users: session!.role === "OWNER" ? usersRes.rows : [],
      expenseCategories: expCatsRes.rows,
      currentUser: session,
    },
  });
}

export async function POST(req: NextRequest) {
  const { session, errorResponse } = await authenticateApi("OWNER");
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { action, payload } = body;
    const bizId = session!.businessId;
    const nowIso = new Date().toISOString();

    if (action === "ADD_TABLE") {
      const tableId = `tbl_${payload.type.toLowerCase()}_${Date.now().toString().slice(-4)}`;
      await db.execute({
        sql: `INSERT INTO tables (id, business_id, name, type, rate_plan_id, display_order, is_active, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)`,
        args: [
          tableId,
          bizId,
          payload.name,
          payload.type,
          payload.ratePlanId || null,
          payload.displayOrder || 1,
          nowIso,
          nowIso,
        ],
      });
      return NextResponse.json({ success: true, message: `Table "${payload.name}" added!` });
    }

    if (action === "UPDATE_RATE_PLAN") {
      await db.execute({
        sql: `UPDATE rate_plans
              SET name = ?, hourly_rate_paise = ?, minimum_charge_paise = ?,
                  billing_increment_minutes = ?, rounding_mode = ?, updated_at = ?
              WHERE id = ? AND business_id = ?`,
        args: [
          payload.name,
          payload.hourlyRatePaise,
          payload.minimumChargePaise,
          payload.billingIncrementMinutes,
          payload.roundingMode,
          nowIso,
          payload.id,
          bizId,
        ],
      });
      return NextResponse.json({ success: true, message: "Rate plan updated!" });
    }

    if (action === "UPDATE_TABLE_RATE") {
      await db.execute({
        sql: `UPDATE tables SET rate_plan_id = ?, updated_at = ? WHERE id = ? AND business_id = ?`,
        args: [payload.ratePlanId, nowIso, payload.tableId, bizId],
      });
      return NextResponse.json({ success: true, message: "Table rate plan updated!" });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update settings" }, { status: 400 });
  }
}
