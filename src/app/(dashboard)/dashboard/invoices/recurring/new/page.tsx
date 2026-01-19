"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, Button, Input } from "@/components/ui";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";

interface Organization {
  id: string;
  name: string;
  address?: string;
  city?: string;
  postalCode?: string;
  organizationNumber?: string;
}

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  unit: string;
}

export default function NewRecurringInvoicePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  
  // Form state
  const [organizationId, setOrganizationId] = useState("");
  const [name, setName] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerCity, setCustomerCity] = useState("");
  const [customerPostalCode, setCustomerPostalCode] = useState("");
  const [customerOrgNumber, setCustomerOrgNumber] = useState("");
  const [interval, setInterval] = useState("MONTHLY");
  const [intervalCount, setIntervalCount] = useState(1);
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState("");
  const [paymentDueDays, setPaymentDueDays] = useState(14);
  const [bankAccount, setBankAccount] = useState("");
  const [notes, setNotes] = useState("");
  const [vatRate, setVatRate] = useState(25);
  
  const [items, setItems] = useState<InvoiceItem[]>([
    { description: "", quantity: 1, unitPrice: 0, unit: "stk" }
  ]);

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      const res = await fetch("/api/admin/customers");
      const data = await res.json();
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
    setItems([...items, { description: "", quantity: 1, unitPrice: 0, unit: "stk" }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!organizationId || !name || !customerName || !customerEmail || items.some(i => !i.description || i.unitPrice <= 0)) {
      alert("Fyll ut alle påkrevde felt");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/recurring-invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          name,
          customerName,
          customerEmail,
          customerAddress,
          customerCity,
          customerPostalCode,
          customerOrgNumber,
          interval,
          intervalCount,
          startDate,
          endDate: endDate || undefined,
          items,
          vatRate,
          paymentDueDays,
          bankAccount,
          notes,
        }),
      });

      if (res.ok) {
        router.push("/dashboard/invoices/recurring");
      } else {
        const data = await res.json();
        alert(data.error || "Kunne ikke opprette abonnement");
      }
    } catch (error) {
      console.error("Error creating recurring invoice:", error);
      alert("Kunne ikke opprette abonnement");
    } finally {
      setIsSubmitting(false);
    }
  };

  const intervalLabels: Record<string, string> = {
    WEEKLY: "Ukentlig",
    BIWEEKLY: "Annenhver uke",
    MONTHLY: "Månedlig",
    QUARTERLY: "Kvartalsvis (hver 3. måned)",
    BIANNUALLY: "Halvårlig (hver 6. måned)",
    YEARLY: "Årlig",
  };

  return (
    <div style={{ padding: "32px", maxWidth: "900px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <Link 
          href="/dashboard/invoices/recurring"
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
          Tilbake til abonnementer
        </Link>
        
        <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#1a1a1a", margin: 0 }}>
          Nytt gjentakende faktura-abonnement
        </h1>
        <p style={{ color: "#6b7280", marginTop: "8px" }}>
          Sett opp automatisk fakturering for faste kunder
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Abonnementsnavn og organisasjon */}
          <Card>
            <CardHeader>
              <CardTitle>Grunnleggende info</CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{ fontSize: "13px", fontWeight: "500", display: "block", marginBottom: "6px" }}>
                    Abonnementsnavn *
                  </label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="F.eks. Månedlig vedlikehold"
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: "13px", fontWeight: "500", display: "block", marginBottom: "6px" }}>
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
                    <option value="">Velg organisasjon</option>
                    {organizations.map(org => (
                      <option key={org.id} value={org.id}>{org.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Kunde */}
          <Card>
            <CardHeader>
              <CardTitle>Kundeinformasjon</CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{ fontSize: "13px", fontWeight: "500", display: "block", marginBottom: "6px" }}>
                    Kundenavn *
                  </label>
                  <Input
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Bedriftsnavn eller personnavn"
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: "13px", fontWeight: "500", display: "block", marginBottom: "6px" }}>
                    E-post *
                  </label>
                  <Input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="faktura@kunde.no"
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: "13px", fontWeight: "500", display: "block", marginBottom: "6px" }}>
                    Adresse
                  </label>
                  <Input
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    placeholder="Gateadresse"
                  />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "12px" }}>
                  <div>
                    <label style={{ fontSize: "13px", fontWeight: "500", display: "block", marginBottom: "6px" }}>
                      Postnr
                    </label>
                    <Input
                      value={customerPostalCode}
                      onChange={(e) => setCustomerPostalCode(e.target.value)}
                      placeholder="0000"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "13px", fontWeight: "500", display: "block", marginBottom: "6px" }}>
                      Sted
                    </label>
                    <Input
                      value={customerCity}
                      onChange={(e) => setCustomerCity(e.target.value)}
                      placeholder="Sted"
                    />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: "13px", fontWeight: "500", display: "block", marginBottom: "6px" }}>
                    Org.nummer
                  </label>
                  <Input
                    value={customerOrgNumber}
                    onChange={(e) => setCustomerOrgNumber(e.target.value)}
                    placeholder="123 456 789"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Intervall */}
          <Card>
            <CardHeader>
              <CardTitle>Faktureringsintervall</CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{ fontSize: "13px", fontWeight: "500", display: "block", marginBottom: "6px" }}>
                    Intervall *
                  </label>
                  <select
                    value={interval}
                    onChange={(e) => setInterval(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      fontSize: "14px",
                    }}
                  >
                    {Object.entries(intervalLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "13px", fontWeight: "500", display: "block", marginBottom: "6px" }}>
                    Startdato *
                  </label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: "13px", fontWeight: "500", display: "block", marginBottom: "6px" }}>
                    Sluttdato (valgfri)
                  </label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
              <p style={{ marginTop: "12px", fontSize: "13px", color: "#6b7280" }}>
                💡 Første faktura genereres på startdatoen, deretter {intervalLabels[interval].toLowerCase()}.
              </p>
            </CardContent>
          </Card>

          {/* Fakturalinjer */}
          <Card>
            <CardHeader>
              <CardTitle>Fakturalinjer</CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {/* Header */}
                <div style={{ 
                  display: "grid", 
                  gridTemplateColumns: "2fr 80px 100px 100px 40px", 
                  gap: "12px",
                  padding: "8px 0",
                  borderBottom: "1px solid #e5e7eb",
                  fontSize: "12px",
                  fontWeight: "600",
                  color: "#6b7280"
                }}>
                  <span>Beskrivelse</span>
                  <span>Antall</span>
                  <span>Enhet</span>
                  <span>Pris</span>
                  <span></span>
                </div>

                {/* Linjer */}
                {items.map((item, index) => (
                  <div 
                    key={index}
                    style={{ 
                      display: "grid", 
                      gridTemplateColumns: "2fr 80px 100px 100px 40px", 
                      gap: "12px",
                      alignItems: "center"
                    }}
                  >
                    <Input
                      value={item.description}
                      onChange={(e) => updateItem(index, "description", e.target.value)}
                      placeholder="Beskrivelse av produkt/tjeneste"
                    />
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value) || 1)}
                    />
                    <select
                      value={item.unit}
                      onChange={(e) => updateItem(index, "unit", e.target.value)}
                      style={{
                        padding: "10px 12px",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        fontSize: "14px",
                      }}
                    >
                      <option value="stk">stk</option>
                      <option value="timer">timer</option>
                      <option value="mnd">mnd</option>
                      <option value="år">år</option>
                    </select>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(index, "unitPrice", parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                    />
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      disabled={items.length === 1}
                      style={{
                        padding: "8px",
                        border: "1px solid #fee2e2",
                        borderRadius: "8px",
                        background: "#fff",
                        cursor: items.length === 1 ? "not-allowed" : "pointer",
                        opacity: items.length === 1 ? 0.5 : 1,
                      }}
                    >
                      <Trash2 size={16} color="#dc2626" />
                    </button>
                  </div>
                ))}

                <Button type="button" variant="outline" onClick={addItem} style={{ marginTop: "8px" }}>
                  <Plus size={16} style={{ marginRight: "8px" }} />
                  Legg til linje
                </Button>
              </div>

              {/* Totaler */}
              <div style={{ 
                marginTop: "24px", 
                padding: "20px", 
                background: "#f9fafb", 
                borderRadius: "12px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}>
                <div>
                  <label style={{ fontSize: "13px", fontWeight: "500", display: "block", marginBottom: "6px" }}>
                    MVA-sats
                  </label>
                  <select
                    value={vatRate}
                    onChange={(e) => setVatRate(parseInt(e.target.value))}
                    style={{
                      padding: "8px 12px",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      fontSize: "14px",
                    }}
                  >
                    <option value="0">0% (Fritatt)</option>
                    <option value="12">12% (Mat)</option>
                    <option value="15">15% (Mat)</option>
                    <option value="25">25% (Standard)</option>
                  </select>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "13px", color: "#6b7280", marginBottom: "4px" }}>
                    Subtotal: {formatCurrency(subtotal)}
                  </div>
                  <div style={{ fontSize: "13px", color: "#6b7280", marginBottom: "8px" }}>
                    MVA ({vatRate}%): {formatCurrency(vatAmount)}
                  </div>
                  <div style={{ fontSize: "24px", fontWeight: "700", color: "#6366f1" }}>
                    {formatCurrency(total)}
                  </div>
                  <div style={{ fontSize: "12px", color: "#6b7280" }}>
                    per {intervalLabels[interval].toLowerCase()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Betalingsinfo */}
          <Card>
            <CardHeader>
              <CardTitle>Betalingsbetingelser</CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{ fontSize: "13px", fontWeight: "500", display: "block", marginBottom: "6px" }}>
                    Betalingsfrist (dager)
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={paymentDueDays}
                    onChange={(e) => setPaymentDueDays(parseInt(e.target.value) || 14)}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "13px", fontWeight: "500", display: "block", marginBottom: "6px" }}>
                    Kontonummer
                  </label>
                  <Input
                    value={bankAccount}
                    onChange={(e) => setBankAccount(e.target.value)}
                    placeholder="1234.56.78901"
                  />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={{ fontSize: "13px", fontWeight: "500", display: "block", marginBottom: "6px" }}>
                    Merknad (vises på fakturaen)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Valgfri merknad som vises på fakturaen..."
                    rows={3}
                    style={{
                      width: "100%",
                      padding: "12px",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      fontSize: "14px",
                      resize: "vertical",
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
            <Link href="/dashboard/invoices/recurring">
              <Button type="button" variant="outline">
                Avbryt
              </Button>
            </Link>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Oppretter..." : "Opprett abonnement"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

