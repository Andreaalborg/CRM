import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { createFormSchema } from "@/lib/validations";
import { slugify } from "@/lib/utils";

// GET /api/forms - Hent alle skjemaer for organisasjonen
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Ikke autorisert" }, { status: 401 });
    }

    const forms = await db.form.findMany({
      where: { organizationId: session.user.organizationId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { submissions: true },
        },
        fields: {
          orderBy: { order: "asc" },
        },
      },
    });

    return NextResponse.json(forms);
  } catch (error) {
    console.error("Error fetching forms:", error);
    return NextResponse.json({ error: "Kunne ikke hente skjemaer" }, { status: 500 });
  }
}

// POST /api/forms - Opprett nytt skjema
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Ikke autorisert" }, { status: 401 });
    }

    const body = await req.json();
    
    // Valider input
    const validationResult = createFormSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, description, submitButtonText, successMessage, redirectUrl, fields } = validationResult.data;

    // Generer unik slug
    const baseSlug = slugify(name);
    let slug = baseSlug;
    let counter = 1;
    
    while (
      await db.form.findFirst({
        where: { organizationId: session.user.organizationId, slug },
      })
    ) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Opprett skjema
    const form = await db.form.create({
      data: {
        name,
        slug,
        description,
        submitButtonText: submitButtonText || "Send inn",
        successMessage: successMessage || "Takk for din henvendelse!",
        redirectUrl: redirectUrl || null,
        organizationId: session.user.organizationId,
        fields: fields
          ? {
              create: fields.map((field, index) => ({
                ...field,
                order: index,
              })),
            }
          : undefined,
      },
      include: {
        fields: true,
      },
    });

    // Logg aktivitet
    await db.activityLog.create({
      data: {
        userId: session.user.id,
        action: "form.created",
        resource: "form",
        resourceId: form.id,
        details: { name: form.name },
      },
    });

    return NextResponse.json(form, { status: 201 });
  } catch (error) {
    console.error("Error creating form:", error);
    return NextResponse.json({ error: "Kunne ikke opprette skjema" }, { status: 500 });
  }
}

