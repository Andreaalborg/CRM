"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent, Button, Input } from "@/components/ui";
import { Building2, Save, Globe, Mail, Palette } from "lucide-react";

interface Organization {
  id: string;
  name: string;
  slug: string;
  website: string | null;
  description: string | null;
  settings: {
    id: string;
    primaryColor: string;
    secondaryColor: string;
    senderName: string | null;
    senderEmail: string | null;
    replyToEmail: string | null;
    notifyOnSubmission: boolean;
    notificationEmails: string[];
  } | null;
}

interface CustomerSettingsProps {
  organization: Organization;
}

export function CustomerSettings({ organization }: CustomerSettingsProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: organization.name,
    website: organization.website || "",
    description: organization.description || "",
    primaryColor: organization.settings?.primaryColor || "#6366f1",
    secondaryColor: organization.settings?.secondaryColor || "#8b5cf6",
    senderName: organization.settings?.senderName || "",
    senderEmail: organization.settings?.senderEmail || "",
    replyToEmail: organization.settings?.replyToEmail || "",
  });

  async function handleSave() {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/customers/${organization.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        router.refresh();
      } else {
        alert("Kunne ikke lagre endringer");
      }
    } catch (error) {
      console.error("Error saving:", error);
      alert("Noe gikk galt");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Building2 style={{ width: "18px", height: "18px" }} />
          Bedriftsinformasjon
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "500", marginBottom: "4px" }}>
              Bedriftsnavn
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "500", marginBottom: "4px" }}>
              <Globe style={{ width: "12px", height: "12px", display: "inline", marginRight: "4px" }} />
              Nettside
            </label>
            <Input
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              placeholder="https://example.com"
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "500", marginBottom: "4px" }}>
              Beskrivelse
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Kort beskrivelse av bedriften..."
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                fontSize: "14px",
                minHeight: "60px",
                resize: "vertical",
              }}
            />
          </div>

          <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "16px" }}>
            <p style={{ fontSize: "13px", fontWeight: "500", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
              <Palette style={{ width: "14px", height: "14px" }} />
              Branding
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", color: "#6b7280", marginBottom: "4px" }}>
                  Primærfarge
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <input
                    type="color"
                    value={formData.primaryColor}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                    style={{ width: "36px", height: "36px", borderRadius: "6px", border: "none", cursor: "pointer" }}
                  />
                  <Input
                    value={formData.primaryColor}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                    style={{ flex: 1 }}
                  />
                </div>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", color: "#6b7280", marginBottom: "4px" }}>
                  Sekundærfarge
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <input
                    type="color"
                    value={formData.secondaryColor}
                    onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                    style={{ width: "36px", height: "36px", borderRadius: "6px", border: "none", cursor: "pointer" }}
                  />
                  <Input
                    value={formData.secondaryColor}
                    onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                    style={{ flex: 1 }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "16px" }}>
            <p style={{ fontSize: "13px", fontWeight: "500", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
              <Mail style={{ width: "14px", height: "14px" }} />
              E-postinnstillinger
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", color: "#6b7280", marginBottom: "4px" }}>
                  Avsendernavn
                </label>
                <Input
                  value={formData.senderName}
                  onChange={(e) => setFormData({ ...formData, senderName: e.target.value })}
                  placeholder="Bedriftsnavn AS"
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", color: "#6b7280", marginBottom: "4px" }}>
                  Avsender e-post
                </label>
                <Input
                  type="email"
                  value={formData.senderEmail}
                  onChange={(e) => setFormData({ ...formData, senderEmail: e.target.value })}
                  placeholder="noreply@bedrift.no"
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", color: "#6b7280", marginBottom: "4px" }}>
                  Svar-til e-post
                </label>
                <Input
                  type="email"
                  value={formData.replyToEmail}
                  onChange={(e) => setFormData({ ...formData, replyToEmail: e.target.value })}
                  placeholder="kontakt@bedrift.no"
                />
              </div>
            </div>
          </div>

          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "6px" }}
          >
            <Save style={{ width: "14px", height: "14px" }} />
            {isSaving ? "Lagrer..." : "Lagre endringer"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}






