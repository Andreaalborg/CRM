import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

interface RouteContext {
  params: Promise<{ customerId: string }>;
}

// GET - Hent kunde
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Ikke autorisert" }, { status: 401 });
    }

    const { customerId } = await context.params;

    const organization = await db.organization.findUnique({
      where: { id: customerId },
      include: {
        settings: true,
        users: true,
        _count: {
          select: { forms: true, submissions: true },
        },
      },
    });

    if (!organization) {
      return NextResponse.json({ error: "Kunde ikke funnet" }, { status: 404 });
    }

    return NextResponse.json(organization);
  } catch (error) {
    console.error("Error fetching customer:", error);
    return NextResponse.json({ error: "Kunne ikke hente kunde" }, { status: 500 });
  }
}

// PATCH - Oppdater kunde
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Ikke autorisert" }, { status: 401 });
    }

    const { customerId } = await context.params;
    const body = await request.json();

    const {
      name,
      website,
      description,
      primaryColor,
      secondaryColor,
      senderName,
      senderEmail,
      replyToEmail,
    } = body;

    // Oppdater organisasjon
    const organization = await db.organization.update({
      where: { id: customerId },
      data: {
        name,
        website: website || null,
        description: description || null,
      },
    });

    // Oppdater eller opprett innstillinger
    await db.organizationSettings.upsert({
      where: { organizationId: customerId },
      create: {
        organizationId: customerId,
        primaryColor: primaryColor || "#6366f1",
        secondaryColor: secondaryColor || "#8b5cf6",
        senderName: senderName || null,
        senderEmail: senderEmail || null,
        replyToEmail: replyToEmail || null,
      },
      update: {
        primaryColor: primaryColor || "#6366f1",
        secondaryColor: secondaryColor || "#8b5cf6",
        senderName: senderName || null,
        senderEmail: senderEmail || null,
        replyToEmail: replyToEmail || null,
      },
    });

    // Logg aktivitet
    await db.activityLog.create({
      data: {
        userId: session.user.id,
        action: "admin.customer_updated",
        resource: "organization",
        resourceId: customerId,
        details: { updatedFields: Object.keys(body) },
      },
    });

    return NextResponse.json(organization);
  } catch (error) {
    console.error("Error updating customer:", error);
    return NextResponse.json({ error: "Kunne ikke oppdatere kunde" }, { status: 500 });
  }
}

// DELETE - Slett kunde
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Ikke autorisert" }, { status: 401 });
    }

    const { customerId } = await context.params;

    // Slett organisasjon (kaskade sletter alt relatert)
    await db.organization.delete({
      where: { id: customerId },
    });

    // Logg aktivitet
    await db.activityLog.create({
      data: {
        userId: session.user.id,
        action: "admin.customer_deleted",
        resource: "organization",
        resourceId: customerId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting customer:", error);
    return NextResponse.json({ error: "Kunne ikke slette kunde" }, { status: 500 });
  }
}






