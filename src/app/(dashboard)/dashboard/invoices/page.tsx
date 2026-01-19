"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, Button } from "@/components/ui";
import { 
  Plus, FileText, Clock, CheckCircle, AlertTriangle, 
  Search, Filter, Download, Mail, Eye, MoreHorizontal, RefreshCw
} from "lucide-react";

interface Invoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerEmail: string;
  issueDate: string;
  dueDate: string;
  total: string;
  paidAmount: string;
  status: string;
  organization: { name: string };
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  DRAFT: { label: "Utkast", color: "#6b7280", bg: "#f3f4f6" },
  SENT: { label: "Sendt", color: "#3b82f6", bg: "#dbeafe" },
  PAID: { label: "Betalt", color: "#16a34a", bg: "#dcfce7" },
  PARTIALLY_PAID: { label: "Delbetalt", color: "#ca8a04", bg: "#fef9c3" },
  OVERDUE: { label: "Forfalt", color: "#dc2626", bg: "#fee2e2" },
  CANCELLED: { label: "Kansellert", color: "#6b7280", bg: "#e5e7eb" },
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const res = await fetch("/api/invoices");
      const data = await res.json();
      setInvoices(data.invoices || []);
    } catch (error) {
      console.error("Error fetching invoices:", error);
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
      month: "short",
      year: "numeric",
    });
  };

  const filteredInvoices = invoices.filter(inv => {
    const matchesFilter = filter === "all" || inv.status === filter;
    const matchesSearch = 
      inv.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Statistikk
  const stats = {
    total: invoices.length,
    draft: invoices.filter(i => i.status === "DRAFT").length,
    sent: invoices.filter(i => i.status === "SENT").length,
    paid: invoices.filter(i => i.status === "PAID").length,
    overdue: invoices.filter(i => i.status === "OVERDUE").length,
    totalAmount: invoices.reduce((sum, i) => sum + parseFloat(i.total), 0),
    paidAmount: invoices.reduce((sum, i) => sum + parseFloat(i.paidAmount), 0),
  };

  if (isLoading) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <div className="spinner" />
        <p style={{ marginTop: "16px", color: "#6b7280" }}>Laster fakturaer...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "32px" }}>
      {/* Header */}
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        marginBottom: "32px"
      }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#1a1a1a", margin: 0 }}>
            Fakturaer
          </h1>
          <p style={{ color: "#6b7280", marginTop: "4px" }}>
            Opprett og administrer fakturaer
          </p>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <Link href="/dashboard/invoices/recurring">
            <Button variant="outline">
              <RefreshCw style={{ width: "16px", height: "16px", marginRight: "8px" }} />
              Gjentakende
            </Button>
          </Link>
          <Link href="/dashboard/invoices/new">
            <Button>
              <Plus style={{ width: "16px", height: "16px", marginRight: "8px" }} />
              Ny faktura
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", 
        gap: "16px",
        marginBottom: "32px"
      }}>
        <Card>
          <CardContent style={{ padding: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ 
                width: "40px", height: "40px", 
                borderRadius: "10px", 
                background: "#eff6ff",
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                <FileText style={{ color: "#3b82f6" }} size={20} />
              </div>
              <div>
                <p style={{ fontSize: "24px", fontWeight: "700", color: "#1a1a1a", margin: 0 }}>
                  {stats.total}
                </p>
                <p style={{ fontSize: "13px", color: "#6b7280", margin: 0 }}>Totalt</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent style={{ padding: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ 
                width: "40px", height: "40px", 
                borderRadius: "10px", 
                background: "#fef9c3",
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                <Clock style={{ color: "#ca8a04" }} size={20} />
              </div>
              <div>
                <p style={{ fontSize: "24px", fontWeight: "700", color: "#1a1a1a", margin: 0 }}>
                  {stats.sent}
                </p>
                <p style={{ fontSize: "13px", color: "#6b7280", margin: 0 }}>Venter</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent style={{ padding: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ 
                width: "40px", height: "40px", 
                borderRadius: "10px", 
                background: "#dcfce7",
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                <CheckCircle style={{ color: "#16a34a" }} size={20} />
              </div>
              <div>
                <p style={{ fontSize: "24px", fontWeight: "700", color: "#1a1a1a", margin: 0 }}>
                  {formatCurrency(stats.paidAmount)}
                </p>
                <p style={{ fontSize: "13px", color: "#6b7280", margin: 0 }}>Betalt</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent style={{ padding: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ 
                width: "40px", height: "40px", 
                borderRadius: "10px", 
                background: "#fee2e2",
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                <AlertTriangle style={{ color: "#dc2626" }} size={20} />
              </div>
              <div>
                <p style={{ fontSize: "24px", fontWeight: "700", color: "#1a1a1a", margin: 0 }}>
                  {stats.overdue}
                </p>
                <p style={{ fontSize: "13px", color: "#6b7280", margin: 0 }}>Forfalt</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Search */}
      <Card style={{ marginBottom: "24px" }}>
        <CardContent style={{ padding: "16px" }}>
          <div style={{ display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap" }}>
            {/* Search */}
            <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
              <Search style={{ 
                position: "absolute", 
                left: "12px", 
                top: "50%", 
                transform: "translateY(-50%)",
                color: "#9ca3af",
                width: "18px"
              }} />
              <input
                type="text"
                placeholder="Søk på kunde eller fakturanummer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px 10px 40px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  fontSize: "14px",
                }}
              />
            </div>

            {/* Status Filter */}
            <div style={{ display: "flex", gap: "8px" }}>
              {[
                { value: "all", label: "Alle" },
                { value: "DRAFT", label: "Utkast" },
                { value: "SENT", label: "Sendt" },
                { value: "PAID", label: "Betalt" },
                { value: "OVERDUE", label: "Forfalt" },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setFilter(value)}
                  style={{
                    padding: "8px 16px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    background: filter === value ? "#6366f1" : "#fff",
                    color: filter === value ? "#fff" : "#374151",
                    fontSize: "13px",
                    fontWeight: "500",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoice List */}
      <Card>
        <CardContent style={{ padding: 0 }}>
          {filteredInvoices.length === 0 ? (
            <div style={{ padding: "60px 20px", textAlign: "center" }}>
              <FileText style={{ width: "48px", height: "48px", color: "#d1d5db", margin: "0 auto 16px" }} />
              <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#374151", marginBottom: "8px" }}>
                Ingen fakturaer funnet
              </h3>
              <p style={{ color: "#6b7280", marginBottom: "20px" }}>
                {searchTerm || filter !== "all" 
                  ? "Prøv å endre søk eller filter" 
                  : "Opprett din første faktura"}
              </p>
              {!searchTerm && filter === "all" && (
                <Link href="/dashboard/invoices/new">
                  <Button>
                    <Plus style={{ width: "16px", height: "16px", marginRight: "8px" }} />
                    Opprett faktura
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                  <th style={{ 
                    padding: "14px 20px", 
                    textAlign: "left", 
                    fontSize: "12px", 
                    fontWeight: "600",
                    color: "#6b7280",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px"
                  }}>Faktura</th>
                  <th style={{ padding: "14px 20px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase" }}>Kunde</th>
                  <th style={{ padding: "14px 20px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase" }}>Dato</th>
                  <th style={{ padding: "14px 20px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase" }}>Forfaller</th>
                  <th style={{ padding: "14px 20px", textAlign: "right", fontSize: "12px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase" }}>Beløp</th>
                  <th style={{ padding: "14px 20px", textAlign: "center", fontSize: "12px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase" }}>Status</th>
                  <th style={{ padding: "14px 20px", textAlign: "right", fontSize: "12px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase" }}></th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((invoice) => {
                  const status = statusConfig[invoice.status] || statusConfig.DRAFT;
                  return (
                    <tr 
                      key={invoice.id}
                      style={{ 
                        borderBottom: "1px solid #f3f4f6",
                        transition: "background 0.15s",
                      }}
                      onMouseOver={(e) => e.currentTarget.style.background = "#fafafa"}
                      onMouseOut={(e) => e.currentTarget.style.background = "transparent"}
                    >
                      <td style={{ padding: "16px 20px" }}>
                        <Link 
                          href={`/dashboard/invoices/${invoice.id}`}
                          style={{ 
                            fontWeight: "600", 
                            color: "#1a1a1a",
                            textDecoration: "none",
                          }}
                        >
                          #{invoice.invoiceNumber}
                        </Link>
                      </td>
                      <td style={{ padding: "16px 20px" }}>
                        <div>
                          <p style={{ margin: 0, fontWeight: "500", color: "#1a1a1a" }}>
                            {invoice.customerName}
                          </p>
                          <p style={{ margin: "2px 0 0", fontSize: "13px", color: "#6b7280" }}>
                            {invoice.customerEmail}
                          </p>
                        </div>
                      </td>
                      <td style={{ padding: "16px 20px", color: "#4a4a4a", fontSize: "14px" }}>
                        {formatDate(invoice.issueDate)}
                      </td>
                      <td style={{ padding: "16px 20px", color: "#4a4a4a", fontSize: "14px" }}>
                        {formatDate(invoice.dueDate)}
                      </td>
                      <td style={{ padding: "16px 20px", textAlign: "right", fontWeight: "600", color: "#1a1a1a" }}>
                        {formatCurrency(invoice.total)}
                      </td>
                      <td style={{ padding: "16px 20px", textAlign: "center" }}>
                        <span style={{
                          display: "inline-block",
                          padding: "4px 12px",
                          borderRadius: "20px",
                          fontSize: "12px",
                          fontWeight: "600",
                          background: status.bg,
                          color: status.color,
                        }}>
                          {status.label}
                        </span>
                      </td>
                      <td style={{ padding: "16px 20px", textAlign: "right" }}>
                        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                          <Link href={`/dashboard/invoices/${invoice.id}`}>
                            <button
                              style={{
                                padding: "6px",
                                border: "none",
                                background: "transparent",
                                cursor: "pointer",
                                borderRadius: "6px",
                              }}
                              title="Se faktura"
                            >
                              <Eye size={18} style={{ color: "#6b7280" }} />
                            </button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


