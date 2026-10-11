import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

// Admin-only områder (data på tvers av organisasjoner)
const ADMIN_PAGES = ["/dashboard/admin", "/dashboard/invoices", "/dashboard/oversikt", "/dashboard/crm"];
const ADMIN_APIS = ["/api/admin", "/api/invoices", "/api/recurring-invoices", "/api/calendar"];

const startsWithAny = (path: string, list: string[]) =>
  list.some((p) => path === p || path.startsWith(p + "/"));

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const isApi = pathname.startsWith("/api/");
  // Fase 4: innloggingssidene for kundeportalen er offentlige
  if (pathname === "/customer/login" || pathname.startsWith("/customer/login/")) return NextResponse.next();

  if (!token) {
    if (isApi) return NextResponse.json({ error: "Ikke autorisert" }, { status: 401 });
    const url = new URL(pathname.startsWith("/customer") ? "/customer/login" : "/login", req.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  const isAdmin = token.role === "SUPER_ADMIN";
  if (!isAdmin && (startsWithAny(pathname, ADMIN_PAGES) || startsWithAny(pathname, ADMIN_APIS))) {
    if (isApi) return NextResponse.json({ error: "Ikke autorisert" }, { status: 403 });
    return NextResponse.redirect(new URL("/customer", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/customer/:path*",
    "/api/admin/:path*",
    "/api/invoices/:path*",
    "/api/recurring-invoices/:path*",
    "/api/calendar/:path*",
  ],
};
