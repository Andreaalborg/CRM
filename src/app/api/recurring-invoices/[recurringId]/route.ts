import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// GET - Hent en gjentakende faktura
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ recurringId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { recurringId } = await params;
    
    if (!session?.user) {
      return NextResponse.json({ error: "Ikke autorisert" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email! }
    });

    if (!user || user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Ikke autorisert" }, { status: 403 });
    }

    const recurringInvoice = await db.recurringInvoice.findUnique({
      where: { id: recurringId },
      include: {
        generatedInvoices: {
          orderBy: { generatedAt: "desc" },
          take: 10
        }
      }
    });

    if (!recurringInvoice) {
      return NextResponse.json({ error: "Ikke funnet" }, { status: 404 });
    }

    return NextResponse.json(recurringInvoice);
  } catch (error) {
    console.error("Error fetching recurring invoice:", error);
    return NextResponse.json(
      { error: "Kunne ikke hente gjentakende faktura" },
      { status: 500 }
    );
  }
}

// PATCH - Oppdater gjentakende faktura
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ recurringId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { recurringId } = await params;
    
    if (!session?.user) {
      return NextResponse.json({ error: "Ikke autorisert" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email! }
    });

    if (!user || user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Ikke autorisert" }, { status: 403 });
    }

    const body = await request.json();

    // Hvis items oppdateres, beregn nye beløp
    if (body.items) {
      const vatRate = body.vatRate || 25;
      let subtotal = 0;
      for (const item of body.items) {
        subtotal += (item.quantity || 1) * item.unitPrice;
      }
      body.subtotal = subtotal;
      body.vatAmount = subtotal * (vatRate / 100);
      body.total = subtotal + body.vatAmount;
    }

    const recurringInvoice = await db.recurringInvoice.update({
      where: { id: recurringId },
      data: body
    });

    return NextResponse.json(recurringInvoice);
  } catch (error) {
    console.error("Error updating recurring invoice:", error);
    return NextResponse.json(
      { error: "Kunne ikke oppdatere gjentakende faktura" },
      { status: 500 }
    );
  }
}

// DELETE - Slett gjentakende faktura
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ recurringId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { recurringId } = await params;
    
    if (!session?.user) {
      return NextResponse.json({ error: "Ikke autorisert" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email! }
    });

    if (!user || user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Ikke autorisert" }, { status: 403 });
    }

    await db.recurringInvoice.delete({
      where: { id: recurringId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting recurring invoice:", error);
    return NextResponse.json(
      { error: "Kunne ikke slette gjentakende faktura" },
      { status: 500 }
    );
  }
}

