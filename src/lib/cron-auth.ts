import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";

/**
 * Fail closed: avviser cron-kall hvis CRON_SECRET mangler eller ikke matcher.
 * Kalles FØR noe databasekall. Vercel Cron sender automatisk
 * "Authorization: Bearer <CRON_SECRET>" når variabelen er satt i prosjektet.
 */
export function requireCronAuth(request: NextRequest): NextResponse | null {
  const secret = process.env.CRON_SECRET;
  const header = request.headers.get("authorization") ?? "";
  if (!secret || secret.length < 16) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const expected = Buffer.from(`Bearer ${secret}`);
  const actual = Buffer.from(header);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
