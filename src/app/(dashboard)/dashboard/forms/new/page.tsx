"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { FormBuilder } from "@/components/forms/form-builder";

export default function NewFormPage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (formData: {
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
      const response = await fetch("/api/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Kunne ikke opprette skjema");
      }

      const form = await response.json();
      router.push(`/dashboard/forms/${form.id}`);
    } catch (error) {
      console.error("Error saving form:", error);
      alert("Kunne ikke lagre skjema. Prøv igjen.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Header 
        title="Nytt skjema"
        description="Bygg ditt skjema med drag-and-drop"
      />
      <FormBuilder onSave={handleSave} isSaving={isSaving} />
    </>
  );
}

