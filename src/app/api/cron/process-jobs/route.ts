import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendEmail, replaceVariables } from "@/lib/email";

// Denne ruten kjøres via cron job for å prosessere planlagte jobber
// Vercel cron: vercel.json -> { "crons": [{ "path": "/api/cron/process-jobs", "schedule": "*/5 * * * *" }] }

export async function GET(request: NextRequest) {
  // Verifiser at forespørselen kommer fra Vercel Cron eller har riktig auth
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    
    // Hent alle ventende jobber som skal kjøres
    const pendingJobs = await db.scheduledJob.findMany({
      where: {
        status: "PENDING",
        scheduledFor: {
          lte: now,
        },
      },
      include: {
        automation: {
          include: {
            actions: {
              orderBy: { order: "asc" },
              include: {
                emailTemplate: true,
              },
            },
          },
        },
      },
      take: 100, // Prosesser maks 100 jobber per kjøring
    });

    console.log(`Processing ${pendingJobs.length} scheduled jobs`);

    const results = {
      processed: 0,
      succeeded: 0,
      failed: 0,
    };

    for (const job of pendingJobs) {
      try {
        // Marker jobben som under behandling
        await db.scheduledJob.update({
          where: { id: job.id },
          data: { status: "PROCESSING" },
        });

        // Kjør aksjonen
        const action = job.automation.actions[job.actionIndex];
        if (action) {
          await executeScheduledAction(action, job);
        }

        // Marker som fullført
        await db.scheduledJob.update({
          where: { id: job.id },
          data: {
            status: "COMPLETED",
            executedAt: new Date(),
          },
        });

        // Hvis det er en gjentakende jobb, opprett neste kjøring
        if (job.isRecurring && job.recurringPattern) {
          const nextRun = calculateNextRun(job.recurringPattern, now);
          if (nextRun) {
            await db.scheduledJob.create({
              data: {
                automationId: job.automationId,
                submissionId: job.submissionId,
                actionIndex: job.actionIndex,
                scheduledFor: nextRun,
                isRecurring: true,
                recurringPattern: job.recurringPattern,
                payload: job.payload as any,
              },
            });
          }
        }

        results.succeeded++;
      } catch (error) {
        console.error(`Error processing job ${job.id}:`, error);
        
        await db.scheduledJob.update({
          where: { id: job.id },
          data: {
            status: "FAILED",
            errorMessage: error instanceof Error ? error.message : "Ukjent feil",
            executedAt: new Date(),
          },
        });

        results.failed++;
      }

      results.processed++;
    }

    // Prosesser inaktivitets-triggere
    await processInactivityTriggers();

    // Prosesser dato-baserte triggere
    await processDateFieldTriggers();

    return NextResponse.json({
      success: true,
      ...results,
    });
  } catch (error) {
    console.error("Error in cron job:", error);
    return NextResponse.json(
      { error: "Feil ved prosessering av jobber" },
      { status: 500 }
    );
  }
}

interface ActionWithTemplate {
  type: string;
  config: unknown;
  emailTemplate?: {
    id: string;
    subject: string;
    htmlContent: string;
    textContent: string | null;
  } | null;
}

interface JobWithPayload {
  id: string;
  submissionId: string | null;
  payload: unknown;
}

async function executeScheduledAction(
  action: ActionWithTemplate,
  job: JobWithPayload
): Promise<void> {
  const payload = job.payload as Record<string, unknown> || {};
  
  switch (action.type) {
    case "SEND_EMAIL": {
      if (!action.emailTemplate) {
        throw new Error("Ingen e-postmal funnet");
      }

      // Hent submission data hvis tilgjengelig
      let submissionData: Record<string, unknown> = {};
      if (job.submissionId) {
        const submission = await db.submission.findUnique({
          where: { id: job.submissionId },
        });
        if (submission) {
          submissionData = submission.data as Record<string, unknown>;
        }
      }

      const data = { ...submissionData, ...payload };
      const recipientEmail = (payload.recipientEmail as string) || (data.email as string) || (data.epost as string);
      
      if (!recipientEmail) {
        throw new Error("Ingen mottaker-e-post funnet");
      }

      const subject = replaceVariables(action.emailTemplate.subject, data);
      const htmlContent = replaceVariables(action.emailTemplate.htmlContent, data);
      const fromEmail = process.env.EMAIL_FROM || "noreply@example.com";

      await sendEmail({
        to: recipientEmail,
        subject,
        html: htmlContent,
        from: fromEmail,
      });

      // Logg e-post
      await db.emailLog.create({
        data: {
          submissionId: job.submissionId,
          to: recipientEmail,
          from: fromEmail,
          subject,
          status: "SENT",
          sentAt: new Date(),
        },
      });
      break;
    }

    case "UPDATE_SUBMISSION_STATUS": {
      if (job.submissionId) {
        const config = action.config as { newStatus?: string };
        const newStatus = config.newStatus;
        if (newStatus) {
          await db.submission.update({
            where: { id: job.submissionId },
            data: { 
              status: newStatus as "NEW" | "CONTACTED" | "QUALIFIED" | "CONVERTED" | "LOST" | "SPAM" 
            },
          });
        }
      }
      break;
    }

    case "SEND_NOTIFICATION": {
      const config = action.config as { notifyEmail?: string };
      const notifyEmail = config.notifyEmail;
      if (notifyEmail && job.submissionId) {
        const submission = await db.submission.findUnique({
          where: { id: job.submissionId },
          include: { form: { select: { name: true } } },
        });

        if (submission) {
          const data = submission.data as Record<string, unknown>;
          const dataHtml = Object.entries(data)
            .map(([key, value]) => `<p><strong>${key}:</strong> ${value}</p>`)
            .join("");

          await sendEmail({
            to: notifyEmail,
            subject: `Påminnelse: Lead fra ${submission.form.name}`,
            html: `
              <h2>Lead-påminnelse</h2>
              <p>Dette er en automatisk påminnelse om en lead.</p>
              <div style="background: #f8f9fa; padding: 16px; border-radius: 8px;">
                ${dataHtml}
              </div>
            `,
          });
        }
      }
      break;
    }
  }
}

function calculateNextRun(pattern: string, fromDate: Date): Date | null {
  const next = new Date(fromDate);
  
  switch (pattern) {
    case "daily":
      next.setDate(next.getDate() + 1);
      break;
    case "weekly":
      next.setDate(next.getDate() + 7);
      break;
    case "monthly":
      next.setMonth(next.getMonth() + 1);
      break;
    case "yearly":
      next.setFullYear(next.getFullYear() + 1);
      break;
    default:
      return null;
  }
  
  return next;
}

async function processInactivityTriggers(): Promise<void> {
  // Finn automasjoner med INACTIVITY trigger
  const inactivityAutomations = await db.automation.findMany({
    where: {
      status: "ACTIVE",
      triggerType: "INACTIVITY",
    },
    include: {
      actions: {
        orderBy: { order: "asc" },
        include: { emailTemplate: true },
      },
    },
  });

  for (const automation of inactivityAutomations) {
    const config = automation.triggerConfig as { inactiveDays?: number };
    const inactiveDays = config.inactiveDays || 7;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - inactiveDays);

    // Finn inaktive leads
    const inactiveLeads = await db.submission.findMany({
      where: {
        organizationId: automation.organizationId,
        formId: automation.formId || undefined,
        status: { in: ["NEW", "CONTACTED", "QUALIFIED"] },
        lastContactedAt: {
          lt: cutoffDate,
        },
        // Ikke allerede behandlet av denne automasjonen
        NOT: {
          metadata: {
            path: ["processedAutomations"],
            array_contains: [automation.id],
          },
        },
      },
    });

    for (const lead of inactiveLeads) {
      // Sjekk om det allerede finnes en planlagt jobb for denne leaden
      const existingJob = await db.scheduledJob.findFirst({
        where: {
          automationId: automation.id,
          submissionId: lead.id,
          status: "PENDING",
        },
      });

      if (!existingJob) {
        // Opprett planlagt jobb for første aksjon
        await db.scheduledJob.create({
          data: {
            automationId: automation.id,
            submissionId: lead.id,
            actionIndex: 0,
            scheduledFor: new Date(), // Kjør umiddelbart
          },
        });
      }
    }
  }
}

async function processDateFieldTriggers(): Promise<void> {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Finn automasjoner med DATE_FIELD trigger
  const dateFieldAutomations = await db.automation.findMany({
    where: {
      status: "ACTIVE",
      triggerType: "DATE_FIELD",
    },
    include: {
      actions: {
        orderBy: { order: "asc" },
        include: { emailTemplate: true },
      },
    },
  });

  for (const automation of dateFieldAutomations) {
    const config = automation.triggerConfig as { dateField?: string; daysOffset?: number };
    const dateField = config.dateField;
    const daysOffset = config.daysOffset || 0;

    if (!dateField) continue;

    // Beregn måldato
    const targetDate = new Date(today);
    targetDate.setDate(targetDate.getDate() - daysOffset);

    // Finn leads med matching dato
    const leads = await db.submission.findMany({
      where: {
        organizationId: automation.organizationId,
        formId: automation.formId || undefined,
      },
    });

    for (const lead of leads) {
      const data = lead.data as Record<string, unknown>;
      const fieldValue = data[dateField];

      if (fieldValue) {
        const fieldDate = new Date(fieldValue as string);
        const fieldDateOnly = new Date(fieldDate.getFullYear(), fieldDate.getMonth(), fieldDate.getDate());
        
        // Sjekk om datoen matcher (for årlige events, sjekk måned og dag)
        const isAnniversary = 
          fieldDateOnly.getMonth() === targetDate.getMonth() &&
          fieldDateOnly.getDate() === targetDate.getDate();

        if (isAnniversary) {
          // Sjekk om ikke allerede prosessert i år
          const metadata = lead.metadata as Record<string, unknown> || {};
          const processedYears = (metadata[`${automation.id}_years`] as number[]) || [];
          
          if (!processedYears.includes(now.getFullYear())) {
            // Opprett planlagt jobb
            await db.scheduledJob.create({
              data: {
                automationId: automation.id,
                submissionId: lead.id,
                actionIndex: 0,
                scheduledFor: new Date(),
              },
            });

            // Oppdater metadata
            await db.submission.update({
              where: { id: lead.id },
              data: {
                metadata: {
                  ...metadata,
                  [`${automation.id}_years`]: [...processedYears, now.getFullYear()],
                } as any,
              },
            });
          }
        }
      }
    }
  }
}

