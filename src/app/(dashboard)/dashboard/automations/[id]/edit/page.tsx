"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle, Button, Input } from "@/components/ui";
import { 
  ArrowLeft, Plus, Zap, Mail, Clock, CheckCircle, 
  ArrowRight, Trash2, Settings, AlertCircle,
  Calendar, Users, Filter, Bell, GitBranch
} from "lucide-react";
import Link from "next/link";

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
}

interface Form {
  id: string;
  name: string;
  slug: string;
}

interface ActionConfig {
  templateId?: string;
  delayMinutes?: number;
  sendToSubmitter?: boolean;
  emailField?: string;
  customEmail?: string;
  emailTemplateId?: string;
  [key: string]: unknown;
}

interface Action {
  id: string;
  type: string;
  config: ActionConfig;
}

interface AutomationData {
  id: string;
  name: string;
  description?: string;
  triggerType: string;
  triggerConfig: Record<string, unknown>;
  formId?: string;
  status: string;
  actions: Array<{
    id: string;
    type: string;
    config: ActionConfig;
    emailTemplateId?: string;
  }>;
}

const triggerTypes = [
  { value: "FORM_SUBMISSION", label: "Skjemainnsending", description: "Når noen fyller ut et skjema", icon: Users, color: "#6366f1" },
  { value: "FIELD_VALUE", label: "Feltverdi", description: "Når et felt har en spesifikk verdi", icon: Filter, color: "#8b5cf6" },
  { value: "SUBMISSION_STATUS", label: "Statusendring", description: "Når en lead endrer status", icon: CheckCircle, color: "#10b981" },
  { value: "DATE_FIELD", label: "Datofelt", description: "Basert på dato (bursdag, jubileum, etc.)", icon: Calendar, color: "#f59e0b" },
  { value: "INACTIVITY", label: "Inaktivitet", description: "Når en lead ikke har aktivitet på X dager", icon: AlertCircle, color: "#ef4444" },
  { value: "RECURRING", label: "Gjentakende", description: "Kjør regelmessig (daglig, ukentlig, etc.)", icon: Clock, color: "#06b6d4" },
];

const actionTypes = [
  { value: "SEND_EMAIL", label: "Send e-post", description: "Send en e-post til mottaker", icon: Mail, color: "#6366f1" },
  { value: "WAIT_DELAY", label: "Vent", description: "Vent en periode før neste handling", icon: Clock, color: "#f59e0b" },
  { value: "UPDATE_SUBMISSION_STATUS", label: "Oppdater status", description: "Endre status på lead", icon: CheckCircle, color: "#10b981" },
  { value: "SEND_NOTIFICATION", label: "Send varsel", description: "Send intern varsling", icon: Bell, color: "#8b5cf6" },
  { value: "CONDITION", label: "Betingelse", description: "Hvis/ellers basert på data", icon: GitBranch, color: "#06b6d4" },
];

export default function EditAutomationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [triggerType, setTriggerType] = useState("");
  const [triggerConfig, setTriggerConfig] = useState<Record<string, unknown>>({});
  const [actions, setActions] = useState<Action[]>([]);
  const [forms, setForms] = useState<Form[]>([]);
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [selectedFormId, setSelectedFormId] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [step, setStep] = useState(1);
  const [status, setStatus] = useState("DRAFT");

  useEffect(() => {
    async function fetchData() {
      try {
        const [automationRes, formsRes, templatesRes] = await Promise.all([
          fetch(`/api/automations/${id}`),
          fetch("/api/forms"),
          fetch("/api/email-templates"),
        ]);
        
        if (automationRes.ok) {
          const data: AutomationData = await automationRes.json();
          setName(data.name);
          setDescription(data.description || "");
          setTriggerType(data.triggerType);
          setTriggerConfig(data.triggerConfig || {});
          setSelectedFormId(data.formId || "");
          setStatus(data.status);
          setActions(data.actions.map(a => ({
            id: a.id,
            type: a.type,
            config: { ...a.config, emailTemplateId: a.emailTemplateId }
          })));
        }
        
        if (formsRes.ok) {
          const formsData = await formsRes.json();
          setForms(formsData);
        }
        
        if (templatesRes.ok) {
          const templatesData = await templatesRes.json();
          setEmailTemplates(templatesData);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [id]);

  function addAction(type: string) {
    const newAction: Action = {
      id: crypto.randomUUID(),
      type,
      config: {},
    };
    setActions([...actions, newAction]);
  }

  function updateAction(actionId: string, config: Record<string, unknown>) {
    setActions(actions.map(a => a.id === actionId ? { ...a, config } : a));
  }

  function removeAction(actionId: string) {
    setActions(actions.filter(a => a.id !== actionId));
  }

  async function handleSave(newStatus?: string) {
    if (!name || !triggerType) {
      alert("Vennligst fyll ut navn og velg en trigger");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/automations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          triggerType,
          triggerConfig: {
            ...triggerConfig,
            formId: selectedFormId || undefined,
          },
          formId: selectedFormId || undefined,
          status: newStatus || status,
          actions: actions.map((action, index) => ({
            type: action.type,
            order: index,
            config: action.config,
            emailTemplateId: action.config.emailTemplateId as string | undefined,
          })),
        }),
      });

      if (response.ok) {
        router.push("/dashboard/automations");
      } else {
        const error = await response.json();
        alert(error.error || "Kunne ikke lagre automasjon");
      }
    } catch (error) {
      console.error("Error saving automation:", error);
      alert("Noe gikk galt");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <div className="spinner" />
        <p style={{ marginTop: "16px", color: "#6b7280" }}>Laster automasjon...</p>
      </div>
    );
  }

  return (
    <>
      <Header 
        title="Rediger automasjon"
        description={name}
      />
      
      <div style={{ padding: "24px", maxWidth: "1000px", margin: "0 auto" }}>
        <Link 
          href="/dashboard/automations" 
          style={{ 
            display: "inline-flex", 
            alignItems: "center", 
            gap: "8px", 
            marginBottom: "24px", 
            color: "#6366f1", 
            textDecoration: "none" 
          }}
        >
          <ArrowLeft style={{ width: "16px", height: "16px" }} />
          Tilbake til automasjoner
        </Link>

        {/* Progress */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "32px" }}>
          {[1, 2, 3].map((s) => (
            <div key={s} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                background: step >= s ? "#6366f1" : "#e2e8f0",
                color: step >= s ? "white" : "#6b7280",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "600",
                fontSize: "14px",
              }}>
                {s}
              </div>
              <span style={{ fontWeight: step === s ? "600" : "400", color: step === s ? "#1f2937" : "#6b7280" }}>
                {s === 1 ? "Trigger" : s === 2 ? "Handlinger" : "Oversikt"}
              </span>
              {s < 3 && <ArrowRight style={{ width: "16px", height: "16px", color: "#d1d5db" }} />}
            </div>
          ))}
        </div>

        {/* Step 1: Trigger */}
        {step === 1 && (
          <div>
            <Card style={{ marginBottom: "24px" }}>
              <CardHeader>
                <CardTitle>Grunnleggende informasjon</CardTitle>
              </CardHeader>
              <CardContent>
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div>
                    <label style={{ display: "block", fontWeight: "500", marginBottom: "6px" }}>
                      Navn på automasjon *
                    </label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="F.eks. Velkomst-e-post til nye leads"
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontWeight: "500", marginBottom: "6px" }}>
                      Beskrivelse (valgfritt)
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Beskriv hva denne automasjonen gjør..."
                      style={{
                        width: "100%",
                        padding: "12px",
                        borderRadius: "8px",
                        border: "1px solid #e2e8f0",
                        fontSize: "14px",
                        minHeight: "80px",
                        resize: "vertical",
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card style={{ marginBottom: "24px" }}>
              <CardHeader>
                <CardTitle style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Zap style={{ width: "20px", height: "20px", color: "#f59e0b" }} />
                  Velg trigger
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }}>
                  {triggerTypes.map((trigger) => (
                    <button
                      key={trigger.value}
                      onClick={() => setTriggerType(trigger.value)}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "12px",
                        padding: "16px",
                        borderRadius: "12px",
                        border: triggerType === trigger.value ? `2px solid ${trigger.color}` : "1px solid #e2e8f0",
                        background: triggerType === trigger.value ? `${trigger.color}10` : "white",
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                    >
                      <div style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "10px",
                        background: `${trigger.color}20`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}>
                        <trigger.icon style={{ width: "20px", height: "20px", color: trigger.color }} />
                      </div>
                      <div>
                        <p style={{ fontWeight: "600", margin: "0 0 4px 0" }}>{trigger.label}</p>
                        <p style={{ fontSize: "12px", color: "#6b7280", margin: 0 }}>{trigger.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {triggerType && (
              <Card style={{ marginBottom: "24px" }}>
                <CardHeader>
                  <CardTitle>
                    <Settings style={{ width: "20px", height: "20px", display: "inline", marginRight: "8px" }} />
                    Konfigurer trigger
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {triggerType === "FORM_SUBMISSION" && (
                    <div>
                      <label style={{ display: "block", fontWeight: "500", marginBottom: "6px" }}>Velg skjema</label>
                      <select
                        value={selectedFormId}
                        onChange={(e) => setSelectedFormId(e.target.value)}
                        style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "14px" }}
                      >
                        <option value="">Alle skjemaer</option>
                        {forms.map((form) => (
                          <option key={form.id} value={form.id}>{form.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  {triggerType === "SUBMISSION_STATUS" && (
                    <div>
                      <label style={{ display: "block", fontWeight: "500", marginBottom: "6px" }}>Når status endres til</label>
                      <select
                        value={triggerConfig.targetStatus as string || ""}
                        onChange={(e) => setTriggerConfig({ ...triggerConfig, targetStatus: e.target.value })}
                        style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "14px" }}
                      >
                        <option value="">Velg status</option>
                        <option value="CONTACTED">Kontaktet</option>
                        <option value="QUALIFIED">Kvalifisert</option>
                        <option value="CONVERTED">Konvertert</option>
                        <option value="LOST">Tapt</option>
                      </select>
                    </div>
                  )}
                  {triggerType === "DATE_FIELD" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                      <div>
                        <label style={{ display: "block", fontWeight: "500", marginBottom: "6px" }}>Velg datofelt</label>
                        <Input
                          value={triggerConfig.dateField as string || ""}
                          onChange={(e) => setTriggerConfig({ ...triggerConfig, dateField: e.target.value })}
                          placeholder="F.eks. bursdag, oppstartsdato"
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", fontWeight: "500", marginBottom: "6px" }}>Dager før/etter dato</label>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                          <Input
                            type="number"
                            value={triggerConfig.daysOffset as number || 0}
                            onChange={(e) => setTriggerConfig({ ...triggerConfig, daysOffset: parseInt(e.target.value) })}
                            style={{ width: "100px" }}
                          />
                          <span style={{ color: "#6b7280" }}>dager</span>
                        </div>
                      </div>
                    </div>
                  )}
                  {triggerType === "INACTIVITY" && (
                    <div>
                      <label style={{ display: "block", fontWeight: "500", marginBottom: "6px" }}>Antall dager uten aktivitet</label>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <Input
                          type="number"
                          value={triggerConfig.inactiveDays as number || 7}
                          onChange={(e) => setTriggerConfig({ ...triggerConfig, inactiveDays: parseInt(e.target.value) })}
                          style={{ width: "100px" }}
                        />
                        <span style={{ color: "#6b7280" }}>dager</span>
                      </div>
                    </div>
                  )}
                  {triggerType === "RECURRING" && (
                    <div>
                      <label style={{ display: "block", fontWeight: "500", marginBottom: "6px" }}>Frekvens</label>
                      <select
                        value={triggerConfig.frequency as string || ""}
                        onChange={(e) => setTriggerConfig({ ...triggerConfig, frequency: e.target.value })}
                        style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "14px" }}
                      >
                        <option value="">Velg frekvens</option>
                        <option value="daily">Daglig</option>
                        <option value="weekly">Ukentlig</option>
                        <option value="monthly">Månedlig</option>
                        <option value="yearly">Årlig</option>
                      </select>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <Button onClick={() => setStep(2)} disabled={!name || !triggerType}>
                Neste: Handlinger
                <ArrowRight style={{ width: "16px", height: "16px", marginLeft: "8px" }} />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Actions */}
        {step === 2 && (
          <div>
            <Card style={{ marginBottom: "24px" }}>
              <CardHeader>
                <CardTitle>Workflow</CardTitle>
              </CardHeader>
              <CardContent>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "16px",
                  background: "#fef3c7",
                  borderRadius: "12px",
                  marginBottom: "16px",
                }}>
                  <Zap style={{ width: "24px", height: "24px", color: "#f59e0b" }} />
                  <div>
                    <p style={{ fontWeight: "600", margin: 0 }}>
                      Trigger: {triggerTypes.find(t => t.value === triggerType)?.label}
                    </p>
                  </div>
                </div>

                {actions.map((action, index) => (
                  <div key={action.id}>
                    <div style={{ display: "flex", justifyContent: "center", padding: "8px 0" }}>
                      <div style={{ width: "2px", height: "24px", background: "#e2e8f0" }} />
                    </div>
                    <div style={{ padding: "16px", background: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          {(() => {
                            const actionType = actionTypes.find(a => a.value === action.type);
                            const Icon = actionType?.icon || Mail;
                            return (
                              <div style={{
                                width: "36px",
                                height: "36px",
                                borderRadius: "8px",
                                background: `${actionType?.color || "#6366f1"}20`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}>
                                <Icon style={{ width: "18px", height: "18px", color: actionType?.color || "#6366f1" }} />
                              </div>
                            );
                          })()}
                          <p style={{ fontWeight: "600", margin: 0 }}>
                            {index + 1}. {actionTypes.find(a => a.value === action.type)?.label}
                          </p>
                        </div>
                        <button
                          onClick={() => removeAction(action.id)}
                          style={{ padding: "6px", borderRadius: "6px", border: "none", background: "transparent", cursor: "pointer", color: "#ef4444" }}
                        >
                          <Trash2 style={{ width: "16px", height: "16px" }} />
                        </button>
                      </div>

                      {action.type === "SEND_EMAIL" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "4px" }}>E-postmal</label>
                            <select
                              value={action.config.emailTemplateId as string || ""}
                              onChange={(e) => updateAction(action.id, { ...action.config, emailTemplateId: e.target.value })}
                              style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "14px" }}
                            >
                              <option value="">Velg e-postmal</option>
                              {emailTemplates.map((template) => (
                                <option key={template.id} value={template.id}>{template.name}</option>
                              ))}
                            </select>
                          </div>
                          <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px" }}>
                            <input
                              type="checkbox"
                              checked={action.config.sendToSubmitter as boolean || false}
                              onChange={(e) => updateAction(action.id, { ...action.config, sendToSubmitter: e.target.checked })}
                            />
                            Send til personen som fylte ut skjemaet
                          </label>
                          {action.config.sendToSubmitter && (
                            <div>
                              <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "4px" }}>E-postfelt i skjema</label>
                              <Input
                                value={action.config.emailField as string || ""}
                                onChange={(e) => updateAction(action.id, { ...action.config, emailField: e.target.value })}
                                placeholder="F.eks. email eller epost"
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {action.type === "WAIT_DELAY" && (
                        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                          <Input
                            type="number"
                            value={action.config.delayAmount as number || 1}
                            onChange={(e) => updateAction(action.id, { ...action.config, delayAmount: parseInt(e.target.value) })}
                            style={{ width: "100px" }}
                          />
                          <select
                            value={action.config.delayUnit as string || "days"}
                            onChange={(e) => updateAction(action.id, { ...action.config, delayUnit: e.target.value })}
                            style={{ padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "14px" }}
                          >
                            <option value="minutes">Minutter</option>
                            <option value="hours">Timer</option>
                            <option value="days">Dager</option>
                            <option value="weeks">Uker</option>
                          </select>
                        </div>
                      )}

                      {action.type === "UPDATE_SUBMISSION_STATUS" && (
                        <div>
                          <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "4px" }}>Ny status</label>
                          <select
                            value={action.config.newStatus as string || ""}
                            onChange={(e) => updateAction(action.id, { ...action.config, newStatus: e.target.value })}
                            style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "14px" }}
                          >
                            <option value="">Velg status</option>
                            <option value="CONTACTED">Kontaktet</option>
                            <option value="QUALIFIED">Kvalifisert</option>
                            <option value="CONVERTED">Konvertert</option>
                            <option value="LOST">Tapt</option>
                          </select>
                        </div>
                      )}

                      {action.type === "SEND_NOTIFICATION" && (
                        <div>
                          <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "4px" }}>Varsle e-post</label>
                          <Input
                            type="email"
                            value={action.config.notifyEmail as string || ""}
                            onChange={(e) => updateAction(action.id, { ...action.config, notifyEmail: e.target.value })}
                            placeholder="din@epost.no"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                <div style={{ display: "flex", justifyContent: "center", padding: "16px 0" }}>
                  <div style={{ width: "2px", height: "24px", background: "#e2e8f0" }} />
                </div>

                <div style={{ border: "2px dashed #e2e8f0", borderRadius: "12px", padding: "24px" }}>
                  <p style={{ textAlign: "center", fontWeight: "500", marginBottom: "16px" }}>Legg til handling</p>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
                    {actionTypes.map((actionType) => (
                      <button
                        key={actionType.value}
                        onClick={() => addAction(actionType.value)}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: "8px",
                          padding: "12px",
                          borderRadius: "8px",
                          border: "1px solid #e2e8f0",
                          background: "white",
                          cursor: "pointer",
                        }}
                      >
                        <actionType.icon style={{ width: "20px", height: "20px", color: actionType.color }} />
                        <span style={{ fontSize: "12px", fontWeight: "500" }}>{actionType.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft style={{ width: "16px", height: "16px", marginRight: "8px" }} />
                Tilbake
              </Button>
              <Button onClick={() => setStep(3)} disabled={actions.length === 0}>
                Neste: Gjennomgang
                <ArrowRight style={{ width: "16px", height: "16px", marginLeft: "8px" }} />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <div>
            <Card style={{ marginBottom: "24px" }}>
              <CardHeader>
                <CardTitle>Gjennomgang</CardTitle>
              </CardHeader>
              <CardContent>
                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                  <div>
                    <h3 style={{ fontSize: "18px", fontWeight: "600", margin: "0 0 8px 0" }}>{name}</h3>
                    {description && <p style={{ color: "#6b7280", margin: 0 }}>{description}</p>}
                  </div>

                  <div style={{ padding: "16px", background: "#f8fafc", borderRadius: "12px" }}>
                    <h4 style={{ fontSize: "14px", fontWeight: "600", marginBottom: "12px", color: "#6b7280" }}>TRIGGER</h4>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <Zap style={{ width: "24px", height: "24px", color: "#f59e0b" }} />
                      <div>
                        <p style={{ fontWeight: "500", margin: 0 }}>{triggerTypes.find(t => t.value === triggerType)?.label}</p>
                        <p style={{ fontSize: "12px", color: "#6b7280", margin: "2px 0 0 0" }}>
                          {triggerTypes.find(t => t.value === triggerType)?.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div style={{ padding: "16px", background: "#f8fafc", borderRadius: "12px" }}>
                    <h4 style={{ fontSize: "14px", fontWeight: "600", marginBottom: "12px", color: "#6b7280" }}>HANDLINGER ({actions.length})</h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {actions.map((action, index) => {
                        const actionType = actionTypes.find(a => a.value === action.type);
                        const Icon = actionType?.icon || Mail;
                        return (
                          <div key={action.id} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <div style={{
                              width: "24px",
                              height: "24px",
                              borderRadius: "50%",
                              background: actionType?.color || "#6366f1",
                              color: "white",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "12px",
                              fontWeight: "600",
                            }}>
                              {index + 1}
                            </div>
                            <Icon style={{ width: "18px", height: "18px", color: actionType?.color }} />
                            <span style={{ fontWeight: "500" }}>{actionType?.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <Button variant="outline" onClick={() => setStep(2)}>
                <ArrowLeft style={{ width: "16px", height: "16px", marginRight: "8px" }} />
                Tilbake
              </Button>
              <div style={{ display: "flex", gap: "12px" }}>
                <Button variant="outline" onClick={() => handleSave("PAUSED")} disabled={isSaving}>
                  Lagre som pauset
                </Button>
                <Button onClick={() => handleSave("ACTIVE")} disabled={isSaving}>
                  {isSaving ? "Lagrer..." : "Lagre og aktiver"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}




