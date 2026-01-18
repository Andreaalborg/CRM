"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { FormBuilder } from "@/components/forms/form-builder";

interface PageProps {
  params: Promise<{ formId: string }>;
}

interface FormField {
  id: string;
  type: string;
  name: string;
  label: string;
  placeholder?: string;
  helpText?: string;
  required: boolean;
  options?: { value: string; label: string }[];
  width: string;
}

interface FormData {
  id: string;
  name: string;
  description?: string;
  fields: FormField[];
}

export default function EditFormPage({ params }: PageProps) {
  const { formId } = use(params);
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState<FormData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadForm() {
      try {
        const response = await fetch(`/api/forms/${formId}`);
        if (!response.ok) {
          throw new Error("Kunne ikke hente skjema");
        }
        const data = await response.json();
        setFormData(data);
      } catch (err) {
        setError("Kunne ikke laste skjema");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadForm();
  }, [formId]);

  const handleSave = async (data: {
    name: string;
    description?: string;
    fields: Array<{
      type: string;
      name: string;
      label: string;
      placeholder?: string;
      helpText?: string;
      required: boolean;
      options?: { value: string; label: string }[];
      width: string;
    }>;
  }) => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/forms/${formId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Kunne ikke oppdatere skjema");
      }

      router.push(`/dashboard/forms/${formId}`);
    } catch (error) {
      console.error("Error saving form:", error);
      alert("Kunne ikke lagre skjema. Prøv igjen.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center", 
        height: "calc(100vh - 120px)" 
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: "40px",
            height: "40px",
            border: "3px solid #e2e8f0",
            borderTopColor: "#4f46e5",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            margin: "0 auto 16px"
          }} />
          <p style={{ color: "#64748b" }}>Laster skjema...</p>
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  if (error || !formData) {
    return (
      <div style={{ 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center", 
        height: "calc(100vh - 120px)" 
      }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ color: "#ef4444", marginBottom: "16px" }}>{error || "Skjema ikke funnet"}</p>
          <button
            onClick={() => router.push("/dashboard/forms")}
            style={{
              padding: "8px 16px",
              backgroundColor: "#4f46e5",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer"
            }}
          >
            Tilbake til skjemaer
          </button>
        </div>
      </div>
    );
  }

  return (
    <FormBuilder
      initialData={{
        name: formData.name,
        description: formData.description,
        fields: formData.fields.map((f) => ({
          id: f.id,
          type: f.type,
          name: f.name,
          label: f.label,
          placeholder: f.placeholder || "",
          helpText: f.helpText || "",
          required: f.required,
          options: f.options,
          width: f.width || "full",
        })),
      }}
      onSave={handleSave}
      isSaving={isSaving}
    />
  );
}

