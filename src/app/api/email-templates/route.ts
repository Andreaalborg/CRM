import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { createEmailTemplateSchema } from "@/lib/validations";

// GET /api/email-templates - Hent alle e-postmaler
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Ikke autorisert" }, { status: 401 });
    }

    const templates = await db.emailTemplate.findMany({
      where: { organizationId: session.user.organizationId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(templates);
  } catch (error) {
    console.error("Error fetching email templates:", error);
    return NextResponse.json({ error: "Kunne ikke hente e-postmaler" }, { status: 500 });
  }
}

// POST /api/email-templates - Opprett ny e-postmal
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Ikke autorisert" }, { status: 401 });
    }

    const body = await req.json();
    
    // Valider input
    const validationResult = createEmailTemplateSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, subject, htmlContent, textContent, variables } = validationResult.data;

    // Opprett e-postmal
    const template = await db.emailTemplate.create({
      data: {
        name,
        subject,
        htmlContent,
        textContent,
        variables: variables || [],
        organizationId: session.user.organizationId,
      },
    });

    // Logg aktivitet
    await db.activityLog.create({
      data: {
        userId: session.user.id,
        action: "email_template.created",
        resource: "email_template",
        resourceId: template.id,
        details: { name: template.name },
      },
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error("Error creating email template:", error);
    return NextResponse.json({ error: "Kunne ikke opprette e-postmal" }, { status: 500 });
  }
}

