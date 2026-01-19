import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

interface RouteContext {
  params: Promise<{ submissionId: string }>;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Ikke autorisert" }, { status: 401 });
    }

    const { submissionId } = await context.params;
    const body = await request.json();
    const { status } = body;

    const validStatuses = ["NEW", "CONTACTED", "QUALIFIED", "CONVERTED", "LOST", "SPAM"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Ugyldig status" }, { status: 400 });
    }

    // Sjekk at submission tilhører brukerens organisasjon
    const submission = await db.submission.findFirst({
      where: {
        id: submissionId,
        organizationId: session.user.organizationId,
      },
    });

    if (!submission) {
      return NextResponse.json({ error: "Lead ikke funnet" }, { status: 404 });
    }

    // Oppdater status
    const updated = await db.submission.update({
      where: { id: submissionId },
      data: { status },
    });

    // Logg aktivitet
    await db.activityLog.create({
      data: {
        userId: session.user.id,
        action: "lead.status_updated",
        resource: "submission",
        resourceId: submissionId,
        details: {
          oldStatus: submission.status,
          newStatus: status,
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating lead status:", error);
    return NextResponse.json(
      { error: "Kunne ikke oppdatere status" },
      { status: 500 }
    );
  }
}



