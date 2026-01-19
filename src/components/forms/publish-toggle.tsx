"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";

interface PublishToggleProps {
  formId: string;
  isPublished: boolean;
}

export function PublishToggle({ formId, isPublished: initialPublished }: PublishToggleProps) {
  const router = useRouter();
  const [isPublished, setIsPublished] = useState(initialPublished);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/forms/${formId}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: !isPublished }),
      });

      if (!response.ok) {
        throw new Error("Kunne ikke oppdatere status");
      }

      setIsPublished(!isPublished);
      router.refresh();
    } catch (error) {
      console.error("Error toggling publish:", error);
      alert("Kunne ikke oppdatere status. Prøv igjen.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        padding: "8px 16px",
        borderRadius: "8px",
        border: "none",
        fontSize: "14px",
        fontWeight: 500,
        cursor: isLoading ? "not-allowed" : "pointer",
        transition: "all 0.2s ease",
        backgroundColor: isPublished ? "#ecfdf5" : "#fef3c7",
        color: isPublished ? "#059669" : "#d97706",
      }}
    >
      {isLoading ? (
        <Loader2 style={{ width: "16px", height: "16px", animation: "spin 1s linear infinite" }} />
      ) : isPublished ? (
        <Eye style={{ width: "16px", height: "16px" }} />
      ) : (
        <EyeOff style={{ width: "16px", height: "16px" }} />
      )}
      {isLoading ? "Oppdaterer..." : isPublished ? "Publisert" : "Kladd"}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </button>
  );
}


