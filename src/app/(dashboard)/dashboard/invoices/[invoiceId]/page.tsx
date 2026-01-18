"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, Button, Input } from "@/components/ui";
import { 
  ArrowLeft, Download, Mail, CreditCard, CheckCircle,
  Clock, AlertTriangle, Trash2, Edit, Printer, Copy
} from "lucide-react";
import dynamic from "next/dynamic";

// Dynamisk import for PDF (kun client-side)
const InvoicePDFDownload = dynamic(
  () => import("@/components/invoices/invoice-pdf").then(mod => ({
    default: ({ invoice }: { invoice: any }) => {
      const handleDownload = async () => {
        const { downloadInvoicePDF } = await import("@/components/invoices/invoice-pdf");
        await downloadInvoicePDF(invoice);
      };
      return (
        <Button onClick={handleDownload} variant="outline">
          <Download size={16} style={{ marginRight: "8px" }} />
          Last ned PDF
        </Button>
      );
    }
  })),
  { ssr: false, loading: () => <Button variant="outline" disabled>Laster...</Button> }
);

interface Invoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerEmail: string;
  customerAddress?: string;
  customerCity?: string;
  customerPostalCode?: string;
  customerCountry?: string;
  customerOrgNumber?: string;
  issueDate: string;
  dueDate: string;
  subtotal: string;
  vatRate: string;
  vatAmount: string;
  total: string;
  paidAmount: string;
  status: string;
  notes?: string;
  reference?: string;
  bankAccount?: string;
  paymentTerms?: string;
  items: Array<{
    id: string;
    description: string;
    quantity: string;
    unitPrice: string;
    amount: string;
    unit?: string;
  }>;
  payments: Array<{
    id: string;
    amount: string;
    method?: string;
    reference?: string;
    note?: string;
    paidAt: string;
  }>;
  organization: {
    name: string;
    address?: string;
    city?: string;
    postalCode?: string;
    phone?: string;
    organizationNumber?: string;
    website?: string;
  };
  emailLogs: Array<{
    id: string;
    to: string;
    subject: string;
    sentAt: string;
  }>;
}

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: typeof Clock }> = {
  DRAFT: { label: "Utkast", color: "#6b7280", bg: "#f3f4f6", icon: Edit },
  SENT: { label: "Sendt", color: "#3b82f6", bg: "#dbeafe", icon: Mail },
  PAID: { label: "Betalt", color: "#16a34a", bg: "#dcfce7", icon: CheckCircle },
  PARTIALLY_PAID: { label: "Delbetalt", color: "#ca8a04", bg: "#fef9c3", icon: Clock },
  OVERDUE: { label: "Forfalt", color: "#dc2626", bg: "#fee2e2", icon: AlertTriangle },
  CANCELLED: { label: "Kansellert", color: "#6b7280", bg: "#e5e7eb", icon: Trash2 },
};

export default function InvoiceDetailPage({ params }: { params: Promise<{ invoiceId: string }> }) {
  const { invoiceId } = use(params);
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("bank");
  const [paymentReference, setPaymentReference] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchInvoice();
  }, [invoiceId]);

  const fetchInvoice = async () => {
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`);
      const data = await res.json();
      setInvoice(data.invoice);
    } catch (error) {
      console.error("Error fetching invoice:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("nb-NO", {
      style: "currency",
      currency: "NOK",
    }).format(num);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("nb-NO", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const handleRegisterPayment = async () => {
    if (!paymentAmount || !invoice) return;
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/invoices/${invoiceId}/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(paymentAmount),
          method: paymentMethod,
          reference: paymentReference,
        }),
      });

      if (res.ok) {
        await fetchInvoice();
        setShowPaymentModal(false);
        setPaymentAmount("");
        setPaymentReference("");
      }
    } catch (error) {
      console.error("Error registering payment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkAsSent = async () => {
    try {
      await fetch(`/api/invoices/${invoiceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "SENT" }),
      });
      await fetchInvoice();
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Er du sikker på at du vil slette denne fakturaen?")) return;

    try {
      await fetch(`/api/invoices/${invoiceId}`, { method: "DELETE" });
      router.push("/dashboard/invoices");
    } catch (error) {
      console.error("Error deleting invoice:", error);
    }
  };

  if (isLoading) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <div className="spinner" />
        <p style={{ marginTop: "16px", color: "#6b7280" }}>Laster faktura...</p>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h2>Faktura ikke funnet</h2>
        <Link href="/dashboard/invoices">
          <Button>Tilbake til fakturaer</Button>
        </Link>
      </div>
    );
  }

  const status = statusConfig[invoice.status] || statusConfig.DRAFT;
  const StatusIcon = status.icon;
  const remainingAmount = parseFloat(invoice.total) - parseFloat(invoice.paidAmount);

  return (
    <div style={{ padding: "32px", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <Link 
          href="/dashboard/invoices"
          style={{ 
            display: "inline-flex", 
            alignItems: "center", 
            gap: "8px",
            color: "#6b7280",
            textDecoration: "none",
            marginBottom: "16px",
            fontSize: "14px",
          }}
        >
          <ArrowLeft size={16} />
          Tilbake til fakturaer
        </Link>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "8px" }}>
              <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#1a1a1a", margin: 0 }}>
                Faktura #{invoice.invoiceNumber}
              </h1>
              <span style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 14px",
                borderRadius: "20px",
                fontSize: "13px",
                fontWeight: "600",
                background: status.bg,
                color: status.color,
              }}>
                <StatusIcon size={14} />
                {status.label}
              </span>
            </div>
            <p style={{ color: "#6b7280", margin: 0 }}>
              {invoice.customerName} • {formatDate(invoice.issueDate)}
            </p>
          </div>
          
          <div style={{ display: "flex", gap: "12px" }}>
            {invoice.status === "DRAFT" && (
              <Button variant="outline" onClick={handleMarkAsSent}>
                <Mail size={16} style={{ marginRight: "8px" }} />
                Marker som sendt
              </Button>
            )}
            <InvoicePDFDownload invoice={invoice} />
            {invoice.status !== "PAID" && (
              <Button onClick={() => {
                setPaymentAmount(remainingAmount.toString());
                setShowPaymentModal(true);
              }}>
                <CreditCard size={16} style={{ marginRight: "8px" }} />
                Registrer betaling
              </Button>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px" }}>
        {/* Hovedinnhold */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Fakturadetaljer */}
          <Card>
            <CardContent style={{ padding: "32px" }}>
              {/* Header */}
              <div style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                marginBottom: "32px",
                paddingBottom: "24px",
                borderBottom: "1px solid #e5e7eb"
              }}>
                <div>
                  <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#1a1a1a", margin: "0 0 8px" }}>
                    {invoice.organization.name}
                  </h2>
                  <p style={{ color: "#6b7280", margin: 0, fontSize: "14px", lineHeight: "1.6" }}>
                    {invoice.organization.address && <>{invoice.organization.address}<br/></>}
                    {invoice.organization.postalCode} {invoice.organization.city}
                    {invoice.organization.organizationNumber && <><br/>Org.nr: {invoice.organization.organizationNumber}</>}
                  </p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontSize: "32px", fontWeight: "700", color: "#6366f1", margin: 0 }}>
                    FAKTURA
                  </p>
                  <p style={{ color: "#6b7280", margin: "4px 0 0", fontSize: "14px" }}>
                    #{invoice.invoiceNumber}
                  </p>
                </div>
              </div>

              {/* Kunde & Datoer */}
              <div style={{ 
                display: "grid", 
                gridTemplateColumns: "1fr 1fr", 
                gap: "32px",
                marginBottom: "32px" 
              }}>
                <div>
                  <p style={{ fontSize: "11px", fontWeight: "600", color: "#9ca3af", textTransform: "uppercase", marginBottom: "8px" }}>
                    Faktureres til
                  </p>
                  <p style={{ fontWeight: "600", color: "#1a1a1a", margin: "0 0 4px" }}>
                    {invoice.customerName}
                  </p>
                  <p style={{ color: "#6b7280", margin: 0, fontSize: "14px", lineHeight: "1.6" }}>
                    {invoice.customerAddress && <>{invoice.customerAddress}<br/></>}
                    {invoice.customerPostalCode} {invoice.customerCity}
                    <br/>{invoice.customerEmail}
                    {invoice.customerOrgNumber && <><br/>Org.nr: {invoice.customerOrgNumber}</>}
                  </p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ marginBottom: "8px" }}>
                    <span style={{ color: "#6b7280", fontSize: "13px" }}>Fakturadato: </span>
                    <span style={{ fontWeight: "600" }}>{formatDate(invoice.issueDate)}</span>
                  </div>
                  <div style={{ marginBottom: "8px" }}>
                    <span style={{ color: "#6b7280", fontSize: "13px" }}>Forfallsdato: </span>
                    <span style={{ fontWeight: "600" }}>{formatDate(invoice.dueDate)}</span>
                  </div>
                  {invoice.reference && (
                    <div>
                      <span style={{ color: "#6b7280", fontSize: "13px" }}>Deres ref: </span>
                      <span style={{ fontWeight: "600" }}>{invoice.reference}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Fakturalinjer */}
              <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "24px" }}>
                <thead>
                  <tr style={{ background: "#f9fafb" }}>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: "#6b7280", borderRadius: "8px 0 0 8px" }}>Beskrivelse</th>
                    <th style={{ padding: "12px 16px", textAlign: "center", fontSize: "12px", fontWeight: "600", color: "#6b7280" }}>Antall</th>
                    <th style={{ padding: "12px 16px", textAlign: "center", fontSize: "12px", fontWeight: "600", color: "#6b7280" }}>Enhet</th>
                    <th style={{ padding: "12px 16px", textAlign: "right", fontSize: "12px", fontWeight: "600", color: "#6b7280" }}>Pris</th>
                    <th style={{ padding: "12px 16px", textAlign: "right", fontSize: "12px", fontWeight: "600", color: "#6b7280", borderRadius: "0 8px 8px 0" }}>Beløp</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item) => (
                    <tr key={item.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                      <td style={{ padding: "16px" }}>{item.description}</td>
                      <td style={{ padding: "16px", textAlign: "center" }}>{item.quantity}</td>
                      <td style={{ padding: "16px", textAlign: "center" }}>{item.unit || "stk"}</td>
                      <td style={{ padding: "16px", textAlign: "right" }}>{formatCurrency(item.unitPrice)}</td>
                      <td style={{ padding: "16px", textAlign: "right", fontWeight: "600" }}>{formatCurrency(item.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totaler */}
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <div style={{ width: "250px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f3f4f6" }}>
                    <span style={{ color: "#6b7280" }}>Subtotal</span>
                    <span style={{ fontWeight: "500" }}>{formatCurrency(invoice.subtotal)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f3f4f6" }}>
                    <span style={{ color: "#6b7280" }}>MVA ({invoice.vatRate}%)</span>
                    <span style={{ fontWeight: "500" }}>{formatCurrency(invoice.vatAmount)}</span>
                  </div>
                  <div style={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    padding: "12px 16px",
                    background: "#6366f1",
                    borderRadius: "8px",
                    marginTop: "8px"
                  }}>
                    <span style={{ color: "#fff", fontWeight: "600" }}>Totalt</span>
                    <span style={{ color: "#fff", fontWeight: "700", fontSize: "18px" }}>{formatCurrency(invoice.total)}</span>
                  </div>
                </div>
              </div>

              {/* Betalingsinfo */}
              {invoice.bankAccount && (
                <div style={{ 
                  marginTop: "32px", 
                  padding: "20px", 
                  background: "#f9fafb", 
                  borderRadius: "12px" 
                }}>
                  <h3 style={{ fontSize: "14px", fontWeight: "600", marginBottom: "8px" }}>Betalingsinformasjon</h3>
                  <p style={{ color: "#4a4a4a", margin: 0, fontSize: "14px", lineHeight: "1.6" }}>
                    Kontonummer: {invoice.bankAccount}<br/>
                    KID/Referanse: {invoice.invoiceNumber}<br/>
                    {invoice.paymentTerms}
                  </p>
                </div>
              )}

              {/* Notater */}
              {invoice.notes && (
                <div style={{ 
                  marginTop: "24px", 
                  padding: "20px", 
                  background: "#fffbeb", 
                  borderRadius: "12px" 
                }}>
                  <h3 style={{ fontSize: "14px", fontWeight: "600", color: "#92400e", marginBottom: "8px" }}>Merknad</h3>
                  <p style={{ color: "#78350f", margin: 0, fontSize: "14px" }}>{invoice.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Betalingsstatus */}
          <Card>
            <CardHeader>
              <CardTitle>Betalingsstatus</CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ marginBottom: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ color: "#6b7280", fontSize: "13px" }}>Betalt</span>
                  <span style={{ fontWeight: "600", color: "#16a34a" }}>{formatCurrency(invoice.paidAmount)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                  <span style={{ color: "#6b7280", fontSize: "13px" }}>Gjenstående</span>
                  <span style={{ fontWeight: "600", color: remainingAmount > 0 ? "#dc2626" : "#16a34a" }}>
                    {formatCurrency(remainingAmount)}
                  </span>
                </div>
                {/* Progress bar */}
                <div style={{ 
                  height: "8px", 
                  background: "#e5e7eb", 
                  borderRadius: "4px",
                  overflow: "hidden"
                }}>
                  <div style={{
                    height: "100%",
                    width: `${Math.min(100, (parseFloat(invoice.paidAmount) / parseFloat(invoice.total)) * 100)}%`,
                    background: "#16a34a",
                    borderRadius: "4px",
                    transition: "width 0.3s"
                  }} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Betalingshistorikk */}
          {invoice.payments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Betalingshistorikk</CardTitle>
              </CardHeader>
              <CardContent>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {invoice.payments.map((payment) => (
                    <div 
                      key={payment.id}
                      style={{ 
                        padding: "12px",
                        background: "#f9fafb",
                        borderRadius: "8px"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                        <span style={{ fontWeight: "600", color: "#16a34a" }}>{formatCurrency(payment.amount)}</span>
                        <span style={{ fontSize: "12px", color: "#6b7280" }}>
                          {new Date(payment.paidAt).toLocaleDateString("nb-NO")}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: "12px", color: "#6b7280" }}>
                        {payment.method === "bank" && "Bankoverføring"}
                        {payment.method === "vipps" && "Vipps"}
                        {payment.method === "kontant" && "Kontant"}
                        {payment.reference && ` • ${payment.reference}`}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* E-post logg */}
          {invoice.emailLogs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>E-post historikk</CardTitle>
              </CardHeader>
              <CardContent>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {invoice.emailLogs.map((log) => (
                    <div 
                      key={log.id}
                      style={{ 
                        padding: "12px",
                        background: "#f9fafb",
                        borderRadius: "8px",
                        fontSize: "13px"
                      }}
                    >
                      <p style={{ margin: "0 0 4px", fontWeight: "500" }}>{log.subject}</p>
                      <p style={{ margin: 0, color: "#6b7280", fontSize: "12px" }}>
                        Sendt til {log.to} • {new Date(log.sentAt).toLocaleDateString("nb-NO")}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Handlinger */}
          <Card>
            <CardHeader>
              <CardTitle>Handlinger</CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <button
                  onClick={() => navigator.clipboard.writeText(`${window.location.origin}/invoice/${invoice.id}`)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "10px 12px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    background: "#fff",
                    cursor: "pointer",
                    fontSize: "13px",
                    color: "#374151",
                  }}
                >
                  <Copy size={16} />
                  Kopier lenke
                </button>
                <button
                  onClick={() => window.print()}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "10px 12px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    background: "#fff",
                    cursor: "pointer",
                    fontSize: "13px",
                    color: "#374151",
                  }}
                >
                  <Printer size={16} />
                  Skriv ut
                </button>
                <button
                  onClick={handleDelete}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "10px 12px",
                    border: "1px solid #fee2e2",
                    borderRadius: "8px",
                    background: "#fff",
                    cursor: "pointer",
                    fontSize: "13px",
                    color: "#dc2626",
                  }}
                >
                  <Trash2 size={16} />
                  Slett faktura
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Betalingsmodal */}
      {showPaymentModal && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 50
        }}>
          <Card style={{ width: "400px" }}>
            <CardHeader>
              <CardTitle>Registrer betaling</CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label style={{ fontSize: "13px", fontWeight: "500", display: "block", marginBottom: "6px" }}>
                    Beløp (NOK) *
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label style={{ fontSize: "13px", fontWeight: "500", display: "block", marginBottom: "6px" }}>
                    Betalingsmetode
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      fontSize: "14px",
                    }}
                  >
                    <option value="bank">Bankoverføring</option>
                    <option value="vipps">Vipps</option>
                    <option value="kontant">Kontant</option>
                    <option value="annet">Annet</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "13px", fontWeight: "500", display: "block", marginBottom: "6px" }}>
                    Referanse
                  </label>
                  <Input
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    placeholder="Valgfri referanse"
                  />
                </div>
                <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                  <Button
                    variant="outline"
                    onClick={() => setShowPaymentModal(false)}
                    style={{ flex: 1 }}
                  >
                    Avbryt
                  </Button>
                  <Button
                    onClick={handleRegisterPayment}
                    disabled={!paymentAmount || isSubmitting}
                    style={{ flex: 1 }}
                  >
                    {isSubmitting ? "Lagrer..." : "Registrer"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

