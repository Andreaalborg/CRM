import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Beregn neste fakturadato basert på intervall
function calculateNextDate(currentDate: Date, interval: string, intervalCount: number): Date {
  const next = new Date(currentDate);
  
  switch (interval) {
    case "WEEKLY":
      next.setDate(next.getDate() + (7 * intervalCount));
      break;
    case "BIWEEKLY":
      next.setDate(next.getDate() + (14 * intervalCount));
      break;
    case "MONTHLY":
      next.setMonth(next.getMonth() + intervalCount);
      break;
    case "QUARTERLY":
      next.setMonth(next.getMonth() + (3 * intervalCount));
      break;
    case "BIANNUALLY":
      next.setMonth(next.getMonth() + (6 * intervalCount));
      break;
    case "YEARLY":
      next.setFullYear(next.getFullYear() + intervalCount);
      break;
  }
  
  return next;
}

// Generer fakturanummer
async function generateInvoiceNumber(organizationId: string): Promise<string> {
  const year = new Date().getFullYear();
  
  const lastInvoice = await db.invoice.findFirst({
    where: {
      organizationId,
      invoiceNumber: { startsWith: `${year}-` }
    },
    orderBy: { invoiceNumber: "desc" }
  });
  
  let nextNumber = 1;
  if (lastInvoice) {
    const parts = lastInvoice.invoiceNumber.split("-");
    nextNumber = parseInt(parts[1] || "0") + 1;
  }
  
  return `${year}-${String(nextNumber).padStart(4, "0")}`;
}

// POST /api/cron/process-recurring-invoices - Prosesser gjentakende fakturaer
export async function POST(request: NextRequest) {
  try {
    // Verifiser cron-token
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Ikke autorisert" }, { status: 401 });
    }

    const now = new Date();
    
    // Finn alle aktive gjentakende fakturaer som skal genereres
    const dueRecurring = await db.recurringInvoice.findMany({
      where: {
        status: "ACTIVE",
        nextInvoiceDate: { lte: now },
        OR: [
          { endDate: null },
          { endDate: { gte: now } }
        ]
      }
    });

    console.log(`Fant ${dueRecurring.length} gjentakende fakturaer å prosessere`);

    const results: Array<{
      recurringId: string;
      invoiceId?: string;
      invoiceNumber?: string;
      success: boolean;
      error?: string;
    }> = [];

    for (const recurring of dueRecurring) {
      try {
        // Generer fakturanummer
        const invoiceNumber = await generateInvoiceNumber(recurring.organizationId);
        
        // Beregn forfallsdato
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + recurring.paymentDueDays);
        
        // Parse items fra JSON
        const items = recurring.items as Array<{
          description: string;
          quantity: number;
          unitPrice: number;
          unit?: string;
        }>;

        // Opprett faktura
        const invoice = await db.invoice.create({
          data: {
            organizationId: recurring.organizationId,
            invoiceNumber,
            customerName: recurring.customerName,
            customerEmail: recurring.customerEmail,
            customerAddress: recurring.customerAddress,
            customerCity: recurring.customerCity,
            customerPostalCode: recurring.customerPostalCode,
            customerCountry: recurring.customerCountry,
            customerOrgNumber: recurring.customerOrgNumber,
            issueDate: now,
            dueDate,
            subtotal: recurring.subtotal,
            vatRate: recurring.vatRate,
            vatAmount: recurring.vatAmount,
            total: recurring.total,
            status: "DRAFT",
            bankAccount: recurring.bankAccount,
            paymentTerms: recurring.paymentTerms,
            notes: recurring.notes,
            items: {
              create: items.map((item, index) => ({
                description: item.description,
                quantity: item.quantity || 1,
                unitPrice: item.unitPrice,
                amount: (item.quantity || 1) * item.unitPrice,
                unit: item.unit || "stk",
                order: index
              }))
            }
          }
        });

        // Logg genereringen
        await db.recurringInvoiceLog.create({
          data: {
            recurringInvoiceId: recurring.id,
            invoiceId: invoice.id
          }
        });

        // Oppdater gjentakende faktura
        const nextDate = calculateNextDate(
          new Date(recurring.nextInvoiceDate),
          recurring.interval,
          recurring.intervalCount
        );
        
        // Sjekk om vi har nådd sluttdato
        let newStatus = recurring.status;
        if (recurring.endDate && nextDate > new Date(recurring.endDate)) {
          newStatus = "CANCELLED";
        }

        await db.recurringInvoice.update({
          where: { id: recurring.id },
          data: {
            lastInvoiceDate: now,
            nextInvoiceDate: nextDate,
            invoicesGenerated: { increment: 1 },
            totalRevenue: { increment: Number(recurring.total) },
            status: newStatus
          }
        });

        results.push({
          recurringId: recurring.id,
          invoiceId: invoice.id,
          invoiceNumber,
          success: true
        });

        console.log(`Genererte faktura ${invoiceNumber} fra ${recurring.name}`);
      } catch (error) {
        console.error(`Feil ved generering av faktura for ${recurring.id}:`, error);
        results.push({
          recurringId: recurring.id,
          success: false,
          error: error instanceof Error ? error.message : "Ukjent feil"
        });
      }
    }

    return NextResponse.json({
      processed: dueRecurring.length,
      results
    });
  } catch (error) {
    console.error("Error processing recurring invoices:", error);
    return NextResponse.json(
      { error: "Kunne ikke prosessere gjentakende fakturaer" },
      { status: 500 }
    );
  }
}

// GET - Samme som POST for testing
export async function GET(request: NextRequest) {
  return POST(request);
}


