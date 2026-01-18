import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, Badge } from "@/components/ui";
import { Users, Search, Eye, Mail } from "lucide-react";
import { formatDateTime, formatRelativeTime } from "@/lib/utils";
import Link from "next/link";
import { ExportButton } from "@/components/leads";

const statusColors: Record<string, "info" | "warning" | "success" | "error" | "muted"> = {
  NEW: "info",
  CONTACTED: "warning",
  QUALIFIED: "success",
  CONVERTED: "success",
  LOST: "error",
  SPAM: "muted",
};

const statusLabels: Record<string, string> = {
  NEW: "Ny",
  CONTACTED: "Kontaktet",
  QUALIFIED: "Kvalifisert",
  CONVERTED: "Konvertert",
  LOST: "Tapt",
  SPAM: "Spam",
};

export default async function CustomerLeadsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.organizationId) {
    return null;
  }

  const submissions = await db.submission.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { createdAt: "desc" },
    include: {
      form: {
        select: { name: true, slug: true },
      },
    },
  });

  return (
    <div style={{ padding: "32px", maxWidth: "1400px" }}>
      {/* Header */}
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        marginBottom: "24px" 
      }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: "700", margin: 0 }}>
            Mine leads
          </h1>
          <p style={{ color: "#6b7280", marginTop: "8px" }}>
            {submissions.length} leads totalt
          </p>
        </div>
        <ExportButton />
      </div>

      {/* Search bar */}
      <div style={{ 
        display: "flex", 
        gap: "12px", 
        marginBottom: "24px" 
      }}>
        <div style={{ 
          flex: 1, 
          position: "relative" 
        }}>
          <Search style={{ 
            position: "absolute", 
            left: "14px", 
            top: "50%", 
            transform: "translateY(-50%)",
            width: "18px",
            height: "18px",
            color: "#9ca3af"
          }} />
          <input
            type="text"
            placeholder="Søk i leads..."
            style={{
              width: "100%",
              padding: "12px 12px 12px 44px",
              borderRadius: "10px",
              border: "1px solid #e2e8f0",
              fontSize: "14px",
            }}
          />
        </div>
      </div>

      {submissions.length === 0 ? (
        <Card style={{ textAlign: "center", padding: "64px 24px" }}>
          <CardContent>
            <div style={{
              width: "64px",
              height: "64px",
              borderRadius: "16px",
              background: "linear-gradient(135deg, #e0e7ff, #c7d2fe)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 24px",
            }}>
              <Users style={{ width: "32px", height: "32px", color: "#6366f1" }} />
            </div>
            <h3 style={{ fontSize: "20px", fontWeight: "600", margin: "0 0 8px 0" }}>
              Ingen leads ennå
            </h3>
            <p style={{ color: "#6b7280", maxWidth: "400px", margin: "0 auto" }}>
              Leads vil vises her når noen fyller ut skjemaene dine. 
              Del skjemaene dine for å begynne å samle leads!
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #e2e8f0" }}>
                  <th style={{ textAlign: "left", padding: "16px", fontWeight: "500", color: "#6b7280" }}>
                    Kontakt
                  </th>
                  <th style={{ textAlign: "left", padding: "16px", fontWeight: "500", color: "#6b7280" }}>
                    Skjema
                  </th>
                  <th style={{ textAlign: "left", padding: "16px", fontWeight: "500", color: "#6b7280" }}>
                    Status
                  </th>
                  <th style={{ textAlign: "left", padding: "16px", fontWeight: "500", color: "#6b7280" }}>
                    Dato
                  </th>
                  <th style={{ textAlign: "right", padding: "16px", fontWeight: "500", color: "#6b7280" }}>
                    Handlinger
                  </th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((submission) => {
                  const data = submission.data as Record<string, unknown>;
                  const name = (data.name as string) || (data.navn as string) || "Ukjent";
                  const email = (data.email as string) || (data.epost as string) || "";
                  const phone = (data.phone as string) || (data.telefon as string) || "";

                  return (
                    <tr 
                      key={submission.id} 
                      style={{ borderBottom: "1px solid #f1f5f9" }}
                    >
                      <td style={{ padding: "16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "50%",
                            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "white",
                            fontWeight: "600",
                          }}>
                            {name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p style={{ fontWeight: "500", margin: 0 }}>{name}</p>
                            <p style={{ fontSize: "12px", color: "#6b7280", margin: "2px 0 0 0" }}>
                              {email || phone || "Ingen kontaktinfo"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "16px" }}>
                        <Badge variant="outline">{submission.form.name}</Badge>
                      </td>
                      <td style={{ padding: "16px" }}>
                        <Badge variant={statusColors[submission.status]}>
                          {statusLabels[submission.status]}
                        </Badge>
                      </td>
                      <td style={{ padding: "16px" }}>
                        <div>
                          <p style={{ fontSize: "14px", margin: 0 }}>{formatDateTime(submission.createdAt)}</p>
                          <p style={{ fontSize: "12px", color: "#6b7280", margin: "2px 0 0 0" }}>
                            {formatRelativeTime(submission.createdAt)}
                          </p>
                        </div>
                      </td>
                      <td style={{ padding: "16px" }}>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                          <Link href={`/customer/leads/${submission.id}`}>
                            <button style={{
                              padding: "8px",
                              borderRadius: "6px",
                              border: "none",
                              background: "#f1f5f9",
                              cursor: "pointer",
                            }}>
                              <Eye style={{ width: "16px", height: "16px", color: "#6b7280" }} />
                            </button>
                          </Link>
                          {email && (
                            <a href={`mailto:${email}`}>
                              <button style={{
                                padding: "8px",
                                borderRadius: "6px",
                                border: "none",
                                background: "#f1f5f9",
                                cursor: "pointer",
                              }}>
                                <Mail style={{ width: "16px", height: "16px", color: "#6b7280" }} />
                              </button>
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

