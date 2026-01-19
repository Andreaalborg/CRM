"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Play, Pause, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui";

interface AutomationActionsProps {
  automationId: string;
  status: "DRAFT" | "ACTIVE" | "PAUSED";
}

export function AutomationActions({ automationId, status }: AutomationActionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleToggleStatus = async () => {
    const newStatus = status === "ACTIVE" ? "PAUSED" : "ACTIVE";
    setIsLoading("toggle");
    
    try {
      const response = await fetch(`/api/automations/${automationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Kunne ikke oppdatere status");
      }

      router.refresh();
    } catch (error) {
      console.error("Error toggling status:", error);
      alert("Kunne ikke oppdatere status. Prøv igjen.");
    } finally {
      setIsLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Er du sikker på at du vil slette denne automasjonen?")) {
      return;
    }

    setIsLoading("delete");
    
    try {
      const response = await fetch(`/api/automations/${automationId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Kunne ikke slette automasjon");
      }

      router.refresh();
    } catch (error) {
      console.error("Error deleting automation:", error);
      alert("Kunne ikke slette automasjon. Prøv igjen.");
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <button
        onClick={handleToggleStatus}
        disabled={isLoading !== null}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "36px",
          height: "36px",
          borderRadius: "8px",
          border: "1px solid #e2e8f0",
          backgroundColor: "#fff",
          cursor: isLoading ? "not-allowed" : "pointer",
          opacity: isLoading ? 0.5 : 1,
        }}
        title={status === "ACTIVE" ? "Pause" : "Aktiver"}
      >
        {isLoading === "toggle" ? (
          <Loader2 style={{ width: "16px", height: "16px", animation: "spin 1s linear infinite" }} />
        ) : status === "ACTIVE" ? (
          <Pause style={{ width: "16px", height: "16px", color: "#64748b" }} />
        ) : (
          <Play style={{ width: "16px", height: "16px", color: "#10b981" }} />
        )}
      </button>

      <button
        onClick={handleDelete}
        disabled={isLoading !== null}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "36px",
          height: "36px",
          borderRadius: "8px",
          border: "1px solid #fee2e2",
          backgroundColor: "#fff",
          cursor: isLoading ? "not-allowed" : "pointer",
          opacity: isLoading ? 0.5 : 1,
        }}
        title="Slett"
      >
        {isLoading === "delete" ? (
          <Loader2 style={{ width: "16px", height: "16px", animation: "spin 1s linear infinite" }} />
        ) : (
          <Trash2 style={{ width: "16px", height: "16px", color: "#ef4444" }} />
        )}
      </button>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}



