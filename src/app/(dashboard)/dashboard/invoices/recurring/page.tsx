"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, Button } from "@/components/ui";
import { 
  Plus, RefreshCw, Calendar, User, Mail, 
  Pause, Play, Trash2, Edit, TrendingUp
} from "lucide-react";

interface RecurringInvoice {
  id: string;
  name: string;
  customerName: string;
  customerEmail: string;
  interval: string;
  intervalCount: number;
  startDate: string;
  endDate?: string;
  nextInvoiceDate: string;
  lastInvoiceDate?: string;
  total: string;
  status: string;
  invoicesGenerated: number;
  totalRevenue: string;
  _count: {
    generatedInvoices: number;
  };
}

const intervalLabels: Record<string, string> = {
  WEEKLY: "Ukentlig",
  BIWEEKLY: "Annenhver uke",
  MONTHLY: "Månedlig",
  QUARTERLY: "Kvartalsvis",
  BIANNUALLY: "Halvårlig",
  YEARLY: "Årlig",
};

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  ACTIVE: { label: "Aktiv", color: "#16a34a", bg: "#dcfce7" },
  PAUSED: { label: "Pauset", color: "#ca8a04", bg: "#fef9c3" },
  CANCELLED: { label: "Avsluttet", color: "#6b7280", bg: "#e5e7eb" },
};

export default function RecurringInvoicesPage() {
  const [invoices, setInvoices] = useState<RecurringInvoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRecurringInvoices();
  }, []);

  const fetchRecurringInvoices = async () => {
    try {
      const res = await fetch("/api/recurring-invoices");
      const data = await res.json();
      setInvoices(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching recurring invoices:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await fetch(`/api/recurring-invoices/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      await fetchRecurringInvoices();
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Er du sikker på at du vil slette dette abonnementet?")) return;
    
    try {
      await fetch(`/api/recurring-invoices/${id}`, { method: "DELETE" });
      await fetchRecurringInvoices();
    } catch (error) {
      console.error("Error deleting:", error);
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
    return new Date(dateString).toLocaleDateString("nb-NO");
  };

  // Statistikk
  const activeCount = invoices.filter(i => i.status === "ACTIVE").length;
  const totalMonthlyRevenue = invoices
    .filter(i => i.status === "ACTIVE")
    .reduce((sum, inv) => {
      const amount = parseFloat(inv.total);
      // Konverter til månedlig beløp
      switch (inv.interval) {
        case "WEEKLY": return sum + (amount * 4.33);
        case "BIWEEKLY": return sum + (amount * 2.17);
        case "MONTHLY": return sum + amount;
        case "QUARTERLY": return sum + (amount / 3);
        case "BIANNUALLY": return sum + (amount / 6);
        case "YEARLY": return sum + (amount / 12);
        default: return sum + amount;
      }
    }, 0);

  if (isLoading) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <div className="spinner" />
        <p style={{ marginTop: "16px", color: "#6b7280" }}>Laster gjentakende fakturaer...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "32px", maxWidth: "1400px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        marginBottom: "32px" 
      }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#1a1a1a", margin: "0 0 8px" }}>
            Gjentakende fakturaer
          </h1>
          <p style={{ color: "#6b7280", margin: 0 }}>
            Administrer abonnementer og gjentakende faktureringer
          </p>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <Link href="/dashboard/invoices">
            <Button variant="outline">
              ← Alle fakturaer
            </Button>
          </Link>
          <Link href="/dashboard/invoices/recurring/new">
            <Button>
              <Plus size={16} style={{ marginRight: "8px" }} />
              Nytt abonnement
            </Button>
          </Link>
        </div>
      </div>

      {/* Statistikk */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(3, 1fr)", 
        gap: "20px",
        marginBottom: "32px" 
      }}>
        <Card>
          <CardContent style={{ padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ 
                width: "48px", 
                height: "48px", 
                borderRadius: "12px", 
                background: "#dbeafe",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <RefreshCw size={24} color="#3b82f6" />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: "28px", fontWeight: "700" }}>{invoices.length}</p>
                <p style={{ margin: 0, color: "#6b7280", fontSize: "14px" }}>Totalt abonnementer</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent style={{ padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ 
                width: "48px", 
                height: "48px", 
                borderRadius: "12px", 
                background: "#dcfce7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <Play size={24} color="#16a34a" />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: "28px", fontWeight: "700" }}>{activeCount}</p>
                <p style={{ margin: 0, color: "#6b7280", fontSize: "14px" }}>Aktive abonnementer</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent style={{ padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ 
                width: "48px", 
                height: "48px", 
                borderRadius: "12px", 
                background: "#fae8ff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <TrendingUp size={24} color="#a855f7" />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: "28px", fontWeight: "700" }}>
                  {formatCurrency(totalMonthlyRevenue)}
                </p>
                <p style={{ margin: 0, color: "#6b7280", fontSize: "14px" }}>Estimert månedlig inntekt</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste */}
      {invoices.length === 0 ? (
        <Card>
          <CardContent style={{ padding: "60px", textAlign: "center" }}>
            <RefreshCw size={48} style={{ color: "#d1d5db", marginBottom: "16px" }} />
            <h3 style={{ fontSize: "18px", color: "#374151", marginBottom: "8px" }}>
              Ingen gjentakende fakturaer ennå
            </h3>
            <p style={{ color: "#6b7280", marginBottom: "24px" }}>
              Opprett abonnementer for å automatisere fakturering for faste kunder
            </p>
            <Link href="/dashboard/invoices/recurring/new">
              <Button>
                <Plus size={16} style={{ marginRight: "8px" }} />
                Opprett abonnement
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {invoices.map((invoice) => {
            const status = statusConfig[invoice.status] || statusConfig.ACTIVE;
            
            return (
              <Card key={invoice.id}>
                <CardContent style={{ padding: "24px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", gap: "24px", alignItems: "center" }}>
                      {/* Ikon */}
                      <div style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "12px",
                        background: status.bg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}>
                        <RefreshCw size={24} color={status.color} />
                      </div>

                      {/* Info */}
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "4px" }}>
                          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "600" }}>
                            {invoice.name}
                          </h3>
                          <span style={{
                            padding: "4px 10px",
                            borderRadius: "12px",
                            fontSize: "12px",
                            fontWeight: "500",
                            background: status.bg,
                            color: status.color,
                          }}>
                            {status.label}
                          </span>
                        </div>
                        <div style={{ display: "flex", gap: "16px", fontSize: "13px", color: "#6b7280" }}>
                          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <User size={14} />
                            {invoice.customerName}
                          </span>
                          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <Mail size={14} />
                            {invoice.customerEmail}
                          </span>
                          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <Calendar size={14} />
                            {intervalLabels[invoice.interval]}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Høyre side */}
                    <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
                      {/* Beløp */}
                      <div style={{ textAlign: "right" }}>
                        <p style={{ margin: 0, fontSize: "18px", fontWeight: "600" }}>
                          {formatCurrency(invoice.total)}
                        </p>
                        <p style={{ margin: 0, fontSize: "12px", color: "#6b7280" }}>
                          per {intervalLabels[invoice.interval].toLowerCase()}
                        </p>
                      </div>

                      {/* Neste faktura */}
                      <div style={{ textAlign: "right" }}>
                        <p style={{ margin: 0, fontSize: "13px", fontWeight: "500" }}>
                          Neste: {formatDate(invoice.nextInvoiceDate)}
                        </p>
                        <p style={{ margin: 0, fontSize: "12px", color: "#6b7280" }}>
                          {invoice.invoicesGenerated} fakturaer generert
                        </p>
                      </div>

                      {/* Handlinger */}
                      <div style={{ display: "flex", gap: "8px" }}>
                        {invoice.status === "ACTIVE" ? (
                          <button
                            onClick={() => handleStatusChange(invoice.id, "PAUSED")}
                            title="Pause"
                            style={{
                              padding: "8px",
                              border: "1px solid #e5e7eb",
                              borderRadius: "8px",
                              background: "#fff",
                              cursor: "pointer",
                            }}
                          >
                            <Pause size={16} color="#6b7280" />
                          </button>
                        ) : invoice.status === "PAUSED" ? (
                          <button
                            onClick={() => handleStatusChange(invoice.id, "ACTIVE")}
                            title="Aktiver"
                            style={{
                              padding: "8px",
                              border: "1px solid #dcfce7",
                              borderRadius: "8px",
                              background: "#f0fdf4",
                              cursor: "pointer",
                            }}
                          >
                            <Play size={16} color="#16a34a" />
                          </button>
                        ) : null}
                        <Link href={`/dashboard/invoices/recurring/${invoice.id}/edit`}>
                          <button
                            title="Rediger"
                            style={{
                              padding: "8px",
                              border: "1px solid #e5e7eb",
                              borderRadius: "8px",
                              background: "#fff",
                              cursor: "pointer",
                            }}
                          >
                            <Edit size={16} color="#6b7280" />
                          </button>
                        </Link>
                        <button
                          onClick={() => handleDelete(invoice.id)}
                          title="Slett"
                          style={{
                            padding: "8px",
                            border: "1px solid #fee2e2",
                            borderRadius: "8px",
                            background: "#fff",
                            cursor: "pointer",
                          }}
                        >
                          <Trash2 size={16} color="#dc2626" />
                        </button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}





