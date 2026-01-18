import { db } from "./db";
import { sendEmail, replaceVariables } from "./email";
import { Prisma } from "@prisma/client";

interface SubmissionData {
  id: string;
  formId: string;
  organizationId: string;
  data: Record<string, unknown>;
}

interface AutomationAction {
  type: string;
  config: unknown;
  order: number;
}

/**
 * Kjør automasjoner for en ny skjemainnsending
 */
export async function runAutomationsForSubmission(
  submission: SubmissionData
): Promise<void> {
  try {
    // Finn alle aktive automasjoner for dette skjemaet
    const automations = await db.automation.findMany({
      where: {
        organizationId: submission.organizationId,
        status: "ACTIVE",
        OR: [
          { formId: submission.formId },
          { formId: null }, // Globale automasjoner
        ],
        triggerType: "FORM_SUBMISSION",
      },
      include: {
        actions: {
          orderBy: { order: "asc" },
          include: {
            emailTemplate: true,
          },
        },
      },
    });

    console.log(`Found ${automations.length} automations to run`);

    // Kjør hver automasjon
    for (const automation of automations) {
      try {
        await executeAutomation(automation, submission);
      } catch (error) {
        console.error(`Error running automation ${automation.id}:`, error);
        
        // Logg feilen
        await db.activityLog.create({
          data: {
            action: "automation.error",
            resource: "automation",
            resourceId: automation.id,
            details: {
              submissionId: submission.id,
              error: error instanceof Error ? error.message : "Ukjent feil",
            },
          },
        });
      }
    }
  } catch (error) {
    console.error("Error running automations:", error);
  }
}

interface ActionWithTemplate extends AutomationAction {
  emailTemplate?: {
    id: string;
    subject: string;
    htmlContent: string;
    textContent: string | null;
  } | null;
}

/**
 * Kjør en enkelt automasjon
 */
async function executeAutomation(
  automation: {
    id: string;
    name: string;
    actions: ActionWithTemplate[];
  },
  submission: SubmissionData
): Promise<void> {
  console.log(`Executing automation: ${automation.name}`);

  let currentDelay = 0; // Akkumulert forsinkelse i minutter

  // Kjør hver aksjon i rekkefølge
  for (let i = 0; i < automation.actions.length; i++) {
    const action = automation.actions[i];
    
    // Hvis det er en WAIT_DELAY, akkumuler forsinkelsen og planlegg neste aksjon
    if (action.type === "WAIT_DELAY") {
      const actionConfig = (action.config || {}) as Record<string, unknown>;
      const delayAmount = (actionConfig.delayAmount as number) || 1;
      const delayUnit = (actionConfig.delayUnit as string) || "days";
      
      // Konverter til minutter
      let delayMinutes = delayAmount;
      switch (delayUnit) {
        case "hours": delayMinutes *= 60; break;
        case "days": delayMinutes *= 60 * 24; break;
        case "weeks": delayMinutes *= 60 * 24 * 7; break;
      }
      
      currentDelay += delayMinutes;
      continue; // Ikke kjør WAIT_DELAY som en aksjon
    }

    // Hvis vi har akkumulert forsinkelse, planlegg aksjonen
    if (currentDelay > 0) {
      const scheduledFor = new Date();
      scheduledFor.setMinutes(scheduledFor.getMinutes() + currentDelay);
      
      await db.scheduledJob.create({
        data: {
          automationId: automation.id,
          submissionId: submission.id,
          actionIndex: i,
          scheduledFor,
          payload: {
            submissionData: submission.data,
          } as Prisma.InputJsonValue,
        },
      });
      
      console.log(`Action ${i} scheduled for ${scheduledFor.toISOString()}`);
    } else {
      // Kjør aksjonen umiddelbart
      await executeAction(action, submission, action.emailTemplate || null);
    }
  }

  // Oppdater kjøretall
  await db.automation.update({
    where: { id: automation.id },
    data: {
      lastRunAt: new Date(),
      runCount: { increment: 1 },
    },
  });

  // Logg suksess
  await db.activityLog.create({
    data: {
      action: "automation.executed",
      resource: "automation",
      resourceId: automation.id,
      details: {
        submissionId: submission.id,
        automationName: automation.name,
      },
    },
  });
}

/**
 * Kjør en enkelt aksjon
 */
async function executeAction(
  action: AutomationAction,
  submission: SubmissionData,
  emailTemplate: {
    id: string;
    subject: string;
    htmlContent: string;
    textContent: string | null;
  } | null
): Promise<void> {
  switch (action.type) {
    case "SEND_EMAIL":
      await executeSendEmailAction(action, submission, emailTemplate);
      break;

    case "WAIT_DELAY":
      await executeWaitAction(action);
      break;

    case "UPDATE_SUBMISSION_STATUS":
      await executeUpdateStatusAction(action, submission);
      break;

    case "SEND_NOTIFICATION":
      await executeSendNotificationAction(action, submission);
      break;

    default:
      console.warn(`Unknown action type: ${action.type}`);
  }
}

/**
 * Send e-post aksjon
 */
async function executeSendEmailAction(
  action: AutomationAction,
  submission: SubmissionData,
  emailTemplate: {
    id: string;
    subject: string;
    htmlContent: string;
    textContent: string | null;
  } | null
): Promise<void> {
  const config = (action.config || {}) as Record<string, unknown>;
  
  // Finn mottaker
  let recipientEmail: string | undefined;
  
  if (config.sendToSubmitter && config.emailField) {
    // Send til personen som fylte ut skjemaet
    recipientEmail = submission.data[config.emailField as string] as string | undefined;
  } else if (config.recipientEmail) {
    // Send til en fast e-postadresse
    recipientEmail = config.recipientEmail as string;
  }

  if (!recipientEmail) {
    console.warn("No recipient email found for SEND_EMAIL action");
    return;
  }

  // Bruk mal eller custom innhold
  let subject: string;
  let htmlContent: string;
  let textContent: string | undefined;

  if (emailTemplate) {
    subject = replaceVariables(emailTemplate.subject, submission.data);
    htmlContent = replaceVariables(emailTemplate.htmlContent, submission.data);
    textContent = emailTemplate.textContent 
      ? replaceVariables(emailTemplate.textContent, submission.data)
      : undefined;
  } else if (config.subject && config.htmlContent) {
    subject = replaceVariables(config.subject as string, submission.data);
    htmlContent = replaceVariables(config.htmlContent as string, submission.data);
    textContent = config.textContent 
      ? replaceVariables(config.textContent as string, submission.data)
      : undefined;
  } else {
    console.warn("No email template or content found");
    return;
  }

  // Hent avsender e-post
  const fromEmail = process.env.EMAIL_FROM || "noreply@example.com";

  // Send e-post
  const result = await sendEmail({
    to: recipientEmail,
    subject,
    html: htmlContent,
    text: textContent,
    from: fromEmail,
    replyTo: config.replyTo as string | undefined,
  });

  // Logg e-post
  await db.emailLog.create({
    data: {
      submissionId: submission.id,
      to: recipientEmail,
      from: fromEmail,
      subject,
      status: result.success ? "SENT" : "FAILED",
      sentAt: result.success ? new Date() : null,
      errorMessage: result.error,
      externalId: result.messageId,
    },
  });

  console.log(`Email sent to ${recipientEmail}: ${result.success ? "success" : "failed"}`);
}

/**
 * Vent-aksjon (for fremtidig bruk med bakgrunnsjobber)
 */
async function executeWaitAction(action: AutomationAction): Promise<void> {
  const config = (action.config || {}) as Record<string, unknown>;
  const delayMinutes = (config.delayMinutes as number) || 0;
  
  // For nå: Bare logg at vi skulle ventet
  // I fremtiden: Bruk en jobb-kø som Bull eller Inngest
  console.log(`Wait action: Would wait ${delayMinutes} minutes`);
}

/**
 * Oppdater innsending-status aksjon
 */
async function executeUpdateStatusAction(
  action: AutomationAction,
  submission: SubmissionData
): Promise<void> {
  const config = (action.config || {}) as Record<string, unknown>;
  const newStatus = config.status as string;
  
  if (!newStatus) {
    console.warn("No status specified for UPDATE_SUBMISSION_STATUS action");
    return;
  }

  await db.submission.update({
    where: { id: submission.id },
    data: { status: newStatus as "NEW" | "CONTACTED" | "QUALIFIED" | "CONVERTED" | "LOST" | "SPAM" },
  });

  console.log(`Submission status updated to: ${newStatus}`);
}

/**
 * Send intern varsel aksjon
 */
async function executeSendNotificationAction(
  action: AutomationAction,
  submission: SubmissionData
): Promise<void> {
  const config = (action.config || {}) as Record<string, unknown>;
  const notifyEmail = config.notifyEmail as string;
  
  if (!notifyEmail) {
    console.warn("No notify email specified");
    return;
  }

  // Hent skjema-info
  const form = await db.form.findUnique({
    where: { id: submission.formId },
    select: { name: true },
  });

  // Bygg e-post innhold
  const dataHtml = Object.entries(submission.data)
    .map(([key, value]) => `<p><strong>${key}:</strong> ${value}</p>`)
    .join("");

  const htmlContent = `
    <h2>Ny innsending på ${form?.name || "skjema"}</h2>
    <p>Du har mottatt en ny innsending:</p>
    <div style="background: #f8f9fa; padding: 16px; border-radius: 8px; margin: 16px 0;">
      ${dataHtml}
    </div>
    <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/leads">Se alle leads</a></p>
  `;

  await sendEmail({
    to: notifyEmail,
    subject: `Ny innsending: ${form?.name || "Skjema"}`,
    html: htmlContent,
  });

  console.log(`Notification sent to: ${notifyEmail}`);
}

