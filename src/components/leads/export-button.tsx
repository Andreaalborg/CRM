"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { Download, FileSpreadsheet, FileJson } from "lucide-react";

interface ExportButtonProps {
  formId?: string;
  status?: string;
}

export function ExportButton({ formId, status }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  async function handleExport(format: "csv" | "json") {
    setIsExporting(true);
    setShowDropdown(false);

    try {
      const params = new URLSearchParams();
      params.set("format", format);
      if (formId) params.set("formId", formId);
      if (status) params.set("status", status);

      const response = await fetch(`/api/leads/export?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error("Export failed");
      }

      if (format === "csv") {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `leads-${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `leads-${new Date().toISOString().split("T")[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Export error:", error);
      alert("Kunne ikke eksportere leads");
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div style={{ position: "relative" }}>
      <Button
        variant="outline"
        onClick={() => setShowDropdown(!showDropdown)}
        disabled={isExporting}
        style={{ display: "flex", alignItems: "center", gap: "8px" }}
      >
        <Download style={{ width: "16px", height: "16px" }} />
        {isExporting ? "Eksporterer..." : "Eksporter"}
      </Button>

      {showDropdown && (
        <>
          <div 
            style={{ position: "fixed", inset: 0, zIndex: 40 }} 
            onClick={() => setShowDropdown(false)} 
          />
          <div style={{
            position: "absolute",
            right: 0,
            top: "100%",
            marginTop: "4px",
            background: "white",
            borderRadius: "8px",
            boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
            border: "1px solid #e2e8f0",
            padding: "4px",
            zIndex: 50,
            minWidth: "160px",
          }}>
            <button
              onClick={() => handleExport("csv")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                width: "100%",
                padding: "10px 12px",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                borderRadius: "6px",
                fontSize: "14px",
                textAlign: "left",
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#f1f5f9"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >
              <FileSpreadsheet style={{ width: "18px", height: "18px", color: "#16a34a" }} />
              Last ned CSV
            </button>
            <button
              onClick={() => handleExport("json")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                width: "100%",
                padding: "10px 12px",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                borderRadius: "6px",
                fontSize: "14px",
                textAlign: "left",
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#f1f5f9"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >
              <FileJson style={{ width: "18px", height: "18px", color: "#6366f1" }} />
              Last ned JSON
            </button>
          </div>
        </>
      )}
    </div>
  );
}






