import { NextRequest, NextResponse } from "next/server";

function decodeJwtPayload(
  token: string
): { userId: string; role: string; sessionId: string; exp?: number } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(
      Buffer.from(parts[1], "base64url").toString()
    );
    if (payload.exp && payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

const protectedPaths = ["/owner", "/agent"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = protectedPaths.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  const token = request.cookies.get("propstealth_session")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const payload = decodeJwtPayload(token);

  if (!payload) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("propstealth_session");
    return response;
  }

  const isOwnerRoute = pathname === "/owner" || pathname.startsWith("/owner/");
  const isAgentRoute = pathname === "/agent" || pathname.startsWith("/agent/");

  if (isOwnerRoute && payload.role !== "owner") {
    return NextResponse.redirect(new URL("/agent", request.url));
  }

  if (isAgentRoute && payload.role !== "agent") {
    return NextResponse.redirect(new URL("/owner", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/owner", "/owner/:path*", "/agent", "/agent/:path*"],
};
