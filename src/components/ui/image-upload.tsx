"use client";

import React, { useState, useRef } from "react";
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react";

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  folder?: string;
  placeholder?: string;
  className?: string;
  showPreview?: boolean;
  previewHeight?: number;
}

export function ImageUpload({
  value,
  onChange,
  folder = "images",
  placeholder = "Klikk for å laste opp eller dra og slipp",
  className = "",
  showPreview = true,
  previewHeight = 120,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (file: File) => {
    setError(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Kunne ikke laste opp fil");
      }

      onChange(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Opplasting feilet");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      handleFileChange(file);
    } else {
      setError("Kun bildefiler er tillatt");
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileChange(file);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        style={{ display: "none" }}
      />

      {value && showPreview ? (
        <div
          style={{
            position: "relative",
            borderRadius: "8px",
            overflow: "hidden",
            border: "1px solid #e5e7eb",
          }}
        >
          <img
            src={value}
            alt="Opplastet bilde"
            style={{
              width: "100%",
              height: previewHeight,
              objectFit: "cover",
            }}
          />
          <button
            onClick={handleRemove}
            style={{
              position: "absolute",
              top: "8px",
              right: "8px",
              background: "rgba(0, 0, 0, 0.6)",
              color: "white",
              border: "none",
              borderRadius: "50%",
              width: "28px",
              height: "28px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
            title="Fjern bilde"
          >
            <X size={16} />
          </button>
          <button
            onClick={handleClick}
            style={{
              position: "absolute",
              bottom: "8px",
              right: "8px",
              background: "rgba(0, 0, 0, 0.6)",
              color: "white",
              border: "none",
              borderRadius: "6px",
              padding: "6px 12px",
              fontSize: "12px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <Upload size={14} />
            Bytt bilde
          </button>
        </div>
      ) : (
        <div
          onClick={handleClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          style={{
            border: `2px dashed ${isDragging ? "#3b82f6" : "#e5e7eb"}`,
            borderRadius: "8px",
            padding: "24px",
            textAlign: "center",
            cursor: isUploading ? "wait" : "pointer",
            backgroundColor: isDragging ? "#eff6ff" : "#fafafa",
            transition: "all 0.2s",
          }}
        >
          {isUploading ? (
            <div style={{ color: "#6b7280" }}>
              <Loader2
                size={32}
                style={{
                  margin: "0 auto 8px",
                  animation: "spin 1s linear infinite",
                }}
              />
              <p style={{ margin: 0, fontSize: "14px" }}>Laster opp...</p>
            </div>
          ) : (
            <div style={{ color: "#6b7280" }}>
              <ImageIcon size={32} style={{ margin: "0 auto 8px", opacity: 0.5 }} />
              <p style={{ margin: "0 0 4px", fontSize: "14px" }}>{placeholder}</p>
              <p style={{ margin: 0, fontSize: "12px", opacity: 0.7 }}>
                JPG, PNG, GIF, WebP, SVG (maks 5MB)
              </p>
            </div>
          )}
        </div>
      )}

      {error && (
        <p style={{ color: "#ef4444", fontSize: "12px", marginTop: "8px" }}>
          {error}
        </p>
      )}

      <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}


