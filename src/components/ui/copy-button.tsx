"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface CopyButtonProps {
  text: string;
  className?: string;
}

export function CopyButton({ text, className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={className}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        padding: "8px 12px",
        backgroundColor: copied ? "#ecfdf5" : "#fff",
        border: `1px solid ${copied ? "#10b981" : "#e2e8f0"}`,
        borderRadius: "6px",
        fontSize: "13px",
        color: copied ? "#059669" : "#475569",
        cursor: "pointer",
        transition: "all 0.2s ease",
      }}
    >
      {copied ? (
        <>
          <Check style={{ width: "14px", height: "14px" }} />
          Kopiert!
        </>
      ) : (
        <>
          <Copy style={{ width: "14px", height: "14px" }} />
          Kopier
        </>
      )}
    </button>
  );
}


