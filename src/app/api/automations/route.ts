import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { createAutomationSchema } from "@/lib/validations";

// GET /api/automations - Hent alle automasjoner
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Ikke autorisert" }, { status: 401 });
    }

    const automations = await db.automation.findMany({
      where: { organizationId: session.user.organizationId },
      orderBy: { createdAt: "desc" },
      include: {
        form: {
          select: { id: true, name: true },
        },
        actions: {
          orderBy: { order: "asc" },
          include: {
            emailTemplate: {
              select: { id: true, name: true },
            },
          },
        },
        _count: {
          select: { actions: true },
        },
      },
    });

    return NextResponse.json(automations);
  } catch (error) {
    console.error("Error fetching automations:", error);
    return NextResponse.json({ error: "Kunne ikke hente automasjoner" }, { status: 500 });
  }
}

// POST /api/automations - Opprett ny automasjon
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Ikke autorisert" }, { status: 401 });
    }

    const body = await req.json();
    
    // Valider input
    const validationResult = createAutomationSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, description, formId, triggerType, triggerConfig, actions } = validationResult.data;

    // Opprett automasjon
    const automation = await db.automation.create({
      data: {
        name,
        description,
        formId: formId || null,
        triggerType,
        triggerConfig: (triggerConfig || {}) as any,
        organizationId: session.user.organizationId,
        status: "ACTIVE",
        actions: actions
          ? {
              create: actions.map((action, index) => ({
                type: action.type,
                config: (action.config || {}) as any,
                order: action.order ?? index,
                // Hent emailTemplateId fra action hvis det er en SEND_EMAIL handling
                emailTemplateId: action.type === "SEND_EMAIL" && action.emailTemplateId 
                  ? action.emailTemplateId 
                  : null,
              })),
            }
          : undefined,
      },
      include: {
        actions: {
          include: {
            emailTemplate: true,
          },
        },
        form: {
          select: { name: true },
        },
      },
    });

    // Logg aktivitet
    await db.activityLog.create({
      data: {
        userId: session.user.id,
        action: "automation.created",
        resource: "automation",
        resourceId: automation.id,
        details: { name: automation.name },
      },
    });

    return NextResponse.json(automation, { status: 201 });
  } catch (error) {
    console.error("Error creating automation:", error);
    return NextResponse.json({ error: "Kunne ikke opprette automasjon" }, { status: 500 });
  }
}
