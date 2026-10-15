import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// DELETE /api/leads/[submissionId] – hard sletting av en innsending (kun administrator), med revisjonslogg.
export async function DELETE(_req: NextRequest, context: { params: Promise<{ submissionId: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Ikke autorisert" }, { status: 403 });
    }
    const { submissionId } = await context.params;
    const s = await db.submission.findUnique({ where: { id: submissionId }, select: { id: true, organizationId: true, formId: true } });
    if (!s) return NextResponse.json({ error: "Lead ikke funnet" }, { status: 404 });
    await db.$transaction([
      db.submission.delete({ where: { id: submissionId } }),
      db.activityLog.create({ data: { userId: session.user.id, action: "lead.deleted", resource: "submission", resourceId: submissionId, details: { organizationId: s.organizationId, formId: s.formId } } }),
    ]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting lead:", error);
    return NextResponse.json({ error: "Kunne ikke slette lead" }, { status: 500 });
  }
}
