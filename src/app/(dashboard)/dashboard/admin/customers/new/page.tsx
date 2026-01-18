"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle, Button, Input } from "@/components/ui";
import { 
  ArrowLeft, Building2, User, Mail, Lock, Globe, Palette, Save, 
  Phone, MapPin, Hash, Users, CreditCard, FileText, CheckCircle 
} from "lucide-react";
import Link from "next/link";

export default function NewCustomerPage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    // Bedriftsinformasjon
    companyName: "",
    organizationNumber: "",
    website: "",
    description: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    country: "Norge",
    
    // Kontaktperson
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    contactPassword: "",
    
    // Abonnement
    plan: "standard",
    maxUsers: 5,
    maxForms: 10,
    
    // Branding
    primaryColor: "#6366f1",
    secondaryColor: "#8b5cf6",
    
    // Internt
    notes: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!formData.companyName || !formData.contactEmail || !formData.contactPassword) {
      alert("Vennligst fyll ut alle påkrevde felt");
      return;
    }

    if (formData.contactPassword.length < 8) {
      alert("Passord må være minst 8 tegn");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/admin/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const customer = await response.json();
        router.push(`/dashboard/admin/customers/${customer.id}`);
      } else {
        const error = await response.json();
        alert(error.error || "Kunne ikke opprette kunde");
      }
    } catch (error) {
      console.error("Error creating customer:", error);
      alert("Noe gikk galt");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <Header 
        title="Ny kunde"
        description="Opprett en ny kundekonto"
      />
      
      <div style={{ padding: "24px", maxWidth: "1000px", margin: "0 auto" }}>
        <Link 
          href="/dashboard/admin/customers" 
          style={{ 
            display: "inline-flex", 
            alignItems: "center", 
            gap: "8px", 
            marginBottom: "24px", 
            color: "#6366f1", 
            textDecoration: "none" 
          }}
        >
          <ArrowLeft style={{ width: "16px", height: "16px" }} />
          Tilbake til kunder
        </Link>

        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
            {/* Venstre kolonne */}
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              {/* Bedriftsinformasjon */}
              <Card>
                <CardHeader>
                  <CardTitle style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Building2 style={{ width: "20px", height: "20px" }} />
                    Bedriftsinformasjon
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div>
                      <label style={{ display: "block", fontWeight: "500", marginBottom: "6px" }}>
                        Bedriftsnavn *
                      </label>
                      <Input
                        value={formData.companyName}
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                        placeholder="Eksempel AS"
                        required
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", fontWeight: "500", marginBottom: "6px" }}>
                        <Hash style={{ width: "14px", height: "14px", display: "inline", marginRight: "6px" }} />
                        Org.nummer
                      </label>
                      <Input
                        value={formData.organizationNumber}
                        onChange={(e) => setFormData({ ...formData, organizationNumber: e.target.value })}
                        placeholder="123 456 789"
                      />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                      <div>
                        <label style={{ display: "block", fontWeight: "500", marginBottom: "6px" }}>
                          <Globe style={{ width: "14px", height: "14px", display: "inline", marginRight: "6px" }} />
                          Nettside
                        </label>
                        <Input
                          value={formData.website}
                          onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                          placeholder="https://eksempel.no"
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", fontWeight: "500", marginBottom: "6px" }}>
                          <Phone style={{ width: "14px", height: "14px", display: "inline", marginRight: "6px" }} />
                          Telefon
                        </label>
                        <Input
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="+47 123 45 678"
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: "block", fontWeight: "500", marginBottom: "6px" }}>
                        <MapPin style={{ width: "14px", height: "14px", display: "inline", marginRight: "6px" }} />
                        Adresse
                      </label>
                      <Input
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="Storgata 1"
                      />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                      <div>
                        <label style={{ display: "block", fontWeight: "500", marginBottom: "6px" }}>
                          Postnr
                        </label>
                        <Input
                          value={formData.postalCode}
                          onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                          placeholder="0150"
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", fontWeight: "500", marginBottom: "6px" }}>
                          By
                        </label>
                        <Input
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          placeholder="Oslo"
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", fontWeight: "500", marginBottom: "6px" }}>
                          Land
                        </label>
                        <Input
                          value={formData.country}
                          onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: "block", fontWeight: "500", marginBottom: "6px" }}>
                        Beskrivelse
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Kort beskrivelse av bedriften..."
                        style={{
                          width: "100%",
                          padding: "12px",
                          borderRadius: "8px",
                          border: "1px solid #e2e8f0",
                          fontSize: "14px",
                          minHeight: "80px",
                          resize: "vertical",
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Abonnement & Tilgang */}
              <Card>
                <CardHeader>
                  <CardTitle style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <CreditCard style={{ width: "20px", height: "20px" }} />
                    Abonnement & Tilgang
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div>
                      <label style={{ display: "block", fontWeight: "500", marginBottom: "6px" }}>
                        Abonnementsplan
                      </label>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
                        {[
                          { value: "starter", label: "Starter", desc: "For små bedrifter", price: "499,-" },
                          { value: "standard", label: "Standard", desc: "Mest populær", price: "999,-" },
                          { value: "enterprise", label: "Enterprise", desc: "Ubegrenset", price: "Tilpasset" },
                        ].map((plan) => (
                          <button
                            key={plan.value}
                            type="button"
                            onClick={() => setFormData({ ...formData, plan: plan.value })}
                            style={{
                              padding: "16px",
                              borderRadius: "12px",
                              border: formData.plan === plan.value ? "2px solid #6366f1" : "1px solid #e2e8f0",
                              background: formData.plan === plan.value ? "#eef2ff" : "white",
                              cursor: "pointer",
                              textAlign: "left",
                              position: "relative",
                            }}
                          >
                            {formData.plan === plan.value && (
                              <CheckCircle style={{ 
                                position: "absolute", 
                                top: "8px", 
                                right: "8px", 
                                width: "16px", 
                                height: "16px", 
                                color: "#6366f1" 
                              }} />
                            )}
                            <p style={{ fontWeight: "600", margin: "0 0 4px 0" }}>{plan.label}</p>
                            <p style={{ fontSize: "12px", color: "#6b7280", margin: "0 0 8px 0" }}>{plan.desc}</p>
                            <p style={{ fontWeight: "700", color: "#6366f1", margin: 0 }}>{plan.price}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                      <div>
                        <label style={{ display: "block", fontWeight: "500", marginBottom: "6px" }}>
                          <Users style={{ width: "14px", height: "14px", display: "inline", marginRight: "6px" }} />
                          Maks antall brukere
                        </label>
                        <Input
                          type="number"
                          min="1"
                          value={formData.maxUsers}
                          onChange={(e) => setFormData({ ...formData, maxUsers: parseInt(e.target.value) || 1 })}
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", fontWeight: "500", marginBottom: "6px" }}>
                          <FileText style={{ width: "14px", height: "14px", display: "inline", marginRight: "6px" }} />
                          Maks antall skjemaer
                        </label>
                        <Input
                          type="number"
                          min="1"
                          value={formData.maxForms}
                          onChange={(e) => setFormData({ ...formData, maxForms: parseInt(e.target.value) || 1 })}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Høyre kolonne */}
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              {/* Kontaktperson */}
              <Card>
                <CardHeader>
                  <CardTitle style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <User style={{ width: "20px", height: "20px" }} />
                    Kontaktperson (Primær bruker)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div>
                      <label style={{ display: "block", fontWeight: "500", marginBottom: "6px" }}>
                        Navn *
                      </label>
                      <Input
                        value={formData.contactName}
                        onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                        placeholder="Ola Nordmann"
                        required
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", fontWeight: "500", marginBottom: "6px" }}>
                        <Mail style={{ width: "14px", height: "14px", display: "inline", marginRight: "6px" }} />
                        E-post *
                      </label>
                      <Input
                        type="email"
                        value={formData.contactEmail}
                        onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                        placeholder="ola@eksempel.no"
                        required
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", fontWeight: "500", marginBottom: "6px" }}>
                        <Phone style={{ width: "14px", height: "14px", display: "inline", marginRight: "6px" }} />
                        Telefon
                      </label>
                      <Input
                        value={formData.contactPhone}
                        onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                        placeholder="+47 987 65 432"
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", fontWeight: "500", marginBottom: "6px" }}>
                        <Lock style={{ width: "14px", height: "14px", display: "inline", marginRight: "6px" }} />
                        Passord *
                      </label>
                      <Input
                        type="password"
                        value={formData.contactPassword}
                        onChange={(e) => setFormData({ ...formData, contactPassword: e.target.value })}
                        placeholder="Minst 8 tegn"
                        minLength={8}
                        required
                      />
                      <p style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>
                        Brukeren vil kunne logge inn med denne e-posten og passordet
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Branding */}
              <Card>
                <CardHeader>
                  <CardTitle style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Palette style={{ width: "20px", height: "20px" }} />
                    Branding
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    <div>
                      <label style={{ display: "block", fontWeight: "500", marginBottom: "6px" }}>
                        Primærfarge
                      </label>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <input
                          type="color"
                          value={formData.primaryColor}
                          onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                          style={{ width: "44px", height: "44px", borderRadius: "8px", border: "none", cursor: "pointer" }}
                        />
                        <Input
                          value={formData.primaryColor}
                          onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                          style={{ flex: 1 }}
                        />
                      </div>
                    </div>
                    <div>
                      <label style={{ display: "block", fontWeight: "500", marginBottom: "6px" }}>
                        Sekundærfarge
                      </label>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <input
                          type="color"
                          value={formData.secondaryColor}
                          onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                          style={{ width: "44px", height: "44px", borderRadius: "8px", border: "none", cursor: "pointer" }}
                        />
                        <Input
                          value={formData.secondaryColor}
                          onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                          style={{ flex: 1 }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Preview */}
                  <div style={{ 
                    marginTop: "20px", 
                    padding: "20px", 
                    background: "#f8fafc", 
                    borderRadius: "12px" 
                  }}>
                    <p style={{ fontSize: "12px", color: "#6b7280", marginBottom: "12px" }}>Forhåndsvisning</p>
                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                      <div style={{
                        width: "56px",
                        height: "56px",
                        borderRadius: "14px",
                        background: `linear-gradient(135deg, ${formData.primaryColor}, ${formData.secondaryColor})`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontWeight: "700",
                        fontSize: "22px",
                      }}>
                        {formData.companyName ? formData.companyName.charAt(0).toUpperCase() : "?"}
                      </div>
                      <div>
                        <p style={{ fontWeight: "600", fontSize: "16px", margin: 0 }}>
                          {formData.companyName || "Bedriftsnavn"}
                        </p>
                        <p style={{ color: "#6b7280", fontSize: "13px", margin: "2px 0 0 0" }}>
                          {formData.contactEmail || "kontakt@eksempel.no"}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Interne notater */}
              <Card>
                <CardHeader>
                  <CardTitle style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <FileText style={{ width: "20px", height: "20px" }} />
                    Interne notater
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Interne notater om kunden (synlig kun for admin)..."
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                      fontSize: "14px",
                      minHeight: "100px",
                      resize: "vertical",
                    }}
                  />
                </CardContent>
              </Card>

              {/* Submit */}
              <div style={{ 
                display: "flex", 
                justifyContent: "flex-end", 
                gap: "12px",
                padding: "20px",
                background: "#f8fafc",
                borderRadius: "12px",
                position: "sticky",
                bottom: "24px"
              }}>
                <Link href="/dashboard/admin/customers">
                  <Button type="button" variant="outline">
                    Avbryt
                  </Button>
                </Link>
                <Button 
                  type="submit" 
                  disabled={isSaving}
                  style={{ display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <Save style={{ width: "16px", height: "16px" }} />
                  {isSaving ? "Oppretter..." : "Opprett kunde"}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}
