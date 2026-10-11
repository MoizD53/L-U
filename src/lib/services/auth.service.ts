import bcrypt from "bcryptjs";
import { db } from "../db/client";
import { signSessionToken } from "../auth/session";
import type { UserSession } from "../types";

export async function loginUser(
  username: string,
  passwordPlain: string
): Promise<{ token: string; user: UserSession }> {
  const result = await db.execute({
    sql: `SELECT id, business_id, username, password_hash, name, role, is_active
          FROM users
          WHERE username = ?`,
    args: [username.trim().toLowerCase()],
  });

  if (result.rows.length === 0) {
    throw new Error("Invalid username or password");
  }

  const userRow = result.rows[0];

  if (Number(userRow.is_active) !== 1) {
    throw new Error("Account is inactive. Please contact the arena owner.");
  }

  const isPasswordMatch = await bcrypt.compare(
    passwordPlain,
    String(userRow.password_hash)
  );

  if (!isPasswordMatch) {
    throw new Error("Invalid username or password");
  }

  const sessionPayload: UserSession = {
    userId: String(userRow.id),
    businessId: String(userRow.business_id),
    username: String(userRow.username),
    name: String(userRow.name),
    role: userRow.role as "OWNER" | "MANAGER",
  };

  const token = await signSessionToken(sessionPayload);

  // Record audit log for login
  await db.execute({
    sql: `INSERT INTO audit_logs (id, business_id, user_id, user_name, action, entity_type, entity_id, created_at)
          VALUES (?, ?, ?, ?, 'USER_LOGIN', 'USER', ?, ?)`,
    args: [
      `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      sessionPayload.businessId,
      sessionPayload.userId,
      sessionPayload.name,
      sessionPayload.userId,
      new Date().toISOString(),
    ],
  });

  return { token, user: sessionPayload };
}
