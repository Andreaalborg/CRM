import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle, Badge } from "@/components/ui";
import { 
  Building2, Users, FileText, Mail, TrendingUp, 
  ArrowUpRight, Clock, CheckCircle, AlertCircle 
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { formatRelativeTime } from "@/lib/utils";

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect("/login");
  }

  // Sjekk at brukeren er SUPER_ADMIN
  if (session.user.role !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }

  // Hent statistikk
  const [
    totalOrganizations,
    totalUsers,
    totalForms,
    totalSubmissions,
    totalEmails,
    recentOrganizations,
    recentActivity,
  ] = await Promise.all([
    db.organization.count(),
    db.user.count(),
    db.form.count(),
    db.submission.count(),
    db.emailLog.count(),
    db.organization.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { users: true, forms: true, submissions: true },
        },
      },
    }),
    db.activityLog.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
    }),
  ]);

  // Beregn vekst (siste 30 dager)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [newOrgsThisMonth, newLeadsThisMonth] = await Promise.all([
    db.organization.count({
      where: { createdAt: { gte: thirtyDaysAgo } },
    }),
    db.submission.count({
      where: { createdAt: { gte: thirtyDaysAgo } },
    }),
  ]);

  return (
    <>
      <Header 
        title="Agency Dashboard"
        description="Administrer alle dine kunder og organisasjoner"
      />
      
      <div style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }}>
        {/* Stats */}
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(5, 1fr)", 
          gap: "16px",
          marginBottom: "32px"
        }}>
          <Card>
            <CardContent style={{ padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <p style={{ fontSize: "13px", color: "#6b7280", margin: 0 }}>Kunder</p>
                  <p style={{ fontSize: "28px", fontWeight: "700", margin: "4px 0" }}>{totalOrganizations}</p>
                  <p style={{ fontSize: "12px", color: "#10b981", display: "flex", alignItems: "center", gap: "2px" }}>
                    <ArrowUpRight style={{ width: "12px", height: "12px" }} />
                    +{newOrgsThisMonth} denne måneden
                  </p>
                </div>
                <div style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <Building2 style={{ width: "22px", height: "22px", color: "white" }} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent style={{ padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <p style={{ fontSize: "13px", color: "#6b7280", margin: 0 }}>Brukere</p>
                  <p style={{ fontSize: "28px", fontWeight: "700", margin: "4px 0" }}>{totalUsers}</p>
                </div>
                <div style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, #10b981, #059669)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <Users style={{ width: "22px", height: "22px", color: "white" }} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent style={{ padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <p style={{ fontSize: "13px", color: "#6b7280", margin: 0 }}>Skjemaer</p>
                  <p style={{ fontSize: "28px", fontWeight: "700", margin: "4px 0" }}>{totalForms}</p>
                </div>
                <div style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, #f59e0b, #d97706)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <FileText style={{ width: "22px", height: "22px", color: "white" }} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent style={{ padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <p style={{ fontSize: "13px", color: "#6b7280", margin: 0 }}>Leads</p>
                  <p style={{ fontSize: "28px", fontWeight: "700", margin: "4px 0" }}>{totalSubmissions}</p>
                  <p style={{ fontSize: "12px", color: "#10b981", display: "flex", alignItems: "center", gap: "2px" }}>
                    <ArrowUpRight style={{ width: "12px", height: "12px" }} />
                    +{newLeadsThisMonth} denne måneden
                  </p>
                </div>
                <div style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, #06b6d4, #0891b2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <TrendingUp style={{ width: "22px", height: "22px", color: "white" }} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent style={{ padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <p style={{ fontSize: "13px", color: "#6b7280", margin: 0 }}>E-poster sendt</p>
                  <p style={{ fontSize: "28px", fontWeight: "700", margin: "4px 0" }}>{totalEmails}</p>
                </div>
                <div style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, #ec4899, #db2777)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <Mail style={{ width: "22px", height: "22px", color: "white" }} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px" }}>
          {/* Kundeoversikt */}
          <Card>
            <CardHeader>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <CardTitle>Kunder</CardTitle>
                <Link href="/dashboard/admin/customers" style={{ 
                  color: "#6366f1", 
                  fontSize: "14px", 
                  textDecoration: "none" 
                }}>
                  Se alle →
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {recentOrganizations.map((org) => (
                  <Link
                    key={org.id}
                    href={`/dashboard/admin/customers/${org.id}`}
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
                        width: "44px",
                        height: "44px",
                        borderRadius: "10px",
                        background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontWeight: "700",
                        fontSize: "16px",
                      }}>
                        {org.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p style={{ fontWeight: "600", margin: 0 }}>{org.name}</p>
                        <p style={{ fontSize: "12px", color: "#6b7280", margin: "2px 0 0 0" }}>
                          {org._count.users} brukere · {org._count.forms} skjemaer · {org._count.submissions} leads
                        </p>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <Badge variant="success">Aktiv</Badge>
                      <p style={{ fontSize: "11px", color: "#6b7280", margin: "4px 0 0 0" }}>
                        {formatRelativeTime(org.createdAt)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Aktivitetslogg */}
          <Card>
            <CardHeader>
              <CardTitle style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Clock style={{ width: "18px", height: "18px" }} />
                Siste aktivitet
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "10px",
                      padding: "10px",
                      background: "#f8fafc",
                      borderRadius: "8px",
                    }}
                  >
                    <div style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "6px",
                      background: activity.action.includes("error") ? "#fee2e2" : "#dcfce7",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}>
                      {activity.action.includes("error") ? (
                        <AlertCircle style={{ width: "14px", height: "14px", color: "#ef4444" }} />
                      ) : (
                        <CheckCircle style={{ width: "14px", height: "14px", color: "#10b981" }} />
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ 
                        fontSize: "13px", 
                        fontWeight: "500", 
                        margin: 0,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap"
                      }}>
                        {activity.action.replace(/\./g, " → ")}
                      </p>
                      <p style={{ fontSize: "11px", color: "#6b7280", margin: "2px 0 0 0" }}>
                        {activity.user?.name || activity.user?.email || "System"} · {formatRelativeTime(activity.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}






