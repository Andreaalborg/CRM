import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/invoices - Hent alle fakturaer
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Ikke autorisert" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const organizationId = searchParams.get("organizationId");

    // Admin kan se alle, kunder ser kun sine egne
    const user = await db.user.findUnique({
      where: { email: session.user.email! },
      include: { organization: true }
    });

    if (!user) {
      return NextResponse.json({ error: "Bruker ikke funnet" }, { status: 404 });
    }

    const whereClause: any = {};
    
    if (user.role === "SUPER_ADMIN") {
      if (organizationId) {
        whereClause.organizationId = organizationId;
      }
    } else if (user.organizationId) {
      whereClause.organizationId = user.organizationId;
    } else {
      return NextResponse.json({ invoices: [] });
    }

    if (status) {
      whereClause.status = status;
    }

    const invoices = await db.invoice.findMany({
      where: whereClause,
      include: {
        items: true,
        payments: true,
        organization: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ invoices });
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return NextResponse.json(
      { error: "Kunne ikke hente fakturaer" },
      { status: 500 }
    );
  }
}

// POST /api/invoices - Opprett ny faktura
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
      customerName,
      customerEmail,
      customerAddress,
      customerCity,
      customerPostalCode,
      customerCountry,
      customerOrgNumber,
      dueDate,
      items,
      notes,
      reference,
      bankAccount,
      paymentTerms,
      vatRate = 25,
    } = body;

    // Generer fakturanummer
    const year = new Date().getFullYear();
    const lastInvoice = await db.invoice.findFirst({
      where: {
        organizationId,
        invoiceNumber: { startsWith: `${year}-` }
      },
      orderBy: { invoiceNumber: "desc" }
    });

    let invoiceNumber: string;
    if (lastInvoice) {
      const lastNumber = parseInt(lastInvoice.invoiceNumber.split("-")[1]);
      invoiceNumber = `${year}-${String(lastNumber + 1).padStart(4, "0")}`;
    } else {
      invoiceNumber = `${year}-0001`;
    }

    // Beregn beløp
    let subtotal = 0;
    const processedItems = items.map((item: any, index: number) => {
      const amount = item.quantity * item.unitPrice;
      subtotal += amount;
      return {
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        amount,
        unit: item.unit || "stk",
        order: index
      };
    });

    const vatAmount = subtotal * (vatRate / 100);
    const total = subtotal + vatAmount;

    const invoice = await db.invoice.create({
      data: {
        organizationId,
        invoiceNumber,
        customerName,
        customerEmail,
        customerAddress,
        customerCity,
        customerPostalCode,
        customerCountry: customerCountry || "Norge",
        customerOrgNumber,
        issueDate: new Date(),
        dueDate: new Date(dueDate),
        subtotal,
        vatRate,
        vatAmount,
        total,
        notes,
        reference,
        bankAccount,
        paymentTerms: paymentTerms || "Betalingsfrist: 14 dager",
        items: {
          create: processedItems
        }
      },
      include: {
        items: true,
        organization: true
      }
    });

    return NextResponse.json({ invoice }, { status: 201 });
  } catch (error) {
    console.error("Error creating invoice:", error);
    return NextResponse.json(
      { error: "Kunne ikke opprette faktura" },
      { status: 500 }
    );
  }
}


