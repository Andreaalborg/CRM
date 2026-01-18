"use client";

import { useState } from "react";
import {
  Type,
  Mail,
  Phone,
  Hash,
  AlignLeft,
  ChevronDown,
  CheckSquare,
  Circle,
  Calendar,
  GripVertical,
  Trash2,
  Settings,
  Save,
  Plus,
  X,
  Eye,
  Smartphone,
  Monitor,
} from "lucide-react";
import {
  Button,
  Input,
  Textarea,
  Label,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Switch,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui";
import { cn, generateId } from "@/lib/utils";

interface FormField {
  id: string;
  type: string;
  name: string;
  label: string;
  placeholder?: string;
  helpText?: string;
  required: boolean;
  options?: { value: string; label: string }[];
  width: string;
}

interface FormFieldInput {
  type: string;
  name: string;
  label: string;
  placeholder?: string;
  helpText?: string;
  required: boolean;
  options?: { value: string; label: string }[];
  width: string;
}

interface FormBuilderProps {
  initialData?: {
    name: string;
    description?: string;
    fields: FormField[];
  };
  onSave: (data: {
    name: string;
    description?: string;
    fields: FormFieldInput[];
  }) => Promise<void>;
  isSaving: boolean;
}

const fieldTypes = [
  { type: "TEXT", label: "Tekst", icon: Type },
  { type: "EMAIL", label: "E-post", icon: Mail },
  { type: "PHONE", label: "Telefon", icon: Phone },
  { type: "NUMBER", label: "Nummer", icon: Hash },
  { type: "TEXTAREA", label: "Tekstområde", icon: AlignLeft },
  { type: "SELECT", label: "Nedtrekksliste", icon: ChevronDown },
  { type: "CHECKBOX", label: "Avkrysning", icon: CheckSquare },
  { type: "RADIO", label: "Radioknapper", icon: Circle },
  { type: "DATE", label: "Dato", icon: Calendar },
];

const widthOptions = [
  { value: "full", label: "Full bredde" },
  { value: "half", label: "Halv bredde" },
  { value: "third", label: "Tredjedel" },
];

export function FormBuilder({ initialData, onSave, isSaving }: FormBuilderProps) {
  const [formName, setFormName] = useState(initialData?.name || "");
  const [formDescription, setFormDescription] = useState(initialData?.description || "");
  const [fields, setFields] = useState<FormField[]>(initialData?.fields || []);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [draggedFieldType, setDraggedFieldType] = useState<string | null>(null);

  const selectedField = fields.find((f) => f.id === selectedFieldId);

  const addField = (type: string) => {
    const fieldConfig = fieldTypes.find((f) => f.type === type);
    if (!fieldConfig) return;

    const newField: FormField = {
      id: generateId(),
      type,
      name: `field_${generateId(4)}`,
      label: fieldConfig.label,
      placeholder: "",
      helpText: "",
      required: false,
      width: "full",
      options: ["SELECT", "RADIO", "CHECKBOX"].includes(type)
        ? [
            { value: "option1", label: "Alternativ 1" },
            { value: "option2", label: "Alternativ 2" },
          ]
        : undefined,
    };

    setFields([...fields, newField]);
    setSelectedFieldId(newField.id);
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    setFields(fields.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  };

  const removeField = (id: string) => {
    setFields(fields.filter((f) => f.id !== id));
    if (selectedFieldId === id) {
      setSelectedFieldId(null);
    }
  };

  const handleSave = () => {
    if (!formName.trim()) {
      alert("Gi skjemaet et navn");
      return;
    }
    if (fields.length === 0) {
      alert("Legg til minst ett felt");
      return;
    }
    onSave({
      name: formName,
      description: formDescription || undefined,
      fields: fields.map((f) => ({
        type: f.type,
        name: f.name,
        label: f.label,
        placeholder: f.placeholder || undefined,
        helpText: f.helpText || undefined,
        required: f.required,
        options: f.options,
        width: f.width,
      })),
    });
  };

  const handleDragStart = (type: string) => {
    setDraggedFieldType(type);
  };

  const handleDragEnd = () => {
    setDraggedFieldType(null);
  };

  const handleDrop = () => {
    if (draggedFieldType) {
      addField(draggedFieldType);
      setDraggedFieldType(null);
    }
  };

  // Render felt for preview
  const renderPreviewField = (field: FormField) => {
    const baseInputStyle = {
      width: "100%",
      height: "44px",
      padding: "0 16px",
      borderRadius: "8px",
      border: "2px solid #e2e8f0",
      fontSize: "14px",
      backgroundColor: "#fff",
    };

    return (
      <div key={field.id} style={{ marginBottom: "16px" }}>
        <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 500, color: "#374151" }}>
          {field.label}
          {field.required && <span style={{ color: "#ef4444", marginLeft: "4px" }}>*</span>}
        </label>
        
        {["TEXT", "EMAIL", "PHONE", "NUMBER"].includes(field.type) && (
          <input
            type={field.type === "EMAIL" ? "email" : field.type === "PHONE" ? "tel" : field.type === "NUMBER" ? "number" : "text"}
            placeholder={field.placeholder || ""}
            style={baseInputStyle}
            disabled
          />
        )}
        
        {field.type === "TEXTAREA" && (
          <textarea
            placeholder={field.placeholder || ""}
            style={{ ...baseInputStyle, height: "100px", padding: "12px 16px", resize: "none" }}
            disabled
          />
        )}
        
        {field.type === "SELECT" && (
          <select style={baseInputStyle} disabled>
            <option value="">Velg...</option>
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        )}
        
        {field.type === "DATE" && (
          <input type="date" style={baseInputStyle} disabled />
        )}
        
        {field.type === "CHECKBOX" && field.options && (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {field.options.map((opt) => (
              <label key={opt.value} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px" }}>
                <input type="checkbox" disabled style={{ width: "18px", height: "18px" }} />
                {opt.label}
              </label>
            ))}
          </div>
        )}
        
        {field.type === "RADIO" && field.options && (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {field.options.map((opt) => (
              <label key={opt.value} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px" }}>
                <input type="radio" name={field.name} disabled style={{ width: "18px", height: "18px" }} />
                {opt.label}
              </label>
            ))}
          </div>
        )}
        
        {field.helpText && (
          <p style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>{field.helpText}</p>
        )}
      </div>
    );
  };

  return (
    <div style={{ display: "flex", height: "calc(100vh - 120px)", gap: "0" }}>
      {/* Venstre sidebar - Felttyper */}
      <div style={{ 
        width: "220px", 
        borderRight: "1px solid #e2e8f0", 
        backgroundColor: "#fff", 
        padding: "16px",
        overflowY: "auto",
        flexShrink: 0
      }}>
        <h3 style={{ fontSize: "11px", fontWeight: 600, color: "#64748b", marginBottom: "12px", letterSpacing: "0.05em" }}>
          FELTTYPER
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {fieldTypes.map((fieldType) => (
            <button
              key={fieldType.type}
              draggable
              onDragStart={() => handleDragStart(fieldType.type)}
              onDragEnd={handleDragEnd}
              onClick={() => addField(fieldType.type)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "10px 12px",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                backgroundColor: "#f8fafc",
                cursor: "grab",
                fontSize: "13px",
                color: "#374151",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#818cf8";
                e.currentTarget.style.backgroundColor = "#eef2ff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#e2e8f0";
                e.currentTarget.style.backgroundColor = "#f8fafc";
              }}
            >
              <fieldType.icon style={{ width: "16px", height: "16px", color: "#64748b" }} />
              <span>{fieldType.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Midten - Builder + Preview side-by-side */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Verktøylinje */}
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "space-between", 
          padding: "12px 20px", 
          borderBottom: "1px solid #e2e8f0", 
          backgroundColor: "#fff" 
        }}>
          <input
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder="Skriv inn skjemanavn..."
            style={{
              flex: 1,
              maxWidth: "300px",
              fontSize: "18px",
              fontWeight: 600,
              border: "none",
              outline: "none",
              backgroundColor: "transparent",
              color: "#0f172a",
            }}
          />
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "4px", 
              padding: "4px", 
              backgroundColor: "#f1f5f9", 
              borderRadius: "8px" 
            }}>
              <button
                onClick={() => setPreviewMode("desktop")}
                style={{
                  padding: "6px 10px",
                  borderRadius: "6px",
                  border: "none",
                  backgroundColor: previewMode === "desktop" ? "#fff" : "transparent",
                  boxShadow: previewMode === "desktop" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "12px",
                  color: previewMode === "desktop" ? "#0f172a" : "#64748b",
                }}
              >
                <Monitor style={{ width: "14px", height: "14px" }} />
              </button>
              <button
                onClick={() => setPreviewMode("mobile")}
                style={{
                  padding: "6px 10px",
                  borderRadius: "6px",
                  border: "none",
                  backgroundColor: previewMode === "mobile" ? "#fff" : "transparent",
                  boxShadow: previewMode === "mobile" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "12px",
                  color: previewMode === "mobile" ? "#0f172a" : "#64748b",
                }}
              >
                <Smartphone style={{ width: "14px", height: "14px" }} />
              </button>
            </div>
            <Button onClick={handleSave} disabled={isSaving}>
              <Save style={{ width: "16px", height: "16px" }} />
              {isSaving ? "Lagrer..." : "Lagre skjema"}
            </Button>
          </div>
        </div>

        {/* Builder og Preview områder */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          {/* Builder område */}
          <div
            style={{
              flex: 1,
              padding: "24px",
              overflowY: "auto",
              backgroundColor: draggedFieldType ? "#eef2ff" : "#f8fafc",
              transition: "background-color 0.2s ease",
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            <div style={{ maxWidth: "600px", margin: "0 auto" }}>
              {/* Beskrivelse */}
              <textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Legg til en beskrivelse (valgfritt)..."
                style={{
                  width: "100%",
                  padding: "12px 0",
                  border: "none",
                  outline: "none",
                  backgroundColor: "transparent",
                  resize: "none",
                  fontSize: "14px",
                  color: "#64748b",
                  marginBottom: "20px",
                }}
              />

              {/* Felt */}
              {fields.length === 0 ? (
                <div
                  style={{
                    border: `2px dashed ${draggedFieldType ? "#818cf8" : "#cbd5e1"}`,
                    borderRadius: "12px",
                    padding: "48px",
                    textAlign: "center",
                    backgroundColor: draggedFieldType ? "#eef2ff" : "#fff",
                    transition: "all 0.2s ease",
                  }}
                >
                  <Plus style={{ width: "40px", height: "40px", color: "#94a3b8", margin: "0 auto 16px" }} />
                  <p style={{ color: "#64748b", fontSize: "14px" }}>
                    Dra felt hit eller klikk på felttyper til venstre
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {fields.map((field, index) => (
                    <div
                      key={field.id}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "8px",
                        padding: "14px",
                        borderRadius: "10px",
                        border: `2px solid ${selectedFieldId === field.id ? "#818cf8" : "#e2e8f0"}`,
                        backgroundColor: selectedFieldId === field.id ? "#eef2ff" : "#fff",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                      onClick={() => setSelectedFieldId(field.id)}
                    >
                      <button
                        style={{
                          padding: "4px",
                          cursor: "grab",
                          color: "#94a3b8",
                          background: "none",
                          border: "none",
                        }}
                      >
                        <GripVertical style={{ width: "16px", height: "16px" }} />
                      </button>

                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                          <span style={{ fontSize: "14px", fontWeight: 500, color: "#0f172a" }}>{field.label}</span>
                          {field.required && (
                            <span style={{ fontSize: "11px", color: "#ef4444" }}>*</span>
                          )}
                          <span style={{ 
                            fontSize: "11px", 
                            color: "#64748b", 
                            backgroundColor: "#f1f5f9", 
                            padding: "2px 8px", 
                            borderRadius: "4px" 
                          }}>
                            {fieldTypes.find((f) => f.type === field.type)?.label}
                          </span>
                        </div>
                        {field.placeholder && (
                          <p style={{ fontSize: "12px", color: "#94a3b8" }}>{field.placeholder}</p>
                        )}
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeField(field.id);
                        }}
                        style={{
                          padding: "6px",
                          color: "#94a3b8",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          borderRadius: "6px",
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.color = "#ef4444"}
                        onMouseLeave={(e) => e.currentTarget.style.color = "#94a3b8"}
                      >
                        <Trash2 style={{ width: "16px", height: "16px" }} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Live Preview */}
          <div style={{ 
            width: previewMode === "mobile" ? "375px" : "400px",
            borderLeft: "1px solid #e2e8f0", 
            backgroundColor: "#f1f5f9",
            padding: "24px",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}>
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "8px", 
              marginBottom: "16px",
              alignSelf: "flex-start"
            }}>
              <Eye style={{ width: "16px", height: "16px", color: "#64748b" }} />
              <span style={{ fontSize: "12px", fontWeight: 600, color: "#64748b", letterSpacing: "0.05em" }}>
                LIVE FORHÅNDSVISNING
              </span>
            </div>
            
            <div style={{ 
              width: "100%",
              maxWidth: previewMode === "mobile" ? "320px" : "100%",
              backgroundColor: "#fff",
              borderRadius: "12px",
              boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)",
              overflow: "hidden",
            }}>
              <div style={{ 
                padding: "20px 24px", 
                borderBottom: "1px solid #e2e8f0",
                background: "linear-gradient(135deg, #4F46E5, #7C3AED)",
              }}>
                <h3 style={{ fontSize: "18px", fontWeight: 600, color: "#fff", marginBottom: "4px" }}>
                  {formName || "Skjemanavn"}
                </h3>
                {formDescription && (
                  <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.8)", margin: 0 }}>{formDescription}</p>
                )}
              </div>
              
              <div style={{ padding: "24px" }}>
                {fields.length === 0 ? (
                  <p style={{ fontSize: "14px", color: "#94a3b8", textAlign: "center", padding: "24px 0" }}>
                    Legg til felt for å se forhåndsvisning
                  </p>
                ) : (
                  <>
                    {fields.map(renderPreviewField)}
                    <button
                      style={{
                        width: "100%",
                        padding: "12px 24px",
                        backgroundColor: "#4F46E5",
                        color: "#fff",
                        border: "none",
                        borderRadius: "8px",
                        fontSize: "14px",
                        fontWeight: 600,
                        cursor: "pointer",
                        marginTop: "8px",
                      }}
                    >
                      Send inn
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Høyre sidebar - Feltinnstillinger */}
      {selectedField && (
        <div style={{ 
          width: "280px", 
          borderLeft: "1px solid #e2e8f0", 
          backgroundColor: "#fff", 
          padding: "16px",
          overflowY: "auto",
          flexShrink: 0
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" }}>
              <Settings style={{ width: "16px", height: "16px" }} />
              Feltinnstillinger
            </h3>
            <button
              onClick={() => setSelectedFieldId(null)}
              style={{ padding: "4px", color: "#94a3b8", background: "none", border: "none", cursor: "pointer" }}
            >
              <X style={{ width: "16px", height: "16px" }} />
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Label */}
            <div>
              <Label>Etikett</Label>
              <Input
                value={selectedField.label}
                onChange={(e) => updateField(selectedField.id, { label: e.target.value })}
              />
            </div>

            {/* Feltnavn */}
            <div>
              <Label>Feltnavn (intern)</Label>
              <Input
                value={selectedField.name}
                onChange={(e) =>
                  updateField(selectedField.id, {
                    name: e.target.value.replace(/\s/g, "_").toLowerCase(),
                  })
                }
              />
            </div>

            {/* Placeholder */}
            {["TEXT", "EMAIL", "PHONE", "NUMBER", "TEXTAREA"].includes(selectedField.type) && (
              <div>
                <Label>Plassholder</Label>
                <Input
                  value={selectedField.placeholder || ""}
                  onChange={(e) => updateField(selectedField.id, { placeholder: e.target.value })}
                  placeholder="f.eks. Skriv her..."
                />
              </div>
            )}

            {/* Hjelpetekst */}
            <div>
              <Label>Hjelpetekst</Label>
              <Input
                value={selectedField.helpText || ""}
                onChange={(e) => updateField(selectedField.id, { helpText: e.target.value })}
                placeholder="Valgfri hjelpetekst"
              />
            </div>

            {/* Bredde */}
            <div>
              <Label>Bredde</Label>
              <Select
                value={selectedField.width}
                onValueChange={(value) => updateField(selectedField.id, { width: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {widthOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Påkrevd */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Label style={{ marginBottom: 0 }}>Påkrevd felt</Label>
              <Switch
                checked={selectedField.required}
                onCheckedChange={(checked) => updateField(selectedField.id, { required: checked })}
              />
            </div>

            {/* Alternativer for SELECT/RADIO/CHECKBOX */}
            {["SELECT", "RADIO", "CHECKBOX"].includes(selectedField.type) && selectedField.options && (
              <div>
                <Label>Alternativer</Label>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
                  {selectedField.options.map((opt, idx) => (
                    <div key={idx} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <Input
                        value={opt.label}
                        onChange={(e) => {
                          const newOptions = [...selectedField.options!];
                          newOptions[idx] = {
                            value: e.target.value.toLowerCase().replace(/\s/g, "_"),
                            label: e.target.value,
                          };
                          updateField(selectedField.id, { options: newOptions });
                        }}
                        style={{ flex: 1 }}
                      />
                      <button
                        onClick={() => {
                          const newOptions = selectedField.options!.filter((_, i) => i !== idx);
                          updateField(selectedField.id, { options: newOptions });
                        }}
                        style={{
                          padding: "8px",
                          color: "#94a3b8",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        <Trash2 style={{ width: "14px", height: "14px" }} />
                      </button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newOptions = [
                        ...selectedField.options!,
                        {
                          value: `option${selectedField.options!.length + 1}`,
                          label: `Alternativ ${selectedField.options!.length + 1}`,
                        },
                      ];
                      updateField(selectedField.id, { options: newOptions });
                    }}
                    style={{ marginTop: "4px" }}
                  >
                    <Plus style={{ width: "14px", height: "14px" }} />
                    Legg til
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
