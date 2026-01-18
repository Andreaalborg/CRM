import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { Users, FileText, TrendingUp, Clock } from "lucide-react";
import Link from "next/link";
import { formatRelativeTime } from "@/lib/utils";

interface LeadWithForm {
  id: string;
  data: unknown;
  status: string;
  createdAt: Date;
  form: { name: string };
}

export default async function CustomerDashboard() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.organizationId) {
    return null;
  }

  const orgId = session.user.organizationId;

  // Hent statistikk
  const [totalLeads, totalForms, recentLeads, conversionRate] = await Promise.all([
    db.submission.count({ where: { organizationId: orgId } }),
    db.form.count({ where: { organizationId: orgId, status: "PUBLISHED" } }),
    db.submission.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { form: { select: { name: true } } },
    }),
    db.submission.count({
      where: { organizationId: orgId, status: "CONVERTED" },
    }),
  ]);

  const conversionPercent = totalLeads > 0 
    ? Math.round((conversionRate / totalLeads) * 100) 
    : 0;

  return (
    <div style={{ padding: "32px", maxWidth: "1200px" }}>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: "700", margin: 0 }}>
          Velkommen tilbake! 👋
        </h1>
        <p style={{ color: "#6b7280", marginTop: "8px" }}>
          Her er en oversikt over dine leads og skjemaer.
        </p>
      </div>

      {/* Stats */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(4, 1fr)", 
        gap: "20px",
        marginBottom: "32px"
      }}>
        <Card>
          <CardContent style={{ padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <p style={{ color: "#6b7280", fontSize: "14px", margin: 0 }}>Totale leads</p>
                <p style={{ fontSize: "32px", fontWeight: "700", margin: "8px 0 0 0" }}>{totalLeads}</p>
              </div>
              <div style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                <Users style={{ width: "24px", height: "24px", color: "white" }} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent style={{ padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <p style={{ color: "#6b7280", fontSize: "14px", margin: 0 }}>Aktive skjemaer</p>
                <p style={{ fontSize: "32px", fontWeight: "700", margin: "8px 0 0 0" }}>{totalForms}</p>
              </div>
              <div style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #10b981, #059669)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                <FileText style={{ width: "24px", height: "24px", color: "white" }} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent style={{ padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <p style={{ color: "#6b7280", fontSize: "14px", margin: 0 }}>Konverteringsrate</p>
                <p style={{ fontSize: "32px", fontWeight: "700", margin: "8px 0 0 0" }}>{conversionPercent}%</p>
              </div>
              <div style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #f59e0b, #d97706)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                <TrendingUp style={{ width: "24px", height: "24px", color: "white" }} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent style={{ padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <p style={{ color: "#6b7280", fontSize: "14px", margin: 0 }}>Konverterte</p>
                <p style={{ fontSize: "32px", fontWeight: "700", margin: "8px 0 0 0" }}>{conversionRate}</p>
              </div>
              <div style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #06b6d4, #0891b2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                <Clock style={{ width: "24px", height: "24px", color: "white" }} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent leads */}
      <Card>
        <CardHeader>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <CardTitle>Siste leads</CardTitle>
            <Link href="/customer/leads" style={{ 
              color: "#6366f1", 
              fontSize: "14px", 
              textDecoration: "none" 
            }}>
              Se alle →
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {recentLeads.length === 0 ? (
            <p style={{ color: "#6b7280", textAlign: "center", padding: "32px 0" }}>
              Ingen leads ennå. Del skjemaene dine for å begynne å samle leads!
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {recentLeads.map((lead: LeadWithForm) => {
                const data = lead.data as Record<string, unknown>;
                const name = (data.name as string) || (data.navn as string) || "Ukjent";
                const email = (data.email as string) || (data.epost as string) || "";

                return (
                  <Link
                    key={lead.id}
                    href={`/customer/leads/${lead.id}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "16px",
                      background: "#f8fafc",
                      borderRadius: "12px",
                      textDecoration: "none",
                      color: "inherit",
                    }}
                  >
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
                          {email || lead.form.name}
                        </p>
                      </div>
                    </div>
                    <span style={{ fontSize: "12px", color: "#6b7280" }}>
                      {formatRelativeTime(lead.createdAt)}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

