// Varsel om ny innsending. Går BARE til kundens egne brukere som selv har slått det på.
// AV inntil André slår det på: krever PORTAL_NOTIFY_ENABLED=1 i Vercel OG at Resend-domenet er verifisert
// (samme helsesjekk som fase 3, se portalNotifyGate). Ellers logges bare at varselet ble sperret.
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { emailHealth } from "@/lib/crm/mailer";
import { notificationRecipients, portalNotifyGate, alertContent } from "./core";

export async function notifyNewSubmission(s: { id: string; organizationId: string; formName: string; data: unknown }) {
  const users = await db.user.findMany({ where: { organizationId: s.organizationId }, select: { email: true, role: true, organizationId: true, notifyNewSubmissions: true } });
  const to = notificationRecipients(users, s.organizationId);
  if (!to.length) return { sent: 0, reason: "ingen har slått på varsel" };
  const gate = portalNotifyGate(process.env, await emailHealth());
  if (!gate.on) {
    await db.activityLog.create({ data: { action: "portal.notify.skipped", resource: "submission", resourceId: s.id, details: { mottakere: to.length, grunn: gate.reason } } }).catch(() => {});
    return { sent: 0, reason: `sperret: ${gate.reason}` };
  }
  const base = process.env.CRM_PUBLIC_URL || "https://crm.intellisenseai.no";
  const m = alertContent({ id: s.id, formName: s.formName, data: s.data, baseUrl: base });
  let sent = 0;
  for (const email of to) {
    const r = await sendEmail({ to: email, from: process.env.EMAIL_FROM, subject: m.subject, html: m.html, text: m.text });
    if (r.success) sent++;
  }
  await db.activityLog.create({ data: { action: "portal.notify.sent", resource: "submission", resourceId: s.id, details: { sent, mottakere: to.length } } }).catch(() => {});
  return { sent };
}
