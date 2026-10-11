// Fase 4 – varsel om ny innsending. Går BARE til kundens egne brukere som selv har slått det på,
// og er sperret til Resend-domenet er verifisert (samme helsesjekk som fase 3).
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { emailHealth } from "@/lib/crm/mailer";
import { notificationRecipients, summary } from "./core";

export async function notifyNewSubmission(s: { id: string; organizationId: string; formName: string; data: unknown }) {
  const users = await db.user.findMany({ where: { organizationId: s.organizationId }, select: { email: true, role: true, organizationId: true, notifyNewSubmissions: true } });
  const to = notificationRecipients(users, s.organizationId);
  if (!to.length) return { sent: 0, reason: "ingen har slått på varsel" };
  const h = await emailHealth();
  if (!h.ok || h.dryRun) return { sent: 0, reason: `sperret: ${h.reasons.join("; ") || "testmodus"}` };
  const base = (process.env.CRM_PUBLIC_URL || "https://crm.intellisenseai.no").replace(/\/$/, "");
  const sum = summary(s.data);
  let sent = 0;
  for (const email of to) {
    const r = await sendEmail({
      to: email, from: process.env.EMAIL_FROM,
      subject: `Ny henvendelse via ${s.formName}`,
      html: `<p>Du har fått en ny henvendelse via <strong>${s.formName}</strong> fra ${sum.navn.replace(/[<>&]/g, "")}.</p><p><a href="${base}/customer/leads/${s.id}">Åpne i kundeportalen</a></p><p style="color:#64748b;font-size:12px">Du får dette fordi du har slått på varsler. Slå av under Innstillinger i portalen.</p>`,
    });
    if (r.success) sent++;
  }
  return { sent };
}
