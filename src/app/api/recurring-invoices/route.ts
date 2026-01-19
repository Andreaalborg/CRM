import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/recurring-invoices - Hent alle gjentakende fakturaer
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Ikke autorisert" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email! }
    });

    if (!user || user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Ikke autorisert" }, { status: 403 });
    }

    const recurringInvoices = await db.recurringInvoice.findMany({
      orderBy: { nextInvoiceDate: "asc" },
      include: {
        _count: {
          select: { generatedInvoices: true }
        }
      }
    });

    return NextResponse.json(recurringInvoices);
  } catch (error) {
    console.error("Error fetching recurring invoices:", error);
    return NextResponse.json(
      { error: "Kunne ikke hente gjentakende fakturaer" },
      { status: 500 }
    );
  }
}

// POST /api/recurring-invoices - Opprett ny gjentakende faktura
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
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
    const {
      organizationId,
      name,
      customerName,
      customerEmail,
      customerAddress,
      customerCity,
      customerPostalCode,
      customerCountry,
      customerOrgNumber,
      interval,
      intervalCount = 1,
      startDate,
      endDate,
      items,
      vatRate = 25,
      paymentDueDays = 14,
      bankAccount,
      paymentTerms,
      notes,
    } = body;

    // Valider påkrevde felt
    if (!organizationId || !name || !customerName || !customerEmail || !interval || !startDate || !items?.length) {
      return NextResponse.json(
        { error: "Mangler påkrevde felt" },
        { status: 400 }
      );
    }

    // Beregn beløp
    let subtotal = 0;
    for (const item of items) {
      subtotal += (item.quantity || 1) * item.unitPrice;
    }
    const vatAmount = subtotal * (vatRate / 100);
    const total = subtotal + vatAmount;

    // Opprett gjentakende faktura
    const recurringInvoice = await db.recurringInvoice.create({
      data: {
        organizationId,
        name,
        customerName,
        customerEmail,
        customerAddress,
        customerCity,
        customerPostalCode,
        customerCountry: customerCountry || "Norge",
        customerOrgNumber,
        interval,
        intervalCount,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        nextInvoiceDate: new Date(startDate),
        items: items as any,
        subtotal,
        vatRate,
        vatAmount,
        total,
        paymentDueDays,
        bankAccount,
        paymentTerms,
        notes,
        status: "ACTIVE",
      }
    });

    return NextResponse.json(recurringInvoice, { status: 201 });
  } catch (error) {
    console.error("Error creating recurring invoice:", error);
    return NextResponse.json(
      { error: "Kunne ikke opprette gjentakende faktura" },
      { status: 500 }
    );
  }
}


