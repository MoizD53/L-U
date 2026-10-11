import { NextResponse } from "next/server";
import { getCurrentSession } from "./session";
import type { UserSession, UserRole } from "../types";

export async function authenticateApi(requiredRole?: UserRole): Promise<{
  session: UserSession | null;
  errorResponse?: NextResponse;
}> {
  const session = await getCurrentSession();

  if (!session) {
    return {
      session: null,
      errorResponse: NextResponse.json(
        { error: "Authentication required. Please sign in." },
        { status: 401 }
      ),
    };
  }

  if (requiredRole && session.role !== requiredRole && session.role !== "OWNER") {
    return {
      session: null,
      errorResponse: NextResponse.json(
        { error: `Forbidden: Only ${requiredRole} can perform this action.` },
        { status: 403 }
      ),
    };
  }

  return { session };
}
