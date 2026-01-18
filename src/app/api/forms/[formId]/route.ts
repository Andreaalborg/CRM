import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { updateFormSchema } from "@/lib/validations";

// GET /api/forms/[formId] - Hent ett skjema
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) {
  try {
    const { formId } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Ikke autorisert" }, { status: 401 });
    }

    const form = await db.form.findFirst({
      where: {
        id: formId,
        organizationId: session.user.organizationId,
      },
      include: {
        fields: {
          orderBy: { order: "asc" },
        },
        _count: {
          select: { submissions: true },
        },
      },
    });

    if (!form) {
      return NextResponse.json({ error: "Skjema ikke funnet" }, { status: 404 });
    }

    return NextResponse.json(form);
  } catch (error) {
    console.error("Error fetching form:", error);
    return NextResponse.json({ error: "Kunne ikke hente skjema" }, { status: 500 });
  }
}

// PATCH /api/forms/[formId] - Oppdater skjema
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) {
  try {
    const { formId } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Ikke autorisert" }, { status: 401 });
    }

    // Sjekk at skjema tilhører organisasjonen
    const existingForm = await db.form.findFirst({
      where: {
        id: formId,
        organizationId: session.user.organizationId,
      },
    });

    if (!existingForm) {
      return NextResponse.json({ error: "Skjema ikke funnet" }, { status: 404 });
    }

    const body = await req.json();
    
    // Valider input
    const validationResult = updateFormSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message },
        { status: 400 }
      );
    }

    const { fields, ...formData } = validationResult.data;

    // Oppdater skjemaet
    await db.form.update({
      where: { id: formId },
      data: formData,
    });

    // Hvis felt er inkludert, oppdater dem
    if (fields) {
      // Slett eksisterende felt
      await db.formField.deleteMany({
        where: { formId },
      });

      // Opprett nye felt
      await db.formField.createMany({
        data: fields.map((field, index) => ({
          ...field,
          formId,
          order: index,
        })),
      });
    }

    // Hent oppdatert skjema med felt
    const form = await db.form.findUnique({
      where: { id: formId },
      include: {
        fields: {
          orderBy: { order: "asc" },
        },
      },
    });

    // Logg aktivitet
    await db.activityLog.create({
      data: {
        userId: session.user.id,
        action: "form.updated",
        resource: "form",
        resourceId: formId,
        details: { name: form?.name },
      },
    });

    return NextResponse.json(form);
  } catch (error) {
    console.error("Error updating form:", error);
    return NextResponse.json({ error: "Kunne ikke oppdatere skjema" }, { status: 500 });
  }
}

// DELETE /api/forms/[formId] - Slett skjema
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) {
  try {
    const { formId } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Ikke autorisert" }, { status: 401 });
    }

    // Sjekk at skjema tilhører organisasjonen
    const form = await db.form.findFirst({
      where: {
        id: formId,
        organizationId: session.user.organizationId,
      },
    });

    if (!form) {
      return NextResponse.json({ error: "Skjema ikke funnet" }, { status: 404 });
    }

    // Slett skjema (kaskaderer til felt og innsendinger via Prisma)
    await db.form.delete({
      where: { id: formId },
    });

    // Logg aktivitet
    await db.activityLog.create({
      data: {
        userId: session.user.id,
        action: "form.deleted",
        resource: "form",
        resourceId: formId,
        details: { name: form.name },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting form:", error);
    return NextResponse.json({ error: "Kunne ikke slette skjema" }, { status: 500 });
  }
}
