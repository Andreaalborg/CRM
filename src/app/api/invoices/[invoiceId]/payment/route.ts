import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Decimal } from "@prisma/client/runtime/library";

// POST /api/invoices/[invoiceId]/payment - Registrer betaling
export async function POST(
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
    const { amount, method, reference, note } = body;

    // Hent fakturaen
    const invoice = await db.invoice.findUnique({
      where: { id: invoiceId }
    });

    if (!invoice) {
      return NextResponse.json({ error: "Faktura ikke funnet" }, { status: 404 });
    }

    // Registrer betalingen
    const payment = await db.invoicePayment.create({
      data: {
        invoiceId,
        amount,
        method,
        reference,
        note,
        paidAt: new Date()
      }
    });

    // Oppdater totalt betalt beløp
    const newPaidAmount = new Decimal(invoice.paidAmount).plus(amount);
    const total = new Decimal(invoice.total);
    
    // Bestem ny status
    let newStatus = invoice.status;
    if (newPaidAmount.gte(total)) {
      newStatus = "PAID";
    } else if (newPaidAmount.gt(0)) {
      newStatus = "PARTIALLY_PAID";
    }

    // Oppdater fakturaen
    await db.invoice.update({
      where: { id: invoiceId },
      data: {
        paidAmount: newPaidAmount,
        status: newStatus,
        paidAt: newStatus === "PAID" ? new Date() : null
      }
    });

    return NextResponse.json({ payment, newStatus });
  } catch (error) {
    console.error("Error registering payment:", error);
    return NextResponse.json(
      { error: "Kunne ikke registrere betaling" },
      { status: 500 }
    );
  }
}

