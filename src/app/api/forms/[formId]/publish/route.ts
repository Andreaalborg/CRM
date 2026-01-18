import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// POST /api/forms/[formId]/publish - Toggle publiser/avpubliser skjema
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) {
  try {
    const { formId } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Ikke autorisert" }, { status: 401 });
    }

    const body = await req.json();
    const shouldPublish = body.published;

    // Sjekk at skjema tilhører organisasjonen
    const form = await db.form.findFirst({
      where: {
        id: formId,
        organizationId: session.user.organizationId,
      },
      include: {
        fields: true,
      },
    });

    if (!form) {
      return NextResponse.json({ error: "Skjema ikke funnet" }, { status: 404 });
    }

    // Hvis vi skal publisere, sjekk at skjemaet har minst ett felt
    if (shouldPublish && form.fields.length === 0) {
      return NextResponse.json(
        { error: "Skjemaet må ha minst ett felt før det kan publiseres" },
        { status: 400 }
      );
    }

    // Oppdater skjema-status
    const updatedForm = await db.form.update({
      where: { id: formId },
      data: {
        status: shouldPublish ? "PUBLISHED" : "DRAFT",
        publishedAt: shouldPublish ? new Date() : null,
      },
    });

    // Logg aktivitet
    await db.activityLog.create({
      data: {
        userId: session.user.id,
        action: shouldPublish ? "form.published" : "form.unpublished",
        resource: "form",
        resourceId: formId,
        details: { name: form.name },
      },
    });

    return NextResponse.json(updatedForm);
  } catch (error) {
    console.error("Error toggling form publish status:", error);
    return NextResponse.json({ error: "Kunne ikke oppdatere skjema-status" }, { status: 500 });
  }
}
