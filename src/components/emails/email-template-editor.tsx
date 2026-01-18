"use client";

import { useState, useCallback, useRef } from "react";
import { Card, CardContent, Button, Input } from "@/components/ui";
import { 
  Type, Image, MousePointer, Minus, Layout, 
  Trash2, ChevronUp, ChevronDown,
  Plus, Eye, Code, Save, Palette, FileCode,
  ImagePlus, Settings2
} from "lucide-react";

// Block types
type BlockType = "text" | "heading" | "button" | "image" | "divider" | "spacer" | "logo";

interface EmailBlock {
  id: string;
  type: BlockType;
  content: string;
  styles: Record<string, string>;
  link?: string;
}

interface EmailStyles {
  backgroundColor: string;
  contentBackgroundColor: string;
  fontFamily: string;
  accentColor: string;
}

interface EmailTemplateEditorProps {
  initialSubject?: string;
  initialBlocks?: EmailBlock[];
  initialHtml?: string;
  onSave?: (data: { subject: string; blocks: EmailBlock[]; html: string }) => void;
  variables?: string[];
}

const defaultBlocks: EmailBlock[] = [
  {
    id: "1",
    type: "heading",
    content: "Hei {{navn}}!",
    styles: { fontSize: "28px", fontWeight: "bold", color: "#1a1a1a", textAlign: "center" }
  },
  {
    id: "2",
    type: "text",
    content: "Takk for at du kontaktet oss. Vi har mottatt din henvendelse og vil svare deg så snart som mulig.",
    styles: { fontSize: "16px", color: "#4a4a4a", lineHeight: "1.6" }
  },
  {
    id: "3",
    type: "button",
    content: "Besøk vår nettside",
    styles: { 
      backgroundColor: "#6366f1", 
      color: "#ffffff", 
      padding: "14px 28px",
      borderRadius: "8px",
      textAlign: "center"
    },
    link: "https://example.com"
  }
];

const defaultEmailStyles: EmailStyles = {
  backgroundColor: "#f4f4f5",
  contentBackgroundColor: "#ffffff",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  accentColor: "#6366f1"
};

const blockTypes: { type: BlockType; label: string; icon: typeof Type; description: string }[] = [
  { type: "logo", label: "Logo", icon: ImagePlus, description: "Legg til logo øverst" },
  { type: "heading", label: "Overskrift", icon: Type, description: "Stor tittel" },
  { type: "text", label: "Tekst", icon: Layout, description: "Avsnitt med tekst" },
  { type: "button", label: "Knapp", icon: MousePointer, description: "Call-to-action" },
  { type: "image", label: "Bilde", icon: Image, description: "Bilde med URL" },
  { type: "divider", label: "Skillelinje", icon: Minus, description: "Horisontal linje" },
  { type: "spacer", label: "Mellomrom", icon: Layout, description: "Tomt mellomrom" },
];

export function EmailTemplateEditor({ 
  initialSubject = "", 
  initialBlocks,
  initialHtml,
  onSave,
  variables = ["navn", "epost", "telefon", "bedrift"]
}: EmailTemplateEditorProps) {
  const [subject, setSubject] = useState(initialSubject);
  const [blocks, setBlocks] = useState<EmailBlock[]>(initialBlocks || defaultBlocks);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"visual" | "html" | "preview">("visual");
  const [isSaving, setIsSaving] = useState(false);
  const [emailStyles, setEmailStyles] = useState<EmailStyles>(defaultEmailStyles);
  const [rawHtml, setRawHtml] = useState(initialHtml || "");
  const [showGlobalSettings, setShowGlobalSettings] = useState(false);
  
  // Refs for text inputs to track cursor position
  const textInputRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});

  const selectedBlock = blocks.find(b => b.id === selectedBlockId);

  const generateId = () => Math.random().toString(36).substring(2, 9);

  const addBlock = (type: BlockType) => {
    const newBlock: EmailBlock = {
      id: generateId(),
      type,
      content: getDefaultContent(type),
      styles: getDefaultStyles(type),
    };
    setBlocks([...blocks, newBlock]);
    setSelectedBlockId(newBlock.id);
  };

  const getDefaultContent = (type: BlockType): string => {
    switch (type) {
      case "logo": return "https://via.placeholder.com/200x60?text=Logo";
      case "heading": return "Overskrift";
      case "text": return "Skriv teksten din her...";
      case "button": return "Klikk her";
      case "image": return "https://via.placeholder.com/600x200";
      case "divider": return "";
      case "spacer": return "";
      default: return "";
    }
  };

  const getDefaultStyles = (type: BlockType): Record<string, string> => {
    switch (type) {
      case "logo":
        return { width: "150px", textAlign: "center" };
      case "heading": 
        return { fontSize: "28px", fontWeight: "bold", color: "#1a1a1a", textAlign: "left" };
      case "text": 
        return { fontSize: "16px", color: "#4a4a4a", lineHeight: "1.6" };
      case "button": 
        return { 
          backgroundColor: emailStyles.accentColor, 
          color: "#ffffff", 
          padding: "14px 28px",
          borderRadius: "8px",
          textAlign: "center"
        };
      case "image":
        return { width: "100%", borderRadius: "8px" };
      case "divider":
        return { borderTop: `2px solid ${emailStyles.accentColor}20`, margin: "24px 0" };
      case "spacer":
        return { height: "24px" };
      default:
        return {};
    }
  };

  const updateBlock = (id: string, updates: Partial<EmailBlock>) => {
    setBlocks(blocks.map(b => 
      b.id === id ? { ...b, ...updates } : b
    ));
  };

  const updateBlockStyle = (id: string, styleKey: string, value: string) => {
    setBlocks(blocks.map(b => 
      b.id === id ? { ...b, styles: { ...b.styles, [styleKey]: value } } : b
    ));
  };

  const deleteBlock = (id: string) => {
    setBlocks(blocks.filter(b => b.id !== id));
    if (selectedBlockId === id) {
      setSelectedBlockId(null);
    }
  };

  const moveBlock = (id: string, direction: "up" | "down") => {
    const index = blocks.findIndex(b => b.id === id);
    if (
      (direction === "up" && index === 0) || 
      (direction === "down" && index === blocks.length - 1)
    ) return;

    const newBlocks = [...blocks];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    [newBlocks[index], newBlocks[newIndex]] = [newBlocks[newIndex], newBlocks[index]];
    setBlocks(newBlocks);
  };

  // Insert variable at cursor position
  const insertVariableAtCursor = (variable: string) => {
    if (!selectedBlockId) return;
    
    const block = blocks.find(b => b.id === selectedBlockId);
    if (!block || block.type === "divider" || block.type === "spacer") return;
    
    const textarea = textInputRefs.current[selectedBlockId];
    const variableText = `{{${variable}}}`;
    
    if (textarea) {
      const start = textarea.selectionStart || 0;
      const end = textarea.selectionEnd || 0;
      const text = block.content;
      const newContent = text.substring(0, start) + variableText + text.substring(end);
      
      updateBlock(selectedBlockId, { content: newContent });
      
      // Reset cursor position after update
      setTimeout(() => {
        if (textarea) {
          textarea.focus();
          const newPos = start + variableText.length;
          textarea.setSelectionRange(newPos, newPos);
        }
      }, 0);
    } else {
      // Fallback: append at end
      updateBlock(selectedBlockId, { content: block.content + variableText });
    }
  };

  const generateHtml = useCallback(() => {
    // If in HTML mode, return raw HTML
    if (viewMode === "html" && rawHtml) {
      return rawHtml;
    }

    const blocksHtml = blocks.map(block => {
      const styleString = Object.entries(block.styles)
        .map(([key, value]) => `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value}`)
        .join('; ');

      switch (block.type) {
        case "logo":
          return `<div style="text-align: ${block.styles.textAlign || 'center'}; margin-bottom: 24px;">
            <img src="${block.content}" alt="Logo" style="max-width: ${block.styles.width || '150px'}; height: auto;" />
          </div>`;
        case "heading":
          return `<h1 style="${styleString}; margin: 0 0 16px 0;">${block.content}</h1>`;
        case "text":
          return `<p style="${styleString}; margin: 0 0 16px 0;">${block.content.replace(/\n/g, '<br>')}</p>`;
        case "button":
          return `<div style="text-align: ${block.styles.textAlign || 'center'}; margin: 24px 0;">
            <a href="${block.link || '#'}" style="${styleString}; display: inline-block; text-decoration: none; font-weight: 600;">${block.content}</a>
          </div>`;
        case "image":
          return `<img src="${block.content}" alt="" style="${styleString}; display: block; margin: 16px 0;" />`;
        case "divider":
          return `<hr style="${styleString}; border: none;" />`;
        case "spacer":
          return `<div style="${styleString}"></div>`;
        default:
          return "";
      }
    }).join("\n      ");

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: ${emailStyles.backgroundColor}; font-family: ${emailStyles.fontFamily};">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background-color: ${emailStyles.contentBackgroundColor}; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
      ${blocksHtml}
    </div>
    <div style="text-align: center; padding: 24px; color: #9ca3af; font-size: 12px;">
      <p style="margin: 0;">Denne e-posten ble sendt fra vårt system.</p>
    </div>
  </div>
</body>
</html>`;
  }, [blocks, subject, emailStyles, viewMode, rawHtml]);

  const handleSave = async () => {
    if (!onSave) return;
    setIsSaving(true);
    try {
      await onSave({
        subject,
        blocks,
        html: generateHtml()
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ display: "flex", gap: "24px", height: "calc(100vh - 200px)", minHeight: "600px" }}>
      {/* Left Panel - Block Library & Settings */}
      <div style={{ width: "220px", flexShrink: 0, display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* Block Library */}
        <Card>
          <CardContent style={{ padding: "16px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: "600", marginBottom: "12px", color: "#374151" }}>
              Legg til blokk
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {blockTypes.map(({ type, label, icon: Icon, description }) => (
                <button
                  key={type}
                  onClick={() => addBlock(type)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "10px 12px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    background: "#fff",
                    cursor: "pointer",
                    fontSize: "13px",
                    color: "#374151",
                    transition: "all 0.15s",
                    textAlign: "left",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = "#6366f1";
                    e.currentTarget.style.background = "#f5f3ff";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = "#e5e7eb";
                    e.currentTarget.style.background = "#fff";
                  }}
                >
                  <Icon style={{ width: "16px", height: "16px", color: "#6366f1", flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: "500" }}>{label}</div>
                    <div style={{ fontSize: "11px", color: "#9ca3af" }}>{description}</div>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Global Settings */}
        <Card>
          <CardContent style={{ padding: "16px" }}>
            <button
              onClick={() => setShowGlobalSettings(!showGlobalSettings)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                width: "100%",
                padding: 0,
                border: "none",
                background: "none",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "600",
                color: "#374151",
              }}
            >
              <Settings2 style={{ width: "16px", height: "16px" }} />
              E-postinnstillinger
            </button>
            
            {showGlobalSettings && (
              <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "11px", color: "#6b7280", display: "block", marginBottom: "4px" }}>
                    Bakgrunnsfarge
                  </label>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <input
                      type="color"
                      value={emailStyles.backgroundColor}
                      onChange={(e) => setEmailStyles({ ...emailStyles, backgroundColor: e.target.value })}
                      style={{ width: "32px", height: "32px", border: "none", cursor: "pointer", borderRadius: "4px" }}
                    />
                    <Input
                      value={emailStyles.backgroundColor}
                      onChange={(e) => setEmailStyles({ ...emailStyles, backgroundColor: e.target.value })}
                      style={{ flex: 1, fontSize: "12px" }}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: "11px", color: "#6b7280", display: "block", marginBottom: "4px" }}>
                    Innholdsbakgrunn
                  </label>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <input
                      type="color"
                      value={emailStyles.contentBackgroundColor}
                      onChange={(e) => setEmailStyles({ ...emailStyles, contentBackgroundColor: e.target.value })}
                      style={{ width: "32px", height: "32px", border: "none", cursor: "pointer", borderRadius: "4px" }}
                    />
                    <Input
                      value={emailStyles.contentBackgroundColor}
                      onChange={(e) => setEmailStyles({ ...emailStyles, contentBackgroundColor: e.target.value })}
                      style={{ flex: 1, fontSize: "12px" }}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: "11px", color: "#6b7280", display: "block", marginBottom: "4px" }}>
                    Aksentfarge
                  </label>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <input
                      type="color"
                      value={emailStyles.accentColor}
                      onChange={(e) => setEmailStyles({ ...emailStyles, accentColor: e.target.value })}
                      style={{ width: "32px", height: "32px", border: "none", cursor: "pointer", borderRadius: "4px" }}
                    />
                    <Input
                      value={emailStyles.accentColor}
                      onChange={(e) => setEmailStyles({ ...emailStyles, accentColor: e.target.value })}
                      style={{ flex: 1, fontSize: "12px" }}
                    />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Variables */}
        <Card>
          <CardContent style={{ padding: "16px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: "600", marginBottom: "8px", color: "#374151" }}>
              Sett inn variabel
            </h3>
            <p style={{ fontSize: "11px", color: "#9ca3af", marginBottom: "12px" }}>
              Velg en blokk og klikk for å sette inn ved markøren
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {variables.map(variable => (
                <button
                  key={variable}
                  onClick={() => insertVariableAtCursor(variable)}
                  disabled={!selectedBlockId}
                  style={{
                    padding: "6px 10px",
                    fontSize: "12px",
                    background: selectedBlockId ? "#e0e7ff" : "#f3f4f6",
                    color: selectedBlockId ? "#4338ca" : "#9ca3af",
                    border: "none",
                    borderRadius: "6px",
                    cursor: selectedBlockId ? "pointer" : "not-allowed",
                    fontWeight: "500",
                  }}
                >
                  {`{{${variable}}}`}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Center - Editor/Preview */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Subject line */}
        <div style={{ marginBottom: "16px" }}>
          <label style={{ fontSize: "14px", fontWeight: "500", marginBottom: "6px", display: "block" }}>
            Emnefelt
          </label>
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Skriv emnefelt her... (bruk {{navn}} for variabler)"
            style={{ fontSize: "16px" }}
          />
        </div>

        {/* View mode tabs */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
          <Button
            variant={viewMode === "visual" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("visual")}
          >
            <Layout style={{ width: "14px", height: "14px", marginRight: "6px" }} />
            Visuell
          </Button>
          <Button
            variant={viewMode === "html" ? "default" : "outline"}
            size="sm"
            onClick={() => {
              if (viewMode !== "html") {
                setRawHtml(generateHtml());
              }
              setViewMode("html");
            }}
          >
            <FileCode style={{ width: "14px", height: "14px", marginRight: "6px" }} />
            HTML
          </Button>
          <Button
            variant={viewMode === "preview" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("preview")}
          >
            <Eye style={{ width: "14px", height: "14px", marginRight: "6px" }} />
            Forhåndsvisning
          </Button>
          
          <div style={{ marginLeft: "auto" }}>
            <Button onClick={handleSave} disabled={isSaving}>
              <Save style={{ width: "14px", height: "14px", marginRight: "6px" }} />
              {isSaving ? "Lagrer..." : "Lagre mal"}
            </Button>
          </div>
        </div>

        {/* Content area */}
        <Card style={{ flex: 1, overflow: "auto" }}>
          <CardContent style={{ padding: "24px", height: "100%" }}>
            {viewMode === "visual" && (
              <div style={{ 
                background: emailStyles.backgroundColor,
                borderRadius: "12px",
                padding: "32px 20px",
                minHeight: "100%"
              }}>
                <div style={{
                  maxWidth: "600px", 
                  margin: "0 auto",
                  background: emailStyles.contentBackgroundColor,
                  borderRadius: "16px",
                  padding: "32px",
                  boxShadow: "0 4px 6px rgba(0,0,0,0.05)"
                }}>
                  {blocks.length === 0 ? (
                    <div style={{ 
                      textAlign: "center", 
                      padding: "60px 20px",
                      color: "#9ca3af"
                    }}>
                      <Plus style={{ width: "48px", height: "48px", margin: "0 auto 16px", opacity: 0.5 }} />
                      <p>Legg til blokker fra panelet til venstre</p>
                    </div>
                  ) : (
                    blocks.map((block, index) => (
                      <div
                        key={block.id}
                        onClick={() => setSelectedBlockId(block.id)}
                        style={{
                          position: "relative",
                          padding: "8px",
                          margin: "4px -8px",
                          borderRadius: "8px",
                          border: selectedBlockId === block.id 
                            ? "2px solid #6366f1" 
                            : "2px solid transparent",
                          background: selectedBlockId === block.id ? `${emailStyles.accentColor}08` : "transparent",
                          cursor: "pointer",
                          transition: "all 0.15s",
                        }}
                      >
                        {/* Block controls */}
                        {selectedBlockId === block.id && (
                          <div style={{
                            position: "absolute",
                            top: "-12px",
                            right: "8px",
                            display: "flex",
                            gap: "2px",
                            background: "#fff",
                            padding: "4px",
                            borderRadius: "6px",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                            zIndex: 10,
                          }}>
                            <button
                              onClick={(e) => { e.stopPropagation(); moveBlock(block.id, "up"); }}
                              disabled={index === 0}
                              style={{ 
                                padding: "4px", 
                                border: "none", 
                                background: "transparent",
                                cursor: index === 0 ? "not-allowed" : "pointer",
                                opacity: index === 0 ? 0.3 : 1,
                                borderRadius: "4px",
                              }}
                            >
                              <ChevronUp style={{ width: "16px", height: "16px" }} />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); moveBlock(block.id, "down"); }}
                              disabled={index === blocks.length - 1}
                              style={{ 
                                padding: "4px", 
                                border: "none", 
                                background: "transparent",
                                cursor: index === blocks.length - 1 ? "not-allowed" : "pointer",
                                opacity: index === blocks.length - 1 ? 0.3 : 1,
                                borderRadius: "4px",
                              }}
                            >
                              <ChevronDown style={{ width: "16px", height: "16px" }} />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); deleteBlock(block.id); }}
                              style={{ 
                                padding: "4px", 
                                border: "none", 
                                background: "transparent",
                                cursor: "pointer",
                                color: "#ef4444",
                                borderRadius: "4px",
                              }}
                            >
                              <Trash2 style={{ width: "16px", height: "16px" }} />
                            </button>
                          </div>
                        )}

                        {/* Block content */}
                        {block.type === "logo" && (
                          <div style={{ textAlign: block.styles.textAlign as any || "center" }}>
                            <img 
                              src={block.content} 
                              alt="Logo" 
                              style={{ maxWidth: block.styles.width || "150px", height: "auto" }} 
                            />
                          </div>
                        )}
                        {block.type === "heading" && (
                          <h1 style={{ ...block.styles as any, margin: 0 }}>{block.content}</h1>
                        )}
                        {block.type === "text" && (
                          <p style={{ ...block.styles as any, margin: 0, whiteSpace: "pre-wrap" }}>{block.content}</p>
                        )}
                        {block.type === "button" && (
                          <div style={{ textAlign: block.styles.textAlign as any || "center" }}>
                            <span style={{ 
                              ...block.styles as any, 
                              display: "inline-block",
                              textDecoration: "none",
                              fontWeight: "600"
                            }}>
                              {block.content}
                            </span>
                          </div>
                        )}
                        {block.type === "image" && (
                          <img 
                            src={block.content} 
                            alt="" 
                            style={{ ...block.styles as any, maxWidth: "100%", display: "block" }} 
                          />
                        )}
                        {block.type === "divider" && (
                          <hr style={{ ...block.styles as any, border: "none" }} />
                        )}
                        {block.type === "spacer" && (
                          <div style={block.styles as any} />
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {viewMode === "html" && (
              <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
                <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "12px" }}>
                  Rediger HTML-koden direkte. Endringer her overstyrer den visuelle editoren.
                </p>
                <textarea
                  value={rawHtml}
                  onChange={(e) => setRawHtml(e.target.value)}
                  style={{
                    flex: 1,
                    width: "100%",
                    padding: "16px",
                    fontFamily: "Monaco, Consolas, monospace",
                    fontSize: "13px",
                    lineHeight: "1.5",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    resize: "none",
                    background: "#1e1e1e",
                    color: "#d4d4d4",
                  }}
                />
              </div>
            )}

            {viewMode === "preview" && (
              <iframe
                srcDoc={generateHtml()}
                style={{
                  width: "100%",
                  height: "100%",
                  border: "none",
                  borderRadius: "8px",
                  background: emailStyles.backgroundColor
                }}
                title="E-post forhåndsvisning"
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right Panel - Block Settings */}
      <div style={{ width: "280px", flexShrink: 0 }}>
        <Card style={{ height: "100%", overflow: "auto" }}>
          <CardContent style={{ padding: "16px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: "600", marginBottom: "16px", color: "#374151" }}>
              {selectedBlock ? `Rediger ${blockTypes.find(b => b.type === selectedBlock.type)?.label}` : "Velg en blokk"}
            </h3>

            {selectedBlock && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {/* Content editing for text-based blocks */}
                {(selectedBlock.type === "heading" || selectedBlock.type === "text") && (
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: "500", color: "#6b7280", marginBottom: "6px", display: "block" }}>
                      Innhold
                    </label>
                    <textarea
                      ref={(el) => { textInputRefs.current[selectedBlock.id] = el; }}
                      value={selectedBlock.content}
                      onChange={(e) => updateBlock(selectedBlock.id, { content: e.target.value })}
                      placeholder="Skriv tekst her... Klikk på en variabel for å sette den inn ved markøren."
                      style={{
                        width: "100%",
                        minHeight: selectedBlock.type === "text" ? "120px" : "60px",
                        padding: "10px 12px",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        fontSize: "14px",
                        resize: "vertical",
                        lineHeight: "1.5",
                      }}
                    />
                  </div>
                )}

                {/* Logo settings */}
                {selectedBlock.type === "logo" && (
                  <>
                    <div>
                      <label style={{ fontSize: "12px", fontWeight: "500", color: "#6b7280", marginBottom: "6px", display: "block" }}>
                        Logo URL
                      </label>
                      <Input
                        value={selectedBlock.content}
                        onChange={(e) => updateBlock(selectedBlock.id, { content: e.target.value })}
                        placeholder="https://..."
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "12px", fontWeight: "500", color: "#6b7280", marginBottom: "6px", display: "block" }}>
                        Bredde
                      </label>
                      <select
                        value={selectedBlock.styles.width || "150px"}
                        onChange={(e) => updateBlockStyle(selectedBlock.id, "width", e.target.value)}
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          border: "1px solid #e5e7eb",
                          borderRadius: "6px",
                          fontSize: "14px"
                        }}
                      >
                        <option value="100px">Liten (100px)</option>
                        <option value="150px">Medium (150px)</option>
                        <option value="200px">Stor (200px)</option>
                        <option value="250px">Ekstra stor (250px)</option>
                      </select>
                    </div>
                  </>
                )}

                {/* Button settings */}
                {selectedBlock.type === "button" && (
                  <>
                    <div>
                      <label style={{ fontSize: "12px", fontWeight: "500", color: "#6b7280", marginBottom: "6px", display: "block" }}>
                        Knappetekst
                      </label>
                      <Input
                        ref={(el) => { textInputRefs.current[selectedBlock.id] = el as any; }}
                        value={selectedBlock.content}
                        onChange={(e) => updateBlock(selectedBlock.id, { content: e.target.value })}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "12px", fontWeight: "500", color: "#6b7280", marginBottom: "6px", display: "block" }}>
                        Lenke (URL)
                      </label>
                      <Input
                        value={selectedBlock.link || ""}
                        onChange={(e) => updateBlock(selectedBlock.id, { link: e.target.value })}
                        placeholder="https://..."
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "12px", fontWeight: "500", color: "#6b7280", marginBottom: "6px", display: "block" }}>
                        Bakgrunnsfarge
                      </label>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <input
                          type="color"
                          value={selectedBlock.styles.backgroundColor || "#6366f1"}
                          onChange={(e) => updateBlockStyle(selectedBlock.id, "backgroundColor", e.target.value)}
                          style={{ width: "40px", height: "40px", border: "none", cursor: "pointer", borderRadius: "6px" }}
                        />
                        <Input
                          value={selectedBlock.styles.backgroundColor || "#6366f1"}
                          onChange={(e) => updateBlockStyle(selectedBlock.id, "backgroundColor", e.target.value)}
                          style={{ flex: 1 }}
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Image settings */}
                {selectedBlock.type === "image" && (
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: "500", color: "#6b7280", marginBottom: "6px", display: "block" }}>
                      Bilde-URL
                    </label>
                    <Input
                      value={selectedBlock.content}
                      onChange={(e) => updateBlock(selectedBlock.id, { content: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                )}

                {/* Text styling */}
                {(selectedBlock.type === "heading" || selectedBlock.type === "text") && (
                  <>
                    <div>
                      <label style={{ fontSize: "12px", fontWeight: "500", color: "#6b7280", marginBottom: "6px", display: "block" }}>
                        Tekststørrelse
                      </label>
                      <select
                        value={selectedBlock.styles.fontSize || "16px"}
                        onChange={(e) => updateBlockStyle(selectedBlock.id, "fontSize", e.target.value)}
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          border: "1px solid #e5e7eb",
                          borderRadius: "6px",
                          fontSize: "14px"
                        }}
                      >
                        <option value="12px">Liten (12px)</option>
                        <option value="14px">Normal (14px)</option>
                        <option value="16px">Medium (16px)</option>
                        <option value="18px">Stor (18px)</option>
                        <option value="24px">Overskrift (24px)</option>
                        <option value="28px">Stor overskrift (28px)</option>
                        <option value="36px">Tittel (36px)</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: "12px", fontWeight: "500", color: "#6b7280", marginBottom: "6px", display: "block" }}>
                        Tekstfarge
                      </label>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <input
                          type="color"
                          value={selectedBlock.styles.color || "#1a1a1a"}
                          onChange={(e) => updateBlockStyle(selectedBlock.id, "color", e.target.value)}
                          style={{ width: "40px", height: "40px", border: "none", cursor: "pointer", borderRadius: "6px" }}
                        />
                        <Input
                          value={selectedBlock.styles.color || "#1a1a1a"}
                          onChange={(e) => updateBlockStyle(selectedBlock.id, "color", e.target.value)}
                          style={{ flex: 1 }}
                        />
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize: "12px", fontWeight: "500", color: "#6b7280", marginBottom: "6px", display: "block" }}>
                        Justering
                      </label>
                      <div style={{ display: "flex", gap: "4px" }}>
                        {["left", "center", "right"].map(align => (
                          <button
                            key={align}
                            onClick={() => updateBlockStyle(selectedBlock.id, "textAlign", align)}
                            style={{
                              flex: 1,
                              padding: "8px",
                              border: "1px solid #e5e7eb",
                              borderRadius: "6px",
                              background: selectedBlock.styles.textAlign === align ? "#6366f1" : "#fff",
                              color: selectedBlock.styles.textAlign === align ? "#fff" : "#374151",
                              cursor: "pointer",
                              fontSize: "12px",
                              fontWeight: "500",
                            }}
                          >
                            {align === "left" ? "Venstre" : align === "center" ? "Midt" : "Høyre"}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Spacer height */}
                {selectedBlock.type === "spacer" && (
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: "500", color: "#6b7280", marginBottom: "6px", display: "block" }}>
                      Høyde
                    </label>
                    <select
                      value={selectedBlock.styles.height || "24px"}
                      onChange={(e) => updateBlockStyle(selectedBlock.id, "height", e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        border: "1px solid #e5e7eb",
                        borderRadius: "6px",
                        fontSize: "14px"
                      }}
                    >
                      <option value="12px">Liten (12px)</option>
                      <option value="24px">Normal (24px)</option>
                      <option value="40px">Medium (40px)</option>
                      <option value="60px">Stor (60px)</option>
                    </select>
                  </div>
                )}
              </div>
            )}

            {!selectedBlock && (
              <div style={{ color: "#9ca3af", fontSize: "13px", lineHeight: "1.6" }}>
                <p style={{ marginBottom: "12px" }}>
                  Klikk på en blokk i editoren for å redigere den.
                </p>
                <p>
                  <strong>Tips:</strong> Bruk HTML-modus for full kontroll over designet.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
