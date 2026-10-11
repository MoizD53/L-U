import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { db } from "@/lib/db/client";

export async function GET() {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ authenticated: false, user: null });
  }

  const bizRes = await db.execute({
    sql: `SELECT name, tagline, location, phone FROM businesses WHERE id = ?`,
    args: [session.businessId],
  });

  const business = bizRes.rows.length > 0 ? bizRes.rows[0] : null;

  return NextResponse.json({
    authenticated: true,
    user: session,
    business,
  });
}
