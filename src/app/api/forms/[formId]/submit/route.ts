import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { runAutomationsForSubmission } from "@/lib/automations";
import { notifyNewSubmission } from "@/lib/portal/notify";
import { rateLimit } from "@/lib/rate-limit";

const HONEYPOT_FIELD = "_hp_website";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) {
  try {
    const { formId } = await params;
    const headersList = await headers();
    const clientIp =
      (headersList.get("x-forwarded-for") || "").split(",")[0].trim() ||
      headersList.get("x-real-ip") ||
      "unknown";

    // Rate-limit før noe databasekall: maks 5 per minutt per IP og skjema
    if (!rateLimit(`submit:${clientIp}:${formId}`, 5, 60_000)) {
      return NextResponse.json(
        { error: "For mange innsendinger. Prøv igjen om litt." },
        { status: 429 }
      );
    }

    const body = await req.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Ugyldig data" }, { status: 400 });
    }

    // Honeypot: skjult felt som bare roboter fyller ut. Late som det gikk bra.
    if (typeof body[HONEYPOT_FIELD] === "string" && body[HONEYPOT_FIELD].trim() !== "") {
      return NextResponse.json({ success: true, message: "Takk for din henvendelse!" });
    }
    delete body[HONEYPOT_FIELD];

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

    // Fase 4: varsel kun til kundens egne brukere som har slått det på (sperret til Resend er verifisert)
    await notifyNewSubmission({ id: submission.id, organizationId: form.organizationId, formName: form.name, data: body })
      .catch((e) => console.error("Varsel feilet:", e));

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

