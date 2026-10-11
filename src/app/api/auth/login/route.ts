import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { loginUser } from "@/lib/services/auth.service";
import { checkRateLimit, resetRateLimit } from "@/lib/auth/rate-limit";
import { COOKIE_NAME } from "@/lib/auth/session";

const loginSchema = z.object({
  username: z.string().min(1, "User ID is required"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { username, password } = parsed.data;

    // Rate limiting: 5 attempts per 60 seconds
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const rateLimitKey = `login_${ip}_${username.toLowerCase()}`;
    const rateLimit = checkRateLimit(rateLimitKey, 5, 60000);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: `Too many login attempts. Please wait ${rateLimit.retryAfterSeconds} seconds before trying again.`,
        },
        { status: 429 }
      );
    }

    const { token, user } = await loginUser(username, password);

    // Reset rate limit on success
    resetRateLimit(rateLimitKey);

    const response = NextResponse.json({
      success: true,
      user,
      message: `Welcome back, ${user.name}!`,
    });

    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Login failed. Check credentials." },
      { status: 401 }
    );
  }
}
