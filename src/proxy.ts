import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

// Admin-only områder (data på tvers av organisasjoner)
const ADMIN_PAGES = ["/dashboard/admin", "/dashboard/invoices", "/dashboard/oversikt", "/dashboard/crm"];
const ADMIN_APIS = ["/api/admin", "/api/invoices", "/api/recurring-invoices", "/api/calendar"];

const startsWithAny = (path: string, list: string[]) =>
  list.some((p) => path === p || path.startsWith(p + "/"));

// Interne API-er som kundebrukere aldri skal nå (skjema-innsending /api/forms/*/submit er offentlig og er ikke med i matcheren).
const STAFF_ONLY_APIS = ["/api/leads", "/api/automations", "/api/email-templates", "/api/upload"];

/** Rene beslutninger (testes i portal.test.ts). */
export function decide(pathname: string, role: string | undefined): "ok" | "to-customer" | "forbidden" {
  const isApi = pathname.startsWith("/api/");
  const isAdmin = role === "SUPER_ADMIN";
  // Kundebrukere (og alt annet enn administrator) har ingenting i /dashboard – bare /customer.
  if (!isAdmin && pathname.startsWith("/dashboard")) return "to-customer";
  if (!isAdmin && (startsWithAny(pathname, ADMIN_APIS) || startsWithAny(pathname, STAFF_ONLY_APIS) || (pathname.startsWith("/api/forms") && !/\/submit\/?$/.test(pathname)))) return isApi ? "forbidden" : "to-customer";
  return "ok";
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const isApi = pathname.startsWith("/api/");
  // Offentlig innsending fra kundenes nettsider (skjema-API) – aldri bak innlogging
  if (/^\/api\/forms\/[^/]+\/submit\/?$/.test(pathname)) return NextResponse.next();
  // Fase 4: innloggingssidene for kundeportalen er offentlige
  if (pathname === "/customer/login" || pathname.startsWith("/customer/login/")) return NextResponse.next();

  if (!token) {
    if (isApi) return NextResponse.json({ error: "Ikke autorisert" }, { status: 401 });
    const url = new URL(pathname.startsWith("/customer") ? "/customer/login" : "/login", req.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  const d = decide(pathname, token.role as string | undefined);
  if (d === "forbidden") return NextResponse.json({ error: "Ikke autorisert" }, { status: 403 });
  if (d === "to-customer") return NextResponse.redirect(new URL("/customer", req.url));
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
    "/api/leads/:path*",
    "/api/automations/:path*",
    "/api/email-templates/:path*",
    "/api/upload/:path*",
    "/api/forms/:path*",
  ],
};
