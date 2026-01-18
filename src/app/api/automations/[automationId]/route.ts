import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/automations/[automationId] - Hent en automasjon
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ automationId: string }> }
) {
  try {
    const { automationId } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Ikke autorisert" }, { status: 401 });
    }

    const automation = await db.automation.findFirst({
      where: {
        id: automationId,
        organizationId: session.user.organizationId,
      },
      include: {
        form: {
          select: { id: true, name: true, fields: true },
        },
        actions: {
          orderBy: { order: "asc" },
          include: {
            emailTemplate: true,
          },
        },
      },
    });

    if (!automation) {
      return NextResponse.json({ error: "Automasjon ikke funnet" }, { status: 404 });
    }

    return NextResponse.json(automation);
  } catch (error) {
    console.error("Error fetching automation:", error);
    return NextResponse.json({ error: "Kunne ikke hente automasjon" }, { status: 500 });
  }
}

// PATCH /api/automations/[automationId] - Oppdater automasjon
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ automationId: string }> }
) {
  try {
    const { automationId } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Ikke autorisert" }, { status: 401 });
    }

    // Sjekk at automasjonen tilhører organisasjonen
    const existing = await db.automation.findFirst({
      where: {
        id: automationId,
        organizationId: session.user.organizationId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Automasjon ikke funnet" }, { status: 404 });
    }

    const body = await req.json();
    const { status, name, description } = body;

    // Oppdater automasjon
    const automation = await db.automation.update({
      where: { id: automationId },
      data: {
        ...(status && { status }),
        ...(name && { name }),
        ...(description !== undefined && { description }),
      },
    });

    // Logg aktivitet
    await db.activityLog.create({
      data: {
        userId: session.user.id,
        action: status ? `automation.${status.toLowerCase()}` : "automation.updated",
        resource: "automation",
        resourceId: automationId,
        details: { name: automation.name, status },
      },
    });

    return NextResponse.json(automation);
  } catch (error) {
    console.error("Error updating automation:", error);
    return NextResponse.json({ error: "Kunne ikke oppdatere automasjon" }, { status: 500 });
  }
}

// DELETE /api/automations/[automationId] - Slett automasjon
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ automationId: string }> }
) {
  try {
    const { automationId } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Ikke autorisert" }, { status: 401 });
    }

    // Sjekk at automasjonen tilhører organisasjonen
    const automation = await db.automation.findFirst({
      where: {
        id: automationId,
        organizationId: session.user.organizationId,
      },
    });

    if (!automation) {
      return NextResponse.json({ error: "Automasjon ikke funnet" }, { status: 404 });
    }

    // Slett automasjon (kaskaderer til actions via Prisma)
    await db.automation.delete({
      where: { id: automationId },
    });

    // Logg aktivitet
    await db.activityLog.create({
      data: {
        userId: session.user.id,
        action: "automation.deleted",
        resource: "automation",
        resourceId: automationId,
        details: { name: automation.name },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting automation:", error);
    return NextResponse.json({ error: "Kunne ikke slette automasjon" }, { status: 500 });
  }
}

