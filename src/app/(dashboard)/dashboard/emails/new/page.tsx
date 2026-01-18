"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mail, Wand2 } from "lucide-react";
import { Button, Input, Label } from "@/components/ui";
import { EmailTemplateEditor } from "@/components/emails/email-template-editor";

export default function NewEmailTemplatePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [useVisualEditor, setUseVisualEditor] = useState(true);

  const handleSave = async (data: { subject: string; blocks: any[]; html: string }) => {
    if (!name.trim()) {
      alert("Gi malen et navn");
      return;
    }

    try {
      const response = await fetch("/api/email-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          subject: data.subject,
          htmlContent: data.html,
          textContent: data.html.replace(/<[^>]*>/g, ""), // Strip HTML for text version
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Kunne ikke opprette mal");
      }

      router.push("/dashboard/emails");
    } catch (error) {
      console.error("Error saving template:", error);
      alert(error instanceof Error ? error.message : "Kunne ikke lagre mal");
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
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

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
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
                Visuell drag-and-drop e-postbygger
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Label htmlFor="name" style={{ whiteSpace: "nowrap" }}>Malnavn:</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="F.eks. Velkommen e-post"
                style={{ width: "250px" }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Editor */}
      <EmailTemplateEditor 
        onSave={handleSave}
        variables={["navn", "epost", "telefon", "bedrift", "melding"]}
      />
    </div>
  );
}
