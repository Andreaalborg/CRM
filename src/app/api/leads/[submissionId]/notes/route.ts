import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

interface RouteContext {
  params: Promise<{ submissionId: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Ikke autorisert" }, { status: 401 });
    }

    const { submissionId } = await context.params;

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

    // Hent notater fra metadata
    const notes = (submission.metadata as { notes?: Array<{ id: string; content: string; createdAt: string }> })?.notes || [];

    return NextResponse.json(notes);
  } catch (error) {
    console.error("Error fetching notes:", error);
    return NextResponse.json(
      { error: "Kunne ikke hente notater" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Ikke autorisert" }, { status: 401 });
    }

    const { submissionId } = await context.params;
    const body = await request.json();
    const { content } = body;

    if (!content?.trim()) {
      return NextResponse.json({ error: "Notat kan ikke være tomt" }, { status: 400 });
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

    // Lag nytt notat
    const newNote = {
      id: crypto.randomUUID(),
      content: content.trim(),
      createdAt: new Date().toISOString(),
      userId: session.user.id,
      userName: session.user.name || "Ukjent",
    };

    // Legg til i metadata
    const currentMetadata = (submission.metadata as Record<string, unknown>) || {};
    const currentNotes = (currentMetadata.notes as Array<typeof newNote>) || [];

    await db.submission.update({
      where: { id: submissionId },
      data: {
        metadata: {
          ...currentMetadata,
          notes: [newNote, ...currentNotes],
        },
      },
    });

    // Logg aktivitet
    await db.activityLog.create({
      data: {
        userId: session.user.id,
        action: "lead.note_added",
        resource: "submission",
        resourceId: submissionId,
        details: {
          noteId: newNote.id,
        },
      },
    });

    return NextResponse.json(newNote);
  } catch (error) {
    console.error("Error adding note:", error);
    return NextResponse.json(
      { error: "Kunne ikke legge til notat" },
      { status: 500 }
    );
  }
}



