"use client";

import { useState } from "react";
import { Code, Copy, Check, ExternalLink } from "lucide-react";

interface EmbedCodeProps {
  formUrl: string;
  formName: string;
}

type EmbedType = "iframe" | "popup" | "link";

export function EmbedCode({ formUrl, formName }: EmbedCodeProps) {
  const [embedType, setEmbedType] = useState<EmbedType>("iframe");
  const [copied, setCopied] = useState(false);
  const [height, setHeight] = useState("600");

  const getEmbedCode = () => {
    switch (embedType) {
      case "iframe":
        return `<iframe 
  src="${formUrl}" 
  width="100%" 
  height="${height}px" 
  frameborder="0" 
  style="border: none; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);"
  title="${formName}"
></iframe>`;
      
      case "popup":
        return `<!-- Legg til denne knappen der du vil ha skjema-popup -->
<button 
  onclick="window.open('${formUrl}', 'Skjema', 'width=500,height=700,scrollbars=yes')"
  style="padding: 12px 24px; background: #4F46E5; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 500;"
>
  Åpne skjema
</button>`;

      case "link":
        return formUrl;

      default:
        return "";
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getEmbedCode());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const embedOptions = [
    { value: "iframe", label: "iFrame", description: "Embed skjemaet direkte på siden" },
    { value: "popup", label: "Popup", description: "Åpne skjemaet i et popup-vindu" },
    { value: "link", label: "Direkte lenke", description: "Del lenken direkte" },
  ];

  return (
    <div style={{
      backgroundColor: "#fff",
      borderRadius: "12px",
      border: "1px solid #e2e8f0",
      padding: "20px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
        <Code style={{ width: "18px", height: "18px", color: "#64748b" }} />
        <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a", margin: 0 }}>
          Integrer skjema
        </h3>
      </div>

      {/* Embed type valg */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
        {embedOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => setEmbedType(option.value as EmbedType)}
            style={{
              flex: 1,
              padding: "12px",
              borderRadius: "8px",
              border: `2px solid ${embedType === option.value ? "#4f46e5" : "#e2e8f0"}`,
              backgroundColor: embedType === option.value ? "#eef2ff" : "#fff",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            <p style={{ 
              fontSize: "13px", 
              fontWeight: 600, 
              color: embedType === option.value ? "#4f46e5" : "#0f172a",
              margin: 0,
              marginBottom: "4px"
            }}>
              {option.label}
            </p>
            <p style={{ fontSize: "11px", color: "#64748b", margin: 0 }}>
              {option.description}
            </p>
          </button>
        ))}
      </div>

      {/* Høyde-innstilling for iframe */}
      {embedType === "iframe" && (
        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", fontSize: "13px", color: "#64748b", marginBottom: "6px" }}>
            Høyde (px)
          </label>
          <input
            type="number"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            style={{
              width: "120px",
              padding: "8px 12px",
              borderRadius: "6px",
              border: "1px solid #e2e8f0",
              fontSize: "14px",
            }}
          />
        </div>
      )}

      {/* Kode-visning */}
      <div style={{
        position: "relative",
        backgroundColor: "#1e293b",
        borderRadius: "8px",
        padding: "16px",
        marginBottom: "12px",
      }}>
        <pre style={{
          margin: 0,
          fontSize: "12px",
          color: "#e2e8f0",
          whiteSpace: "pre-wrap",
          wordBreak: "break-all",
          fontFamily: "monospace",
        }}>
          {getEmbedCode()}
        </pre>
      </div>

      {/* Knapper */}
      <div style={{ display: "flex", gap: "8px" }}>
        <button
          onClick={handleCopy}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            padding: "10px 16px",
            backgroundColor: copied ? "#ecfdf5" : "#4f46e5",
            color: copied ? "#059669" : "#fff",
            border: "none",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: 500,
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
        >
          {copied ? (
            <>
              <Check style={{ width: "16px", height: "16px" }} />
              Kopiert!
            </>
          ) : (
            <>
              <Copy style={{ width: "16px", height: "16px" }} />
              Kopier kode
            </>
          )}
        </button>

        {embedType === "link" && (
          <a
            href={formUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "10px 16px",
              backgroundColor: "#f1f5f9",
              color: "#475569",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: 500,
              textDecoration: "none",
            }}
          >
            <ExternalLink style={{ width: "16px", height: "16px" }} />
            Åpne
          </a>
        )}
      </div>
    </div>
  );
}



