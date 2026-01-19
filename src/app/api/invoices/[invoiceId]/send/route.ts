import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";

// POST /api/invoices/[invoiceId]/send - Send faktura på e-post
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
    const { 
      type = "invoice", // "invoice", "reminder", "receipt"
      customMessage 
    } = body;

    // Hent fakturaen med organisasjon og items
    const invoice = await db.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        items: { orderBy: { order: "asc" } },
        organization: true
      }
    });

    if (!invoice) {
      return NextResponse.json({ error: "Faktura ikke funnet" }, { status: 404 });
    }

    // Bygg e-postinnhold basert på type
    let subject: string;
    let htmlContent: string;
    
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat("nb-NO", {
        style: "currency",
        currency: invoice.currency
      }).format(amount);
    };

    const formatDate = (date: Date) => {
      return new Intl.DateTimeFormat("nb-NO", {
        year: "numeric",
        month: "long",
        day: "numeric"
      }).format(new Date(date));
    };

    // Felles header og footer
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const invoiceUrl = `${baseUrl}/invoice/${invoice.id}`;
    
    const emailHeader = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">${invoice.organization.name}</h1>
        </div>
    `;

    const emailFooter = `
        <div style="background: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="color: #64748b; font-size: 14px; margin: 0;">
            ${invoice.organization.name}<br>
            ${invoice.organization.address ? `${invoice.organization.address}, ` : ""}
            ${invoice.organization.postalCode || ""} ${invoice.organization.city || ""}
          </p>
          ${invoice.organization.organizationNumber ? `
            <p style="color: #94a3b8; font-size: 12px; margin: 10px 0 0;">
              Org.nr: ${invoice.organization.organizationNumber}
            </p>
          ` : ""}
        </div>
      </div>
    `;

    // Items tabell
    const itemsTable = `
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead>
          <tr style="background: #f1f5f9;">
            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e2e8f0;">Beskrivelse</th>
            <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e2e8f0;">Antall</th>
            <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e2e8f0;">Pris</th>
            <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e2e8f0;">Sum</th>
          </tr>
        </thead>
        <tbody>
          ${invoice.items.map(item => `
            <tr>
              <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">${item.description}</td>
              <td style="padding: 12px; text-align: right; border-bottom: 1px solid #e2e8f0;">${Number(item.quantity)} ${item.unit || "stk"}</td>
              <td style="padding: 12px; text-align: right; border-bottom: 1px solid #e2e8f0;">${formatCurrency(Number(item.unitPrice))}</td>
              <td style="padding: 12px; text-align: right; border-bottom: 1px solid #e2e8f0;">${formatCurrency(Number(item.amount))}</td>
            </tr>
          `).join("")}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="3" style="padding: 12px; text-align: right; font-weight: 500;">Subtotal:</td>
            <td style="padding: 12px; text-align: right;">${formatCurrency(Number(invoice.subtotal))}</td>
          </tr>
          <tr>
            <td colspan="3" style="padding: 12px; text-align: right; font-weight: 500;">MVA (${Number(invoice.vatRate)}%):</td>
            <td style="padding: 12px; text-align: right;">${formatCurrency(Number(invoice.vatAmount))}</td>
          </tr>
          <tr style="background: #f1f5f9;">
            <td colspan="3" style="padding: 12px; text-align: right; font-weight: bold; font-size: 18px;">Totalt:</td>
            <td style="padding: 12px; text-align: right; font-weight: bold; font-size: 18px;">${formatCurrency(Number(invoice.total))}</td>
          </tr>
        </tfoot>
      </table>
    `;

    switch (type) {
      case "reminder":
        subject = `Påminnelse: Faktura ${invoice.invoiceNumber} forfaller snart`;
        htmlContent = `
          ${emailHeader}
          <div style="padding: 30px;">
            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin-bottom: 20px;">
              <p style="color: #92400e; margin: 0; font-weight: 500;">⚠️ Påminnelse om utestående faktura</p>
            </div>
            
            <p style="color: #374151; line-height: 1.6;">Hei ${invoice.customerName},</p>
            
            <p style="color: #374151; line-height: 1.6;">
              Vi minner om at faktura <strong>${invoice.invoiceNumber}</strong> 
              forfaller <strong>${formatDate(invoice.dueDate)}</strong>.
            </p>
            
            ${customMessage ? `<p style="color: #374151; line-height: 1.6;">${customMessage}</p>` : ""}
            
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0 0 10px; color: #64748b;">Fakturadetaljer:</p>
              <p style="margin: 0; font-size: 24px; font-weight: bold; color: #1e293b;">
                ${formatCurrency(Number(invoice.total))}
              </p>
              <p style="margin: 10px 0 0; color: #64748b;">
                Forfallsdato: ${formatDate(invoice.dueDate)}
              </p>
            </div>
            
            ${invoice.bankAccount ? `
              <div style="background: #ecfdf5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="color: #065f46; margin: 0; font-weight: 500;">Betalingsinformasjon:</p>
                <p style="color: #065f46; margin: 10px 0 0;">Kontonummer: <strong>${invoice.bankAccount}</strong></p>
                <p style="color: #065f46; margin: 5px 0 0;">KID/Referanse: <strong>${invoice.invoiceNumber}</strong></p>
              </div>
            ` : ""}
            
            <p style="color: #64748b; font-size: 14px; margin-top: 20px;">
              Hvis du allerede har betalt, kan du se bort fra denne påminnelsen.
            </p>
          </div>
          ${emailFooter}
        `;
        break;

      case "receipt":
        subject = `Kvittering for betaling - Faktura ${invoice.invoiceNumber}`;
        htmlContent = `
          ${emailHeader}
          <div style="padding: 30px;">
            <div style="background: #dcfce7; border-left: 4px solid #22c55e; padding: 15px; margin-bottom: 20px;">
              <p style="color: #166534; margin: 0; font-weight: 500;">✅ Betaling mottatt</p>
            </div>
            
            <p style="color: #374151; line-height: 1.6;">Hei ${invoice.customerName},</p>
            
            <p style="color: #374151; line-height: 1.6;">
              Takk for betalingen! Vi bekrefter at vi har mottatt betaling for faktura 
              <strong>${invoice.invoiceNumber}</strong>.
            </p>
            
            ${customMessage ? `<p style="color: #374151; line-height: 1.6;">${customMessage}</p>` : ""}
            
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0 0 10px; color: #64748b;">Betalt beløp:</p>
              <p style="margin: 0; font-size: 24px; font-weight: bold; color: #22c55e;">
                ${formatCurrency(Number(invoice.paidAmount))}
              </p>
              <p style="margin: 10px 0 0; color: #64748b;">
                Betalingsdato: ${invoice.paidAt ? formatDate(invoice.paidAt) : formatDate(new Date())}
              </p>
            </div>
            
            <p style="color: #374151; line-height: 1.6;">
              Takk for at du er kunde hos oss!
            </p>
          </div>
          ${emailFooter}
        `;
        break;

      default: // "invoice"
        subject = `Faktura ${invoice.invoiceNumber} fra ${invoice.organization.name}`;
        htmlContent = `
          ${emailHeader}
          <div style="padding: 30px;">
            <p style="color: #374151; line-height: 1.6;">Hei ${invoice.customerName},</p>
            
            <p style="color: #374151; line-height: 1.6;">
              Vedlagt finner du faktura <strong>${invoice.invoiceNumber}</strong> 
              med forfallsdato <strong>${formatDate(invoice.dueDate)}</strong>.
            </p>
            
            ${customMessage ? `<p style="color: #374151; line-height: 1.6;">${customMessage}</p>` : ""}
            
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                <div>
                  <p style="margin: 0; color: #64748b; font-size: 14px;">Fakturanummer</p>
                  <p style="margin: 5px 0 0; font-weight: 600; color: #1e293b;">${invoice.invoiceNumber}</p>
                </div>
                <div style="text-align: right;">
                  <p style="margin: 0; color: #64748b; font-size: 14px;">Forfallsdato</p>
                  <p style="margin: 5px 0 0; font-weight: 600; color: #1e293b;">${formatDate(invoice.dueDate)}</p>
                </div>
              </div>
            </div>
            
            ${itemsTable}
            
            ${invoice.bankAccount ? `
              <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="color: #1e40af; margin: 0 0 10px; font-weight: 600;">Betalingsinformasjon:</p>
                <p style="color: #1e40af; margin: 5px 0;">Kontonummer: <strong>${invoice.bankAccount}</strong></p>
                <p style="color: #1e40af; margin: 5px 0;">Beløp: <strong>${formatCurrency(Number(invoice.total))}</strong></p>
                <p style="color: #1e40af; margin: 5px 0;">KID/Referanse: <strong>${invoice.invoiceNumber}</strong></p>
              </div>
            ` : ""}
            
            ${invoice.notes ? `
              <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 20px;">
                <p style="color: #64748b; font-size: 14px;">${invoice.notes}</p>
              </div>
            ` : ""}
            
            <p style="color: #64748b; font-size: 14px; margin-top: 30px;">
              Ta kontakt hvis du har spørsmål om fakturaen.
            </p>
          </div>
          ${emailFooter}
        `;
    }

    // Send e-post
    const emailResult = await sendEmail({
      to: invoice.customerEmail,
      subject,
      html: htmlContent,
    });

    if (!emailResult.success) {
      return NextResponse.json(
        { error: emailResult.error || "Kunne ikke sende e-post" },
        { status: 500 }
      );
    }

    // Logg e-posten
    await db.invoiceEmailLog.create({
      data: {
        invoiceId,
        to: invoice.customerEmail,
        subject,
        type,
      }
    });

    // Oppdater fakturastatus til SENT hvis det er en ny faktura
    if (type === "invoice" && invoice.status === "DRAFT") {
      await db.invoice.update({
        where: { id: invoiceId },
        data: { status: "SENT" }
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: `E-post sendt til ${invoice.customerEmail}` 
    });
  } catch (error) {
    console.error("Error sending invoice email:", error);
    return NextResponse.json(
      { error: "Kunne ikke sende e-post" },
      { status: 500 }
    );
  }
}

