import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { runAutomationsForSubmission } from "@/lib/automations";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) {
  try {
    const { formId } = await params;
    const body = await req.json();
    const headersList = await headers();

    // Finn skjemaet
    const form = await db.form.findUnique({
      where: { id: formId },
      include: {
        fields: true,
        organization: true,
      },
    });

    if (!form) {
      return NextResponse.json(
        { error: "Skjema ikke funnet" },
        { status: 404 }
      );
    }

    if (form.status !== "PUBLISHED") {
      return NextResponse.json(
        { error: "Skjema er ikke publisert" },
        { status: 400 }
      );
    }

    // Valider påkrevde felt
    const errors: Record<string, string> = {};
    for (const field of form.fields) {
      if (field.required) {
        const value = body[field.name];
        if (value === undefined || value === null || value === "") {
          errors[field.name] = `${field.label} er påkrevd`;
        }
      }

      // E-post validering
      if (field.type === "EMAIL" && body[field.name]) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(body[field.name])) {
          errors[field.name] = "Ugyldig e-postadresse";
        }
      }

      // Telefon validering (norsk format)
      if (field.type === "PHONE" && body[field.name]) {
        const cleaned = body[field.name].replace(/\s/g, "");
        const phoneRegex = /^(\+47)?[2-9]\d{7}$/;
        if (!phoneRegex.test(cleaned)) {
          errors[field.name] = "Ugyldig telefonnummer";
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    // Hent metadata
    const ipAddress = headersList.get("x-forwarded-for") || 
                      headersList.get("x-real-ip") || 
                      "unknown";
    const userAgent = headersList.get("user-agent") || "unknown";
    const referrer = headersList.get("referer") || undefined;

    // Lagre innsending
    const submission = await db.submission.create({
      data: {
        formId: form.id,
        organizationId: form.organizationId,
        data: body,
        ipAddress,
        userAgent,
        referrer,
      },
    });

    // Logg aktivitet
    await db.activityLog.create({
      data: {
        action: "submission.created",
        resource: "submission",
        resourceId: submission.id,
        details: {
          formId: form.id,
          formName: form.name,
        },
        ipAddress,
        userAgent,
      },
    });

    // Kjør automasjoner (e-post triggere osv.) i bakgrunnen
    runAutomationsForSubmission({
      id: submission.id,
      formId: form.id,
      organizationId: form.organizationId,
      data: body,
    }).catch((error) => {
      console.error("Error running automations:", error);
    });

    return NextResponse.json({
      success: true,
      message: form.successMessage,
      redirectUrl: form.redirectUrl,
    });
  } catch (error) {
    console.error("Submission error:", error);
    return NextResponse.json(
      { error: "Noe gikk galt. Prøv igjen senere." },
      { status: 500 }
    );
  }
}

