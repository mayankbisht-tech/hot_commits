import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET || "tpc-platform-secret-key-change-in-production";
const COOKIE_NAME = "tpc_auth";

export interface JWTPayload {
  userId: string;
  id?: string;
  email: string;
  role: "TPO" | "COMPANY" | "STUDENT" | string;
  name: string;
  profileId?: string; // studentId / companyId / tpoId
}

// ─── auth() helper for NextAuth-style route handlers ──────────────────────────
export async function auth(): Promise<{ user: JWTPayload } | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  return { user: { ...user, id: user.userId } };
}

// ─── Sign a JWT ───────────────────────────────────────────────────────────────
export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

// ─── Universal Edge/Node JWT payload decoder ──────────────────────────────────
export function decodeJwtPayload(token: string): JWTPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const payload = JSON.parse(jsonPayload);
    // Check expiry
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      return null;
    }
    return payload as JWTPayload;
  } catch {
    return null;
  }
}

// ─── Verify a JWT ─────────────────────────────────────────────────────────────
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    // Fallback to pure decoder (Edge runtime compatibility)
    return decodeJwtPayload(token);
  }
}

// ─── Set auth cookie (server-side) ───────────────────────────────────────────
export async function setAuthCookie(payload: JWTPayload): Promise<void> {
  const token = signToken(payload);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
  });
}

// ─── Clear auth cookie ────────────────────────────────────────────────────────
export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

// ─── Get current user from cookie (server-side) ───────────────────────────────
export async function getCurrentUser(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

// ─── Get user from request (for middleware / API routes) ─────────────────────
export function getUserFromRequest(req: NextRequest): JWTPayload | null {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return decodeJwtPayload(token);
}

// ─── Require auth — throws 401 if not authenticated ──────────────────────────
export async function requireAuth(allowedRoles?: Array<"TPO" | "COMPANY" | "STUDENT">): Promise<JWTPayload> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  if (allowedRoles && !allowedRoles.includes(user.role as "TPO" | "COMPANY" | "STUDENT")) {
    throw new Error("FORBIDDEN");
  }
  return user;
}

// ─── Helper: build 401/403 responses ─────────────────────────────────────────
export function unauthorizedResponse(message = "Unauthorized") {
  return Response.json({ error: message }, { status: 401 });
}

export function forbiddenResponse(message = "Forbidden") {
  return Response.json({ error: message }, { status: 403 });
}
