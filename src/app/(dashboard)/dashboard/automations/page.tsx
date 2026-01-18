import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Zap, Plus, Edit } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import Link from "next/link";
import { AutomationActions } from "@/components/automations/automation-actions";

interface AutomationWithRelations {
  id: string;
  name: string;
  status: "DRAFT" | "ACTIVE" | "PAUSED";
  triggerType: "FORM_SUBMISSION" | "FIELD_VALUE" | "TIME_DELAY" | "SUBMISSION_STATUS";
  createdAt: Date;
  form: { name: string } | null;
  _count: { actions: number };
}

async function getAutomations(organizationId: string): Promise<AutomationWithRelations[]> {
  const automations = await db.automation.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
    include: {
      form: {
        select: { name: true },
      },
      _count: {
        select: { actions: true },
      },
    },
  });

  return automations as AutomationWithRelations[];
}

const statusColors: Record<string, string> = {
  DRAFT: "#94a3b8",
  ACTIVE: "#10b981",
  PAUSED: "#f59e0b",
};

const statusBgColors: Record<string, string> = {
  DRAFT: "#f1f5f9",
  ACTIVE: "#ecfdf5",
  PAUSED: "#fef3c7",
};

const statusLabels: Record<string, string> = {
  DRAFT: "Utkast",
  ACTIVE: "Aktiv",
  PAUSED: "Pauset",
};

const triggerLabels: Record<string, string> = {
  FORM_SUBMISSION: "Ved skjemainnsending",
  FIELD_VALUE: "Ved spesifikk feltverdi",
  TIME_DELAY: "Etter forsinkelse",
  SUBMISSION_STATUS: "Ved statusendring",
};

export default async function AutomationsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.organizationId) {
    return null;
  }

  const automations = await getAutomations(session.user.organizationId);

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "32px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#0f172a", margin: 0 }}>Automasjoner</h1>
          <p style={{ color: "#64748b", margin: 0 }}>Automatiser e-poster og handlinger basert på triggere</p>
        </div>
        <Link href="/dashboard/automations/new">
          <button style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 20px",
            backgroundColor: "#4f46e5",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: 500,
            cursor: "pointer",
          }}>
            <Plus style={{ width: "18px", height: "18px" }} />
            Ny automasjon
          </button>
        </Link>
      </div>

      {automations.length === 0 ? (
        <div style={{
          backgroundColor: "#fff",
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
          padding: "64px 24px",
          textAlign: "center",
        }}>
          <div style={{
            width: "64px",
            height: "64px",
            borderRadius: "16px",
            background: "linear-gradient(135deg, #f97316, #ef4444)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px",
          }}>
            <Zap style={{ width: "32px", height: "32px", color: "#fff" }} />
          </div>
          <h3 style={{ fontSize: "20px", fontWeight: 600, color: "#0f172a", marginBottom: "8px" }}>
            Ingen automasjoner ennå
          </h3>
          <p style={{ color: "#64748b", marginBottom: "24px", maxWidth: "400px", margin: "0 auto 24px" }}>
            Opprett din første automasjon for å sende automatiske e-poster når noen fyller ut skjemaene dine.
          </p>
          <Link href="/dashboard/automations/new">
            <button style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 24px",
              background: "linear-gradient(135deg, #f97316, #ef4444)",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: 500,
              cursor: "pointer",
            }}>
              <Plus style={{ width: "18px", height: "18px" }} />
              Opprett automasjon
            </button>
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {automations.map((automation) => (
            <div 
              key={automation.id}
              style={{
                backgroundColor: "#fff",
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                padding: "20px 24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, #f97316, #ef4444)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <Zap style={{ width: "24px", height: "24px", color: "#fff" }} />
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                    <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#0f172a", margin: 0 }}>
                      {automation.name}
                    </h3>
                    <span style={{
                      padding: "2px 10px",
                      borderRadius: "9999px",
                      fontSize: "12px",
                      fontWeight: 500,
                      backgroundColor: statusBgColors[automation.status],
                      color: statusColors[automation.status],
                    }}>
                      {statusLabels[automation.status]}
                    </span>
                  </div>
                  <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
                    {triggerLabels[automation.triggerType]}
                    {automation.form && ` • ${automation.form.name}`}
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontSize: "14px", fontWeight: 500, color: "#0f172a", margin: 0 }}>
                    {automation._count.actions} handling{automation._count.actions !== 1 ? "er" : ""}
                  </p>
                  <p style={{ fontSize: "12px", color: "#94a3b8", margin: 0 }}>
                    {formatRelativeTime(automation.createdAt)}
                  </p>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <AutomationActions 
                    automationId={automation.id} 
                    status={automation.status} 
                  />
                  <Link href={`/dashboard/automations/${automation.id}/edit`}>
                    <button style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "36px",
                      height: "36px",
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                      backgroundColor: "#fff",
                      cursor: "pointer",
                    }}>
                      <Edit style={{ width: "16px", height: "16px", color: "#64748b" }} />
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
