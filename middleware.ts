import { NextRequest, NextResponse } from "next/server";

const ADMIN_ACCESS_COOKIE = "admin_access_key";
const ADMIN_LOGIN_PATH = "/admin/login";

function redirectTo(request: NextRequest, pathname: string) {
  return NextResponse.redirect(new URL(pathname, request.url));
}

export function middleware(request: NextRequest) {
  const accessKey = process.env.ADMIN_ACCESS_KEY;
  if (!accessKey) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;
  const keyMatch = pathname.match(/^\/admin\/login\/([^/]+)$/);

  if (keyMatch) {
    const suppliedKey = decodeURIComponent(keyMatch[1]);
    if (suppliedKey !== accessKey) {
      return redirectTo(request, "/");
    }

    const response = redirectTo(request, ADMIN_LOGIN_PATH);
    response.cookies.set(ADMIN_ACCESS_COOKIE, accessKey, {
      httpOnly: true,
      maxAge: 60 * 60 * 12,
      path: "/admin",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    return response;
  }

  const savedAccessKey = request.cookies.get(ADMIN_ACCESS_COOKIE)?.value;
  if (savedAccessKey !== accessKey) {
    return redirectTo(request, "/");
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
