import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/invoices/[invoiceId] - Hent en faktura
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { invoiceId } = await params;
    
    if (!session?.user) {
      return NextResponse.json({ error: "Ikke autorisert" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email! }
    });

    if (!user) {
      return NextResponse.json({ error: "Bruker ikke funnet" }, { status: 404 });
    }

    const invoice = await db.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        items: { orderBy: { order: "asc" } },
        payments: { orderBy: { paidAt: "desc" } },
        organization: true,
        emailLogs: { orderBy: { sentAt: "desc" } }
      }
    });

    if (!invoice) {
      return NextResponse.json({ error: "Faktura ikke funnet" }, { status: 404 });
    }

    // Sjekk tilgang
    if (user.role !== "SUPER_ADMIN" && user.organizationId !== invoice.organizationId) {
      return NextResponse.json({ error: "Ikke autorisert" }, { status: 403 });
    }

    return NextResponse.json({ invoice });
  } catch (error) {
    console.error("Error fetching invoice:", error);
    return NextResponse.json(
      { error: "Kunne ikke hente faktura" },
      { status: 500 }
    );
  }
}

// PATCH /api/invoices/[invoiceId] - Oppdater faktura
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { invoiceId } = await params;
    
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
    const { status, notes, internalNotes, items, ...updateData } = body;

    // Hvis items er inkludert, oppdater dem
    if (items) {
      // Slett eksisterende items
      await db.invoiceItem.deleteMany({
        where: { invoiceId }
      });

      // Beregn nye beløp
      let subtotal = 0;
      const processedItems = items.map((item: any, index: number) => {
        const amount = item.quantity * item.unitPrice;
        subtotal += amount;
        return {
          invoiceId,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          amount,
          unit: item.unit || "stk",
          order: index
        };
      });

      const vatRate = updateData.vatRate || 25;
      const vatAmount = subtotal * (vatRate / 100);
      const total = subtotal + vatAmount;

      // Opprett nye items
      await db.invoiceItem.createMany({
        data: processedItems
      });

      updateData.subtotal = subtotal;
      updateData.vatAmount = vatAmount;
      updateData.total = total;
    }

    const invoice = await db.invoice.update({
      where: { id: invoiceId },
      data: {
        ...updateData,
        status,
        notes,
        internalNotes,
      },
      include: {
        items: { orderBy: { order: "asc" } },
        payments: true,
        organization: true
      }
    });

    return NextResponse.json({ invoice });
  } catch (error) {
    console.error("Error updating invoice:", error);
    return NextResponse.json(
      { error: "Kunne ikke oppdatere faktura" },
      { status: 500 }
    );
  }
}

// DELETE /api/invoices/[invoiceId] - Slett faktura
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { invoiceId } = await params;
    
    if (!session?.user) {
      return NextResponse.json({ error: "Ikke autorisert" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email! }
    });

    if (!user || user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Ikke autorisert" }, { status: 403 });
    }

    await db.invoice.delete({
      where: { id: invoiceId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting invoice:", error);
    return NextResponse.json(
      { error: "Kunne ikke slette faktura" },
      { status: 500 }
    );
  }
}






