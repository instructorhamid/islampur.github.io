import { NextResponse, type NextRequest } from "next/server";

// Cheap first gate: visitors without a session cookie are sent to the login page.
// The real check (valid, unexpired session of an active admin) happens server-side
// in requireAdmin() on every admin page, action and route.
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/admin/login") return NextResponse.next();
  if (!request.cookies.has("ihs_admin_session")) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/admin", "/admin/:path*"] };
