import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, adminPasswordSet, isValidSession } from "@/lib/admin-auth";

/** Gate for /admin and /api/admin: a single shared password, stored as a signed cookie. */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isApi = pathname.startsWith("/api/");
  const isLogin = pathname === "/admin/login";

  const done = (res: NextResponse) => {
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
    return res;
  };

  if (isLogin) {
    if (isValidSession(request.cookies.get(ADMIN_COOKIE)?.value)) {
      return done(NextResponse.redirect(new URL("/admin", request.url)));
    }
    return done(NextResponse.next());
  }

  if (!adminPasswordSet()) {
    return done(new NextResponse("ADMIN_PASSWORD is not set.", { status: 503 }));
  }

  if (!isValidSession(request.cookies.get(ADMIN_COOKIE)?.value)) {
    return done(
      isApi
        ? NextResponse.json({ error: "unauthorized" }, { status: 401 })
        : NextResponse.redirect(new URL("/admin/login", request.url)),
    );
  }

  return done(NextResponse.next());
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
