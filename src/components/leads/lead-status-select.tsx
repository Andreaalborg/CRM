"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface LeadStatusSelectProps {
  submissionId: string;
  currentStatus: string;
}

const statuses = [
  { value: "NEW", label: "Ny", color: "#3b82f6", bg: "#dbeafe" },
  { value: "CONTACTED", label: "Kontaktet", color: "#f59e0b", bg: "#fef3c7" },
  { value: "QUALIFIED", label: "Kvalifisert", color: "#10b981", bg: "#d1fae5" },
  { value: "CONVERTED", label: "Konvertert", color: "#059669", bg: "#a7f3d0" },
  { value: "LOST", label: "Tapt", color: "#ef4444", bg: "#fee2e2" },
  { value: "SPAM", label: "Spam", color: "#6b7280", bg: "#f3f4f6" },
];

export function LeadStatusSelect({ submissionId, currentStatus }: LeadStatusSelectProps) {
  const [status, setStatus] = useState(currentStatus);
  const [isUpdating, setIsUpdating] = useState(false);
  const router = useRouter();

  const currentStatusInfo = statuses.find(s => s.value === status) || statuses[0];

  async function handleStatusChange(newStatus: string) {
    if (newStatus === status) return;
    
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/leads/${submissionId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setStatus(newStatus);
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to update status:", error);
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <div style={{ position: "relative" }}>
      <select
        value={status}
        onChange={(e) => handleStatusChange(e.target.value)}
        disabled={isUpdating}
        style={{
          appearance: "none",
          padding: "8px 32px 8px 12px",
          borderRadius: "8px",
          border: "none",
          background: currentStatusInfo.bg,
          color: currentStatusInfo.color,
          fontWeight: "600",
          fontSize: "14px",
          cursor: isUpdating ? "wait" : "pointer",
          opacity: isUpdating ? 0.7 : 1,
        }}
      >
        {statuses.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
      <div style={{
        position: "absolute",
        right: "10px",
        top: "50%",
        transform: "translateY(-50%)",
        pointerEvents: "none",
        color: currentStatusInfo.color,
      }}>
        ▼
      </div>
    </div>
  );
}






