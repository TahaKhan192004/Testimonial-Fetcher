import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * First lock on /admin and /api/admin: valid Supabase session, then a row in
 * admin_users (checked through is_feedback_admin()). RLS is the second lock at the query level.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isApi = pathname.startsWith("/api/");
  const isLogin = pathname === "/admin/login";

  let response = NextResponse.next({ request });
  response.headers.set("X-Robots-Tag", "noindex, nofollow");

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return isLogin ? response : new NextResponse("Supabase is not configured.", { status: 503 });
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        response.headers.set("X-Robots-Tag", "noindex, nofollow");
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const deny = (reason: "signed_out" | "not_admin") => {
    if (isApi) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    if (isLogin) return response;
    const login = new URL("/admin/login", request.url);
    if (reason === "not_admin") login.searchParams.set("error", "not_admin");
    return NextResponse.redirect(login);
  };

  const { data } = await supabase.auth.getUser();
  if (!data.user) return deny("signed_out");

  const { data: isAdmin } = await supabase.rpc("is_feedback_admin");
  if (isAdmin !== true) return deny("not_admin");

  if (isLogin) return NextResponse.redirect(new URL("/admin", request.url));
  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
