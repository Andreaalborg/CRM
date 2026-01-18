import { Resend } from "resend";

// Initialiser Resend med API-nøkkel
const resend = new Resend(process.env.RESEND_API_KEY);

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send e-post via Resend
 */
export async function sendEmail(options: SendEmailOptions): Promise<EmailResult> {
  try {
    const fromEmail = options.from || process.env.EMAIL_FROM || "noreply@kundedata.no";
    
    const result = await resend.emails.send({
      from: fromEmail,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: options.replyTo,
    });

    if (result.error) {
      console.error("Resend error:", result.error);
      return {
        success: false,
        error: result.error.message,
      };
    }

    return {
      success: true,
      messageId: result.data?.id,
    };
  } catch (error) {
    console.error("Email sending error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Ukjent feil ved sending av e-post",
    };
  }
}

/**
 * Erstatt variabler i tekst med verdier fra data
 * F.eks. "Hei {{navn}}!" -> "Hei Ola!"
 */
export function replaceVariables(
  template: string,
  data: Record<string, unknown>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, variable) => {
    const value = data[variable];
    if (value !== undefined && value !== null) {
      return String(value);
    }
    return match; // Behold original hvis ikke funnet
  });
}

/**
 * Finn alle variabler i en mal
 */
export function extractVariables(template: string): string[] {
  const regex = /\{\{(\w+)\}\}/g;
  const variables: string[] = [];
  let match;
  
  while ((match = regex.exec(template)) !== null) {
    if (!variables.includes(match[1])) {
      variables.push(match[1]);
    }
  }
  
  return variables;
}

