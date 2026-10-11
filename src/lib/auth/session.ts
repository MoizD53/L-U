import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { UserSession } from "../types";

const COOKIE_NAME = "levelup_session";
const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "levelup_dahod_super_secure_jwt_secret_key_2026_gujarat_arena"
);

export async function signSessionToken(session: UserSession): Promise<string> {
  return await new SignJWT({ ...session })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d") // Shift operators stay logged in for 30 days
    .sign(SECRET);
}

export async function verifySessionToken(token: string): Promise<UserSession | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return {
      userId: payload.userId as string,
      businessId: payload.businessId as string,
      username: payload.username as string,
      name: payload.name as string,
      role: payload.role as "OWNER" | "MANAGER",
    };
  } catch {
    return null;
  }
}

export async function getCurrentSession(): Promise<UserSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return await verifySessionToken(token);
  } catch {
    return null;
  }
}

export async function requireSession(): Promise<UserSession> {
  const session = await getCurrentSession();
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}

export async function requireOwner(): Promise<UserSession> {
  const session = await requireSession();
  if (session.role !== "OWNER") {
    throw new Error("FORBIDDEN: Only the arena owner can perform this action");
  }
  return session;
}

export { COOKIE_NAME };
