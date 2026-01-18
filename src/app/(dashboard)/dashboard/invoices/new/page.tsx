"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, Button, Input } from "@/components/ui";
import { ArrowLeft, Plus, Trash2, Save } from "lucide-react";

interface Organization {
  id: string;
  name: string;
}

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  unit: string;
}

export default function NewInvoicePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  
  // Faktura-felter
  const [organizationId, setOrganizationId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerCity, setCustomerCity] = useState("");
  const [customerPostalCode, setCustomerPostalCode] = useState("");
  const [customerOrgNumber, setCustomerOrgNumber] = useState("");
  const [dueDate, setDueDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 14);
    return date.toISOString().split("T")[0];
  });
  const [vatRate, setVatRate] = useState(25);
  const [notes, setNotes] = useState("");
  const [reference, setReference] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  
  // Fakturalinjer
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: "1", description: "", quantity: 1, unitPrice: 0, unit: "stk" }
  ]);

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      const res = await fetch("/api/admin/customers");
      const data = await res.json();
      // API returnerer array direkte, ikke { organizations: [...] }
      const orgs = Array.isArray(data) ? data : (data.organizations || []);
      setOrganizations(orgs);
      if (orgs.length > 0) {
        setOrganizationId(orgs[0].id);
      }
    } catch (error) {
      console.error("Error fetching organizations:", error);
    }
  };

  const addItem = () => {
    setItems([
      ...items,
      { 
        id: Math.random().toString(36).substring(2), 
        description: "", 
        quantity: 1, 
        unitPrice: 0, 
        unit: "stk" 
      }
    ]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: string | number) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  // Beregn totaler
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const vatAmount = subtotal * (vatRate / 100);
  const total = subtotal + vatAmount;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("nb-NO", {
      style: "currency",
      currency: "NOK",
    }).format(amount);
  };

  const handleSubmit = async (e: React.FormEvent, asDraft: boolean = false) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          customerName,
          customerEmail,
          customerAddress,
          customerCity,
          customerPostalCode,
          customerOrgNumber,
          dueDate,
          vatRate,
          notes,
          reference,
          bankAccount,
          items: items.filter(item => item.description.trim() !== ""),
        }),
      });

      if (!res.ok) {
        throw new Error("Kunne ikke opprette faktura");
      }

      const data = await res.json();
      router.push(`/dashboard/invoices/${data.invoice.id}`);
    } catch (error) {
      console.error("Error creating invoice:", error);
      alert("Kunne ikke opprette faktura");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ padding: "32px", maxWidth: "1000px", margin: "0 auto" }}>
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
        <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#1a1a1a", margin: 0 }}>
          Ny faktura
        </h1>
      </div>

      <form onSubmit={(e) => handleSubmit(e, false)}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px" }}>
          {/* Hovedinnhold */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Kunde */}
            <Card>
              <CardHeader>
                <CardTitle>Kundeinformasjon</CardTitle>
              </CardHeader>
              <CardContent>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label style={{ fontSize: "13px", fontWeight: "500", color: "#374151", display: "block", marginBottom: "6px" }}>
                      Organisasjon *
                    </label>
                    <select
                      value={organizationId}
                      onChange={(e) => setOrganizationId(e.target.value)}
                      required
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        fontSize: "14px",
                      }}
                    >
                      {organizations.map(org => (
                        <option key={org.id} value={org.id}>{org.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: "13px", fontWeight: "500", color: "#374151", display: "block", marginBottom: "6px" }}>
                      Kundens org.nummer
                    </label>
                    <Input
                      value={customerOrgNumber}
                      onChange={(e) => setCustomerOrgNumber(e.target.value)}
                      placeholder="123 456 789"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "13px", fontWeight: "500", color: "#374151", display: "block", marginBottom: "6px" }}>
                      Kundenavn *
                    </label>
                    <Input
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Bedrift AS"
                      required
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "13px", fontWeight: "500", color: "#374151", display: "block", marginBottom: "6px" }}>
                      E-post *
                    </label>
                    <Input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="faktura@bedrift.no"
                      required
                    />
                  </div>
                  <div style={{ gridColumn: "span 2" }}>
                    <label style={{ fontSize: "13px", fontWeight: "500", color: "#374151", display: "block", marginBottom: "6px" }}>
                      Adresse
                    </label>
                    <Input
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      placeholder="Gateadresse 123"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "13px", fontWeight: "500", color: "#374151", display: "block", marginBottom: "6px" }}>
                      Postnummer
                    </label>
                    <Input
                      value={customerPostalCode}
                      onChange={(e) => setCustomerPostalCode(e.target.value)}
                      placeholder="0123"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "13px", fontWeight: "500", color: "#374151", display: "block", marginBottom: "6px" }}>
                      Sted
                    </label>
                    <Input
                      value={customerCity}
                      onChange={(e) => setCustomerCity(e.target.value)}
                      placeholder="Oslo"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Fakturalinjer */}
            <Card>
              <CardHeader>
                <CardTitle>Fakturalinjer</CardTitle>
              </CardHeader>
              <CardContent>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                      <th style={{ padding: "10px 0", textAlign: "left", fontSize: "12px", fontWeight: "600", color: "#6b7280" }}>Beskrivelse</th>
                      <th style={{ padding: "10px 0", textAlign: "center", fontSize: "12px", fontWeight: "600", color: "#6b7280", width: "80px" }}>Antall</th>
                      <th style={{ padding: "10px 0", textAlign: "center", fontSize: "12px", fontWeight: "600", color: "#6b7280", width: "80px" }}>Enhet</th>
                      <th style={{ padding: "10px 0", textAlign: "right", fontSize: "12px", fontWeight: "600", color: "#6b7280", width: "120px" }}>Pris</th>
                      <th style={{ padding: "10px 0", textAlign: "right", fontSize: "12px", fontWeight: "600", color: "#6b7280", width: "120px" }}>Sum</th>
                      <th style={{ width: "40px" }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr key={item.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                        <td style={{ padding: "12px 0" }}>
                          <Input
                            value={item.description}
                            onChange={(e) => updateItem(item.id, "description", e.target.value)}
                            placeholder="Beskriv vare/tjeneste..."
                            style={{ border: "none", padding: "8px 0" }}
                          />
                        </td>
                        <td style={{ padding: "12px 8px" }}>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.quantity}
                            onChange={(e) => updateItem(item.id, "quantity", parseFloat(e.target.value) || 0)}
                            style={{ textAlign: "center" }}
                          />
                        </td>
                        <td style={{ padding: "12px 8px" }}>
                          <select
                            value={item.unit}
                            onChange={(e) => updateItem(item.id, "unit", e.target.value)}
                            style={{
                              width: "100%",
                              padding: "8px",
                              border: "1px solid #e5e7eb",
                              borderRadius: "6px",
                              fontSize: "14px",
                            }}
                          >
                            <option value="stk">stk</option>
                            <option value="timer">timer</option>
                            <option value="mnd">mnd</option>
                            <option value="år">år</option>
                          </select>
                        </td>
                        <td style={{ padding: "12px 8px" }}>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) => updateItem(item.id, "unitPrice", parseFloat(e.target.value) || 0)}
                            style={{ textAlign: "right" }}
                          />
                        </td>
                        <td style={{ padding: "12px 0", textAlign: "right", fontWeight: "600" }}>
                          {formatCurrency(item.quantity * item.unitPrice)}
                        </td>
                        <td style={{ padding: "12px 0" }}>
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            disabled={items.length === 1}
                            style={{
                              padding: "6px",
                              border: "none",
                              background: "transparent",
                              cursor: items.length === 1 ? "not-allowed" : "pointer",
                              opacity: items.length === 1 ? 0.3 : 1,
                              borderRadius: "6px",
                            }}
                          >
                            <Trash2 size={16} style={{ color: "#ef4444" }} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <button
                  type="button"
                  onClick={addItem}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "10px 16px",
                    border: "1px dashed #e5e7eb",
                    borderRadius: "8px",
                    background: "transparent",
                    color: "#6b7280",
                    fontSize: "14px",
                    cursor: "pointer",
                    marginTop: "16px",
                    width: "100%",
                    justifyContent: "center",
                  }}
                >
                  <Plus size={16} />
                  Legg til linje
                </button>
              </CardContent>
            </Card>

            {/* Notater */}
            <Card>
              <CardHeader>
                <CardTitle>Notater</CardTitle>
              </CardHeader>
              <CardContent>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Valgfrie notater som vises på fakturaen..."
                  style={{
                    width: "100%",
                    minHeight: "100px",
                    padding: "12px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    fontSize: "14px",
                    resize: "vertical",
                  }}
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Datoer & Innstillinger */}
            <Card>
              <CardHeader>
                <CardTitle>Fakturadetaljer</CardTitle>
              </CardHeader>
              <CardContent>
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div>
                    <label style={{ fontSize: "13px", fontWeight: "500", color: "#374151", display: "block", marginBottom: "6px" }}>
                      Forfallsdato
                    </label>
                    <Input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "13px", fontWeight: "500", color: "#374151", display: "block", marginBottom: "6px" }}>
                      MVA-sats (%)
                    </label>
                    <select
                      value={vatRate}
                      onChange={(e) => setVatRate(parseInt(e.target.value))}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        fontSize: "14px",
                      }}
                    >
                      <option value={25}>25% (standard)</option>
                      <option value={15}>15% (mat)</option>
                      <option value={12}>12% (transport)</option>
                      <option value={0}>0% (fritatt)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: "13px", fontWeight: "500", color: "#374151", display: "block", marginBottom: "6px" }}>
                      Kundens referanse
                    </label>
                    <Input
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                      placeholder="Deres ref."
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "13px", fontWeight: "500", color: "#374151", display: "block", marginBottom: "6px" }}>
                      Kontonummer
                    </label>
                    <Input
                      value={bankAccount}
                      onChange={(e) => setBankAccount(e.target.value)}
                      placeholder="1234 56 78901"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sammendrag */}
            <Card>
              <CardHeader>
                <CardTitle>Sammendrag</CardTitle>
              </CardHeader>
              <CardContent>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#6b7280" }}>Subtotal</span>
                    <span style={{ fontWeight: "500" }}>{formatCurrency(subtotal)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#6b7280" }}>MVA ({vatRate}%)</span>
                    <span style={{ fontWeight: "500" }}>{formatCurrency(vatAmount)}</span>
                  </div>
                  <div style={{ 
                    borderTop: "2px solid #e5e7eb", 
                    paddingTop: "12px", 
                    marginTop: "8px",
                    display: "flex", 
                    justifyContent: "space-between" 
                  }}>
                    <span style={{ fontWeight: "600", fontSize: "16px" }}>Totalt</span>
                    <span style={{ fontWeight: "700", fontSize: "20px", color: "#6366f1" }}>
                      {formatCurrency(total)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <Button 
                type="submit" 
                disabled={isLoading || !customerName || !customerEmail || items.every(i => !i.description)}
                style={{ width: "100%" }}
              >
                <Save size={16} style={{ marginRight: "8px" }} />
                {isLoading ? "Oppretter..." : "Opprett faktura"}
              </Button>
              <Link href="/dashboard/invoices" style={{ width: "100%" }}>
                <Button variant="outline" style={{ width: "100%" }}>
                  Avbryt
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

