import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from "@/components/ui";
import { 
  ArrowLeft, Building2, Users, FileText, Mail, Settings, 
  Edit, Trash2, Plus, ExternalLink, Globe, Phone, Calendar,
  TrendingUp, Clock
} from "lucide-react";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { formatDateTime, formatRelativeTime } from "@/lib/utils";
import { CustomerSettings } from "@/components/admin/customer-settings";

interface Props {
  params: Promise<{ customerId: string }>;
}

export default async function CustomerDetailPage({ params }: Props) {
  const { customerId } = await params;
  const session = await getServerSession(authOptions);
  
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }

  const organization = await db.organization.findUnique({
    where: { id: customerId },
    include: {
      settings: true,
      users: {
        orderBy: { createdAt: "asc" },
      },
      forms: {
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: { submissions: true },
          },
        },
      },
      submissions: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          form: {
            select: { name: true },
          },
        },
      },
      automations: {
        include: {
          _count: {
            select: { actions: true },
          },
        },
      },
      emailTemplates: true,
    },
  });

  if (!organization) {
    notFound();
  }

  // Statistikk
  const totalLeads = await db.submission.count({
    where: { organizationId: customerId },
  });

  const totalEmails = await db.emailLog.count({
    where: {
      submission: {
        organizationId: customerId,
      },
    },
  });

  const thisMonthLeads = await db.submission.count({
    where: {
      organizationId: customerId,
      createdAt: {
        gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      },
    },
  });

  return (
    <>
      <Header 
        title={organization.name}
        description="Kundeadministrasjon"
      />
      
      <div style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }}>
        {/* Tilbake-knapp */}
        <Link 
          href="/dashboard/admin/customers" 
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
          Tilbake til kunder
        </Link>

        {/* Kunde-header */}
        <Card style={{ marginBottom: "24px" }}>
          <CardContent style={{ padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                <div style={{
                  width: "72px",
                  height: "72px",
                  borderRadius: "16px",
                  background: `linear-gradient(135deg, ${organization.settings?.primaryColor || "#6366f1"}, ${organization.settings?.secondaryColor || "#8b5cf6"})`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontWeight: "700",
                  fontSize: "28px",
                }}>
                  {organization.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h1 style={{ fontSize: "24px", fontWeight: "700", margin: "0 0 4px 0" }}>
                    {organization.name}
                  </h1>
                  {organization.website && (
                    <a 
                      href={organization.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ 
                        display: "flex", 
                        alignItems: "center", 
                        gap: "6px",
                        color: "#6366f1",
                        fontSize: "14px",
                        textDecoration: "none",
                        marginBottom: "8px"
                      }}
                    >
                      <Globe style={{ width: "14px", height: "14px" }} />
                      {organization.website}
                    </a>
                  )}
                  <div style={{ display: "flex", gap: "16px", color: "#6b7280", fontSize: "13px" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <Calendar style={{ width: "14px", height: "14px" }} />
                      Opprettet {formatDateTime(organization.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <Button variant="outline" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <ExternalLink style={{ width: "14px", height: "14px" }} />
                  Logg inn som kunde
                </Button>
                <Button style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Edit style={{ width: "14px", height: "14px" }} />
                  Rediger
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(4, 1fr)", 
          gap: "16px",
          marginBottom: "24px"
        }}>
          <Card>
            <CardContent style={{ padding: "20px", textAlign: "center" }}>
              <Users style={{ width: "24px", height: "24px", color: "#6366f1", margin: "0 auto 8px" }} />
              <p style={{ fontSize: "28px", fontWeight: "700", margin: "0" }}>{organization.users.length}</p>
              <p style={{ fontSize: "13px", color: "#6b7280", margin: "4px 0 0 0" }}>Brukere</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent style={{ padding: "20px", textAlign: "center" }}>
              <FileText style={{ width: "24px", height: "24px", color: "#10b981", margin: "0 auto 8px" }} />
              <p style={{ fontSize: "28px", fontWeight: "700", margin: "0" }}>{organization.forms.length}</p>
              <p style={{ fontSize: "13px", color: "#6b7280", margin: "4px 0 0 0" }}>Skjemaer</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent style={{ padding: "20px", textAlign: "center" }}>
              <TrendingUp style={{ width: "24px", height: "24px", color: "#f59e0b", margin: "0 auto 8px" }} />
              <p style={{ fontSize: "28px", fontWeight: "700", margin: "0" }}>{totalLeads}</p>
              <p style={{ fontSize: "13px", color: "#6b7280", margin: "4px 0 0 0" }}>
                Leads ({thisMonthLeads} denne mnd)
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent style={{ padding: "20px", textAlign: "center" }}>
              <Mail style={{ width: "24px", height: "24px", color: "#ec4899", margin: "0 auto 8px" }} />
              <p style={{ fontSize: "28px", fontWeight: "700", margin: "0" }}>{totalEmails}</p>
              <p style={{ fontSize: "13px", color: "#6b7280", margin: "4px 0 0 0" }}>E-poster sendt</p>
            </CardContent>
          </Card>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Brukere */}
            <Card>
              <CardHeader>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <CardTitle style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Users style={{ width: "18px", height: "18px" }} />
                    Brukere
                  </CardTitle>
                  <Button variant="outline" size="sm">
                    <Plus style={{ width: "14px", height: "14px", marginRight: "4px" }} />
                    Legg til
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {organization.users.map((user) => (
                    <div 
                      key={user.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "12px 16px",
                        background: "#f8fafc",
                        borderRadius: "8px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "50%",
                          background: "#6366f1",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "white",
                          fontWeight: "600",
                          fontSize: "14px",
                        }}>
                          {(user.name || user.email).charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p style={{ fontWeight: "500", margin: 0 }}>{user.name || "Ukjent"}</p>
                          <p style={{ fontSize: "12px", color: "#6b7280", margin: "2px 0 0 0" }}>{user.email}</p>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Badge variant={user.role === "SUPER_ADMIN" ? "info" : "outline"}>
                          {user.role === "SUPER_ADMIN" ? "Admin" : "Bruker"}
                        </Badge>
                        <Button variant="ghost" size="icon-sm">
                          <Edit style={{ width: "14px", height: "14px" }} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Skjemaer */}
            <Card>
              <CardHeader>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <CardTitle style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <FileText style={{ width: "18px", height: "18px" }} />
                    Skjemaer
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {organization.forms.length === 0 ? (
                  <p style={{ color: "#6b7280", textAlign: "center", padding: "16px 0" }}>
                    Ingen skjemaer opprettet ennå
                  </p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {organization.forms.map((form) => (
                      <div 
                        key={form.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "12px 16px",
                          background: "#f8fafc",
                          borderRadius: "8px",
                        }}
                      >
                        <div>
                          <p style={{ fontWeight: "500", margin: 0 }}>{form.name}</p>
                          <p style={{ fontSize: "12px", color: "#6b7280", margin: "2px 0 0 0" }}>
                            {form._count.submissions} leads
                          </p>
                        </div>
                        <Badge variant={form.status === "PUBLISHED" ? "success" : "muted"}>
                          {form.status === "PUBLISHED" ? "Publisert" : form.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Siste leads */}
            <Card>
              <CardHeader>
                <CardTitle style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <TrendingUp style={{ width: "18px", height: "18px" }} />
                  Siste leads
                </CardTitle>
              </CardHeader>
              <CardContent>
                {organization.submissions.length === 0 ? (
                  <p style={{ color: "#6b7280", textAlign: "center", padding: "16px 0" }}>
                    Ingen leads ennå
                  </p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {organization.submissions.map((submission) => {
                      const data = submission.data as Record<string, unknown>;
                      const name = (data.name as string) || (data.navn as string) || "Ukjent";
                      const email = (data.email as string) || (data.epost as string) || "";
                      
                      return (
                        <div 
                          key={submission.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "12px 16px",
                            background: "#f8fafc",
                            borderRadius: "8px",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <div style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "50%",
                              background: "#6366f1",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "white",
                              fontWeight: "600",
                              fontSize: "12px",
                            }}>
                              {name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p style={{ fontWeight: "500", margin: 0, fontSize: "14px" }}>{name}</p>
                              <p style={{ fontSize: "11px", color: "#6b7280", margin: "2px 0 0 0" }}>
                                {email || submission.form.name}
                              </p>
                            </div>
                          </div>
                          <span style={{ fontSize: "11px", color: "#6b7280" }}>
                            {formatRelativeTime(submission.createdAt)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Bedriftsinformasjon */}
            <CustomerSettings organization={organization} />

            {/* Automasjoner */}
            <Card>
              <CardHeader>
                <CardTitle style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Clock style={{ width: "18px", height: "18px" }} />
                  Automasjoner
                </CardTitle>
              </CardHeader>
              <CardContent>
                {organization.automations.length === 0 ? (
                  <p style={{ color: "#6b7280", textAlign: "center", padding: "16px 0", fontSize: "14px" }}>
                    Ingen automasjoner
                  </p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {organization.automations.map((auto) => (
                      <div 
                        key={auto.id}
                        style={{
                          padding: "10px 12px",
                          background: "#f8fafc",
                          borderRadius: "8px",
                        }}
                      >
                        <p style={{ fontWeight: "500", margin: 0, fontSize: "13px" }}>{auto.name}</p>
                        <p style={{ fontSize: "11px", color: "#6b7280", margin: "2px 0 0 0" }}>
                          {auto._count.actions} handlinger · {auto.status}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* E-postmaler */}
            <Card>
              <CardHeader>
                <CardTitle style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Mail style={{ width: "18px", height: "18px" }} />
                  E-postmaler
                </CardTitle>
              </CardHeader>
              <CardContent>
                {organization.emailTemplates.length === 0 ? (
                  <p style={{ color: "#6b7280", textAlign: "center", padding: "16px 0", fontSize: "14px" }}>
                    Ingen e-postmaler
                  </p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {organization.emailTemplates.map((template) => (
                      <div 
                        key={template.id}
                        style={{
                          padding: "10px 12px",
                          background: "#f8fafc",
                          borderRadius: "8px",
                        }}
                      >
                        <p style={{ fontWeight: "500", margin: 0, fontSize: "13px" }}>{template.name}</p>
                        <p style={{ fontSize: "11px", color: "#6b7280", margin: "2px 0 0 0" }}>
                          {template.subject}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Farezone */}
            <Card style={{ borderColor: "#fecaca" }}>
              <CardHeader>
                <CardTitle style={{ color: "#ef4444" }}>Faresone</CardTitle>
              </CardHeader>
              <CardContent>
                <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "12px" }}>
                  Disse handlingene kan ikke angres.
                </p>
                <Button 
                  variant="outline" 
                  style={{ 
                    borderColor: "#ef4444", 
                    color: "#ef4444",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}
                >
                  <Trash2 style={{ width: "14px", height: "14px" }} />
                  Slett kunde
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}

