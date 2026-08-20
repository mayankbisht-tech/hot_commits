import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";

// Routes that require NO auth
const PUBLIC_PATHS = ["/login", "/signup", "/api/auth/login", "/api/auth/logout", "/api/auth/signup"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public paths, static files, Next.js internals
  if (
    PUBLIC_PATHS.some(p => pathname.startsWith(p)) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname === "/"
  ) {
    return NextResponse.next();
  }

  const user = getUserFromRequest(req);

  // Not authenticated — redirect to login
  if (!user) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Role-based route guards
  const isTPORoute = pathname.startsWith("/tpo") || pathname.startsWith("/api/students") || pathname.startsWith("/api/reports");
  const isCompanyRoute = pathname.startsWith("/company");
  const isStudentRoute = pathname.startsWith("/student");

  if (isTPORoute && user.role !== "TPO") {
    return NextResponse.redirect(new URL(`/${user.role.toLowerCase()}`, req.url));
  }
  if (isCompanyRoute && user.role !== "COMPANY") {
    return NextResponse.redirect(new URL(`/${user.role.toLowerCase()}`, req.url));
  }
  if (isStudentRoute && user.role !== "STUDENT") {
    return NextResponse.redirect(new URL(`/${user.role.toLowerCase()}`, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
