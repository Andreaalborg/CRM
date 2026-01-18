"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mail, Save, Eye, Code, Variable } from "lucide-react";
import { Button, Input, Label, Textarea } from "@/components/ui";

const variablesList = [
  { name: "navn", description: "Navn på innsender" },
  { name: "email", description: "E-postadresse" },
  { name: "telefon", description: "Telefonnummer" },
  { name: "bedrift", description: "Bedriftsnavn" },
  { name: "melding", description: "Melding fra skjema" },
];

export default function NewEmailTemplatePage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
  // Form state
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [htmlContent, setHtmlContent] = useState(`<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #4F46E5; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; padding: 12px 24px; background: #4F46E5; color: white; text-decoration: none; border-radius: 6px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Hei {{navn}}!</h1>
    </div>
    <div class="content">
      <p>Takk for at du tok kontakt med oss.</p>
      <p>Vi har mottatt din henvendelse og vil svare deg så snart som mulig.</p>
      <p>Med vennlig hilsen,<br>Teamet</p>
    </div>
  </div>
</body>
</html>`);

  const insertVariable = (varName: string) => {
    const textarea = document.getElementById("htmlContent") as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;
      const before = text.substring(0, start);
      const after = text.substring(end, text.length);
      setHtmlContent(before + `{{${varName}}}` + after);
      
      // Sett cursor etter variabelen
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + varName.length + 4;
        textarea.focus();
      }, 0);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      alert("Gi malen et navn");
      return;
    }
    if (!subject.trim()) {
      alert("Legg til et emne");
      return;
    }
    if (!htmlContent.trim()) {
      alert("Legg til innhold");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/email-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          subject,
          htmlContent,
          textContent: htmlContent.replace(/<[^>]*>/g, ""), // Strip HTML for text version
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Kunne ikke opprette mal");
      }

      router.push("/dashboard/emails");
    } catch (error) {
      console.error("Error saving template:", error);
      alert(error instanceof Error ? error.message : "Kunne ikke lagre mal");
    } finally {
      setIsSaving(false);
    }
  };

  // Erstatt variabler for forhåndsvisning
  const previewHtml = htmlContent
    .replace(/\{\{navn\}\}/g, "Ola Nordmann")
    .replace(/\{\{email\}\}/g, "ola@eksempel.no")
    .replace(/\{\{telefon\}\}/g, "99 88 77 66")
    .replace(/\{\{bedrift\}\}/g, "Nordmann AS")
    .replace(/\{\{melding\}\}/g, "Jeg ønsker mer informasjon om deres tjenester.");

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <Link 
          href="/dashboard/emails" 
          style={{ 
            display: "inline-flex", 
            alignItems: "center", 
            gap: "8px", 
            color: "#64748b", 
            fontSize: "14px",
            textDecoration: "none",
            marginBottom: "16px"
          }}
        >
          <ArrowLeft style={{ width: "16px", height: "16px" }} />
          Tilbake til e-postmaler
        </Link>

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #10b981, #059669)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <Mail style={{ width: "24px", height: "24px", color: "#fff" }} />
            </div>
            <div>
              <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                Ny e-postmal
              </h1>
              <p style={{ color: "#64748b", margin: 0 }}>
                Design en e-post som sendes automatisk
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <Button 
              variant="outline" 
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? <Code style={{ width: "16px", height: "16px" }} /> : <Eye style={{ width: "16px", height: "16px" }} />}
              {showPreview ? "Rediger" : "Forhåndsvis"}
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              <Save style={{ width: "16px", height: "16px" }} />
              {isSaving ? "Lagrer..." : "Lagre mal"}
            </Button>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "24px" }}>
        {/* Hovedinnhold */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Grunnleggende info */}
          <div style={{
            backgroundColor: "#fff",
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
            padding: "24px",
          }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <Label htmlFor="name">Malnavn *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="F.eks. Velkommen e-post"
                />
              </div>

              <div>
                <Label htmlFor="subject">E-postemne *</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="F.eks. Takk for din henvendelse, {{navn}}!"
                />
                <p style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
                  Du kan bruke variabler som {"{{navn}}"} i emnet
                </p>
              </div>
            </div>
          </div>

          {/* E-post innhold */}
          <div style={{
            backgroundColor: "#fff",
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
            padding: "24px",
            flex: 1,
          }}>
            <Label htmlFor="htmlContent">E-postinnhold (HTML) *</Label>
            
            {showPreview ? (
              <div 
                style={{
                  marginTop: "12px",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  overflow: "hidden",
                  minHeight: "400px",
                }}
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            ) : (
              <textarea
                id="htmlContent"
                value={htmlContent}
                onChange={(e) => setHtmlContent(e.target.value)}
                style={{
                  width: "100%",
                  minHeight: "400px",
                  padding: "12px",
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                  fontFamily: "monospace",
                  fontSize: "13px",
                  resize: "vertical",
                  marginTop: "12px",
                }}
              />
            )}
          </div>
        </div>

        {/* Sidebar - Variabler */}
        <div style={{
          backgroundColor: "#fff",
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
          padding: "20px",
          height: "fit-content",
          position: "sticky",
          top: "24px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
            <Variable style={{ width: "18px", height: "18px", color: "#64748b" }} />
            <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a", margin: 0 }}>
              Variabler
            </h3>
          </div>
          
          <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "16px" }}>
            Klikk for å sette inn variabel i e-posten. Verdiene erstattes automatisk med data fra skjemaet.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {variablesList.map(variable => (
              <button
                key={variable.name}
                onClick={() => insertVariable(variable.name)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  padding: "12px",
                  backgroundColor: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  textAlign: "left",
                }}
              >
                <code style={{ 
                  fontSize: "13px", 
                  color: "#4f46e5", 
                  fontWeight: 500,
                  backgroundColor: "#eef2ff",
                  padding: "2px 6px",
                  borderRadius: "4px",
                }}>
                  {`{{${variable.name}}}`}
                </code>
                <span style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
                  {variable.description}
                </span>
              </button>
            ))}
          </div>

          <div style={{ 
            marginTop: "16px", 
            padding: "12px", 
            backgroundColor: "#fef3c7", 
            borderRadius: "8px",
            border: "1px solid #fbbf24",
          }}>
            <p style={{ fontSize: "12px", color: "#92400e", margin: 0 }}>
              <strong>Tips:</strong> Variablene må matche feltnavnene i skjemaet ditt for at de skal erstattes riktig.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

