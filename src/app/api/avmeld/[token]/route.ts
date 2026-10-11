import { unsubscribeByToken } from "@/lib/crm/outreach";

// RFC 8058 ett-klikks avmelding (List-Unsubscribe-Post). Offentlig, ingen innlogging.
export async function POST(_: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const r = await unsubscribeByToken(token);
  return Response.json({ ok: r.ok }, { status: r.ok ? 200 : 404 });
}
