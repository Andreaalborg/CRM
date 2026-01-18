"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, Button, Input } from "@/components/ui";
import { 
  Type, Image, MousePointer, Minus, Layout, 
  Trash2, GripVertical, ChevronUp, ChevronDown,
  Plus, Eye, Code, Save, Palette
} from "lucide-react";

// Block types
type BlockType = "text" | "heading" | "button" | "image" | "divider" | "spacer";

interface EmailBlock {
  id: string;
  type: BlockType;
  content: string;
  styles: Record<string, string>;
}

interface EmailTemplateEditorProps {
  initialSubject?: string;
  initialBlocks?: EmailBlock[];
  onSave?: (data: { subject: string; blocks: EmailBlock[]; html: string }) => void;
  variables?: string[];
}

const defaultBlocks: EmailBlock[] = [
  {
    id: "1",
    type: "heading",
    content: "Hei {{navn}}!",
    styles: { fontSize: "24px", fontWeight: "bold", color: "#1a1a1a", textAlign: "center" }
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
      padding: "12px 24px",
      borderRadius: "8px",
      textAlign: "center"
    }
  }
];

const blockTypes: { type: BlockType; label: string; icon: typeof Type }[] = [
  { type: "heading", label: "Overskrift", icon: Type },
  { type: "text", label: "Tekst", icon: Layout },
  { type: "button", label: "Knapp", icon: MousePointer },
  { type: "image", label: "Bilde", icon: Image },
  { type: "divider", label: "Skillelinje", icon: Minus },
  { type: "spacer", label: "Mellomrom", icon: Layout },
];

export function EmailTemplateEditor({ 
  initialSubject = "", 
  initialBlocks,
  onSave,
  variables = ["navn", "epost", "telefon", "bedrift"]
}: EmailTemplateEditorProps) {
  const [subject, setSubject] = useState(initialSubject);
  const [blocks, setBlocks] = useState<EmailBlock[]>(initialBlocks || defaultBlocks);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"edit" | "preview" | "code">("edit");
  const [isSaving, setIsSaving] = useState(false);

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
      case "heading": 
        return { fontSize: "24px", fontWeight: "bold", color: "#1a1a1a", textAlign: "left" };
      case "text": 
        return { fontSize: "16px", color: "#4a4a4a", lineHeight: "1.6" };
      case "button": 
        return { 
          backgroundColor: "#6366f1", 
          color: "#ffffff", 
          padding: "12px 24px",
          borderRadius: "8px",
          textAlign: "center"
        };
      case "image":
        return { width: "100%", borderRadius: "8px" };
      case "divider":
        return { borderTop: "1px solid #e5e5e5", margin: "20px 0" };
      case "spacer":
        return { height: "20px" };
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

  const generateHtml = useCallback(() => {
    const blocksHtml = blocks.map(block => {
      const styleString = Object.entries(block.styles)
        .map(([key, value]) => `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value}`)
        .join('; ');

      switch (block.type) {
        case "heading":
          return `<h1 style="${styleString}">${block.content}</h1>`;
        case "text":
          return `<p style="${styleString}">${block.content}</p>`;
        case "button":
          return `<div style="text-align: center; margin: 20px 0;">
            <a href="#" style="${styleString}; display: inline-block; text-decoration: none;">${block.content}</a>
          </div>`;
        case "image":
          return `<img src="${block.content}" alt="" style="${styleString}" />`;
        case "divider":
          return `<hr style="${styleString}" />`;
        case "spacer":
          return `<div style="${styleString}"></div>`;
        default:
          return "";
      }
    }).join("\n");

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background-color: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      ${blocksHtml}
    </div>
    <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
      <p>Denne e-posten ble sendt fra vårt system.</p>
    </div>
  </div>
</body>
</html>`;
  }, [blocks, subject]);

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

  const insertVariable = (variable: string) => {
    if (!selectedBlockId) return;
    const block = blocks.find(b => b.id === selectedBlockId);
    if (!block || block.type === "divider" || block.type === "spacer") return;
    
    updateBlock(selectedBlockId, {
      content: block.content + `{{${variable}}}`
    });
  };

  return (
    <div style={{ display: "flex", gap: "24px", height: "calc(100vh - 200px)", minHeight: "600px" }}>
      {/* Left Panel - Block Library */}
      <div style={{ width: "200px", flexShrink: 0 }}>
        <Card>
          <CardContent style={{ padding: "16px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: "600", marginBottom: "12px", color: "#374151" }}>
              Blokker
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {blockTypes.map(({ type, label, icon: Icon }) => (
                <button
                  key={type}
                  onClick={() => addBlock(type)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "10px 12px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    background: "#fff",
                    cursor: "pointer",
                    fontSize: "13px",
                    color: "#374151",
                    transition: "all 0.15s",
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
                  <Icon style={{ width: "16px", height: "16px", color: "#6366f1" }} />
                  {label}
                </button>
              ))}
            </div>

            <div style={{ marginTop: "24px" }}>
              <h3 style={{ fontSize: "14px", fontWeight: "600", marginBottom: "12px", color: "#374151" }}>
                Variabler
              </h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {variables.map(variable => (
                  <button
                    key={variable}
                    onClick={() => insertVariable(variable)}
                    disabled={!selectedBlockId}
                    style={{
                      padding: "4px 8px",
                      fontSize: "11px",
                      background: selectedBlockId ? "#e0e7ff" : "#f3f4f6",
                      color: selectedBlockId ? "#4338ca" : "#9ca3af",
                      border: "none",
                      borderRadius: "4px",
                      cursor: selectedBlockId ? "pointer" : "not-allowed",
                    }}
                  >
                    {`{{${variable}}}`}
                  </button>
                ))}
              </div>
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
            placeholder="Skriv emnefelt her..."
            style={{ fontSize: "16px" }}
          />
        </div>

        {/* View mode tabs */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
          <Button
            variant={viewMode === "edit" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("edit")}
          >
            <Layout style={{ width: "14px", height: "14px", marginRight: "6px" }} />
            Rediger
          </Button>
          <Button
            variant={viewMode === "preview" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("preview")}
          >
            <Eye style={{ width: "14px", height: "14px", marginRight: "6px" }} />
            Forhåndsvisning
          </Button>
          <Button
            variant={viewMode === "code" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("code")}
          >
            <Code style={{ width: "14px", height: "14px", marginRight: "6px" }} />
            HTML
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
            {viewMode === "edit" && (
              <div style={{ 
                maxWidth: "600px", 
                margin: "0 auto",
                background: "#fff",
                borderRadius: "12px",
                padding: "24px",
                boxShadow: "0 0 0 1px #e5e7eb"
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
                        padding: "12px",
                        margin: "8px 0",
                        borderRadius: "8px",
                        border: selectedBlockId === block.id 
                          ? "2px solid #6366f1" 
                          : "2px solid transparent",
                        background: selectedBlockId === block.id ? "#f5f3ff" : "transparent",
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
                          gap: "4px",
                          background: "#fff",
                          padding: "4px",
                          borderRadius: "6px",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
                        }}>
                          <button
                            onClick={(e) => { e.stopPropagation(); moveBlock(block.id, "up"); }}
                            disabled={index === 0}
                            style={{ 
                              padding: "4px", 
                              border: "none", 
                              background: "transparent",
                              cursor: index === 0 ? "not-allowed" : "pointer",
                              opacity: index === 0 ? 0.3 : 1
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
                              opacity: index === blocks.length - 1 ? 0.3 : 1
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
                              color: "#ef4444"
                            }}
                          >
                            <Trash2 style={{ width: "16px", height: "16px" }} />
                          </button>
                        </div>
                      )}

                      {/* Block content */}
                      {block.type === "heading" && (
                        <h1 style={{ ...block.styles as any, margin: 0 }}>{block.content}</h1>
                      )}
                      {block.type === "text" && (
                        <p style={{ ...block.styles as any, margin: 0 }}>{block.content}</p>
                      )}
                      {block.type === "button" && (
                        <div style={{ textAlign: block.styles.textAlign as any || "center" }}>
                          <span style={{ 
                            ...block.styles as any, 
                            display: "inline-block",
                            textDecoration: "none"
                          }}>
                            {block.content}
                          </span>
                        </div>
                      )}
                      {block.type === "image" && (
                        <img 
                          src={block.content} 
                          alt="" 
                          style={{ ...block.styles as any, maxWidth: "100%" }} 
                        />
                      )}
                      {block.type === "divider" && (
                        <hr style={block.styles as any} />
                      )}
                      {block.type === "spacer" && (
                        <div style={block.styles as any} />
                      )}
                    </div>
                  ))
                )}
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
                  background: "#f4f4f5"
                }}
                title="E-post forhåndsvisning"
              />
            )}

            {viewMode === "code" && (
              <pre style={{
                background: "#1e1e1e",
                color: "#d4d4d4",
                padding: "20px",
                borderRadius: "8px",
                overflow: "auto",
                fontSize: "13px",
                lineHeight: "1.5",
                height: "100%",
                margin: 0
              }}>
                {generateHtml()}
              </pre>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right Panel - Block Settings */}
      <div style={{ width: "280px", flexShrink: 0 }}>
        <Card>
          <CardContent style={{ padding: "16px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: "600", marginBottom: "16px", color: "#374151" }}>
              {selectedBlock ? "Blokkinnstillinger" : "Velg en blokk"}
            </h3>

            {selectedBlock && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {/* Content editing */}
                {(selectedBlock.type === "heading" || selectedBlock.type === "text") && (
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: "500", color: "#6b7280", marginBottom: "6px", display: "block" }}>
                      Innhold
                    </label>
                    <textarea
                      value={selectedBlock.content}
                      onChange={(e) => updateBlock(selectedBlock.id, { content: e.target.value })}
                      style={{
                        width: "100%",
                        minHeight: "80px",
                        padding: "8px 12px",
                        border: "1px solid #e5e7eb",
                        borderRadius: "6px",
                        fontSize: "14px",
                        resize: "vertical"
                      }}
                    />
                  </div>
                )}

                {selectedBlock.type === "button" && (
                  <>
                    <div>
                      <label style={{ fontSize: "12px", fontWeight: "500", color: "#6b7280", marginBottom: "6px", display: "block" }}>
                        Knappetekst
                      </label>
                      <Input
                        value={selectedBlock.content}
                        onChange={(e) => updateBlock(selectedBlock.id, { content: e.target.value })}
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
                          style={{ width: "40px", height: "40px", border: "none", cursor: "pointer" }}
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

                {/* Common style settings */}
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
                        <option value="32px">Stor overskrift (32px)</option>
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
                          style={{ width: "40px", height: "40px", border: "none", cursor: "pointer" }}
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
                              textTransform: "capitalize"
                            }}
                          >
                            {align === "left" ? "Venstre" : align === "center" ? "Midt" : "Høyre"}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {selectedBlock.type === "spacer" && (
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: "500", color: "#6b7280", marginBottom: "6px", display: "block" }}>
                      Høyde
                    </label>
                    <select
                      value={selectedBlock.styles.height || "20px"}
                      onChange={(e) => updateBlockStyle(selectedBlock.id, "height", e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        border: "1px solid #e5e7eb",
                        borderRadius: "6px",
                        fontSize: "14px"
                      }}
                    >
                      <option value="10px">Liten (10px)</option>
                      <option value="20px">Normal (20px)</option>
                      <option value="40px">Medium (40px)</option>
                      <option value="60px">Stor (60px)</option>
                    </select>
                  </div>
                )}
              </div>
            )}

            {!selectedBlock && (
              <p style={{ color: "#9ca3af", fontSize: "13px" }}>
                Klikk på en blokk i editoren for å redigere den, eller legg til nye blokker fra panelet til venstre.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

