import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: "invoice_due" | "invoice_overdue" | "recurring_invoice" | "scheduled_job" | "follow_up" | "automation";
  status: "pending" | "completed" | "overdue" | "cancelled";
  description?: string;
  amount?: number;
  link?: string;
  metadata?: Record<string, unknown>;
}

// GET /api/calendar/events - Hent alle kalenderhendelser
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Ikke autorisert" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email! }
    });

    if (!user) {
      return NextResponse.json({ error: "Bruker ikke funnet" }, { status: 404 });
    }

    // Hent query params for datofiltrering
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("start") ? new Date(searchParams.get("start")!) : new Date();
    const endDate = searchParams.get("end") ? new Date(searchParams.get("end")!) : new Date(new Date().setMonth(new Date().getMonth() + 3));

    const events: CalendarEvent[] = [];
    const now = new Date();

    // 1. Fakturaer med forfallsdato
    const invoices = await db.invoice.findMany({
      where: {
        dueDate: {
          gte: startDate,
          lte: endDate
        },
        status: { in: ["DRAFT", "SENT", "PARTIALLY_PAID", "OVERDUE"] }
      },
      include: { organization: true }
    });

    for (const invoice of invoices) {
      const isOverdue = new Date(invoice.dueDate) < now && invoice.status !== "PAID";
      events.push({
        id: `invoice-${invoice.id}`,
        title: `Faktura #${invoice.invoiceNumber} - ${invoice.customerName}`,
        date: invoice.dueDate.toISOString(),
        type: isOverdue ? "invoice_overdue" : "invoice_due",
        status: isOverdue ? "overdue" : "pending",
        description: `${invoice.organization.name}`,
        amount: Number(invoice.total),
        link: `/dashboard/invoices/${invoice.id}`,
        metadata: {
          invoiceNumber: invoice.invoiceNumber,
          customerEmail: invoice.customerEmail,
          remaining: Number(invoice.total) - Number(invoice.paidAmount)
        }
      });
    }

    // 2. Gjentakende fakturaer (neste generering)
    const recurringInvoices = await db.recurringInvoice.findMany({
      where: {
        status: "ACTIVE",
        nextInvoiceDate: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    for (const recurring of recurringInvoices) {
      events.push({
        id: `recurring-${recurring.id}`,
        title: `🔄 ${recurring.name} - ${recurring.customerName}`,
        date: recurring.nextInvoiceDate.toISOString(),
        type: "recurring_invoice",
        status: "pending",
        description: `Automatisk faktura genereres`,
        amount: Number(recurring.total),
        link: `/dashboard/invoices/recurring`,
        metadata: {
          interval: recurring.interval,
          customerEmail: recurring.customerEmail
        }
      });
    }

    // 3. Planlagte automasjonsjobber
    const scheduledJobs = await db.scheduledJob.findMany({
      where: {
        status: "PENDING",
        scheduledFor: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        automation: true
      }
    });

    for (const job of scheduledJobs) {
      events.push({
        id: `job-${job.id}`,
        title: `⚡ ${job.automation.name}`,
        date: job.scheduledFor.toISOString(),
        type: "scheduled_job",
        status: "pending",
        description: `Automasjon kjøres automatisk`,
        link: `/dashboard/automations`,
        metadata: {
          automationId: job.automationId,
          actionIndex: job.actionIndex
        }
      });
    }

    // 4. Leads med planlagt oppfølging
    const followUps = await db.submission.findMany({
      where: {
        nextFollowUpAt: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        form: true,
        organization: true
      }
    });

    for (const submission of followUps) {
      const data = submission.data as Record<string, unknown>;
      const name = (data.name as string) || (data.navn as string) || "Ukjent";
      const isOverdue = submission.nextFollowUpAt && new Date(submission.nextFollowUpAt) < now;
      
      events.push({
        id: `followup-${submission.id}`,
        title: `📞 Oppfølging: ${name}`,
        date: submission.nextFollowUpAt!.toISOString(),
        type: "follow_up",
        status: isOverdue ? "overdue" : "pending",
        description: `${submission.form.name} - ${submission.organization.name}`,
        link: `/dashboard/leads/${submission.id}`,
        metadata: {
          formName: submission.form.name,
          status: submission.status
        }
      });
    }

    // 5. Aktive automasjoner (for oversikt)
    if (user.role === "SUPER_ADMIN") {
      const automations = await db.automation.findMany({
        where: { status: "ACTIVE" },
        include: {
          _count: { select: { actions: true } },
          form: true
        }
      });

      // Legg til som "bakgrunns-info" for i dag
      for (const auto of automations) {
        events.push({
          id: `auto-${auto.id}`,
          title: `🤖 ${auto.name}`,
          date: now.toISOString(),
          type: "automation",
          status: "completed", // Aktiv = grønn
          description: `${auto._count.actions} handlinger • Kjørt ${auto.runCount} ganger`,
          link: `/dashboard/automations`,
          metadata: {
            triggerType: auto.triggerType,
            formName: auto.form?.name,
            lastRun: auto.lastRunAt
          }
        });
      }
    }

    // Sorter etter dato
    events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return NextResponse.json({ events });
  } catch (error) {
    console.error("Error fetching calendar events:", error);
    return NextResponse.json(
      { error: "Kunne ikke hente kalenderhendelser" },
      { status: 500 }
    );
  }
}

