import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Header } from "@/components/layout/header";
import { Card, CardContent, Badge, Button, Input } from "@/components/ui";
import { Building2, Search, Plus, Users, FileText, Mail, MoreVertical, ExternalLink } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { formatDateTime, formatRelativeTime } from "@/lib/utils";

export default async function AdminCustomersPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }

  const organizations = await db.organization.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { users: true, forms: true, submissions: true },
      },
      users: {
        take: 1,
        orderBy: { createdAt: "asc" },
        select: { name: true, email: true },
      },
      settings: true,
    },
  });

  return (
    <>
      <Header 
        title="Kundeadministrasjon"
        description={`${organizations.length} kunder totalt`}
      />
      
      <div style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }}>
        {/* Verktøylinje */}
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center",
          marginBottom: "24px"
        }}>
          <div style={{ display: "flex", gap: "12px", flex: 1, maxWidth: "400px" }}>
            <div style={{ flex: 1, position: "relative" }}>
              <Search style={{ 
                position: "absolute", 
                left: "12px", 
                top: "50%", 
                transform: "translateY(-50%)",
                width: "18px",
                height: "18px",
                color: "#9ca3af"
              }} />
              <input
                type="text"
                placeholder="Søk etter kunde..."
                style={{
                  width: "100%",
                  padding: "10px 10px 10px 40px",
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                  fontSize: "14px",
                }}
              />
            </div>
          </div>
          <Link href="/dashboard/admin/customers/new">
            <Button style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Plus style={{ width: "16px", height: "16px" }} />
              Ny kunde
            </Button>
          </Link>
        </div>

        {/* Kundeliste */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
          {organizations.map((org) => {
            const primaryContact = org.users[0];
            
            return (
              <Card key={org.id}>
                <CardContent style={{ padding: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                      <div style={{
                        width: "52px",
                        height: "52px",
                        borderRadius: "12px",
                        background: `linear-gradient(135deg, ${org.settings?.primaryColor || "#6366f1"}, ${org.settings?.secondaryColor || "#8b5cf6"})`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontWeight: "700",
                        fontSize: "20px",
                      }}>
                        {org.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 style={{ fontSize: "16px", fontWeight: "600", margin: 0 }}>{org.name}</h3>
                        <p style={{ fontSize: "12px", color: "#6b7280", margin: "2px 0 0 0" }}>
                          {primaryContact?.email || "Ingen kontakt"}
                        </p>
                      </div>
                    </div>
                    <Badge variant="success">Aktiv</Badge>
                  </div>

                  {/* Stats */}
                  <div style={{ 
                    display: "grid", 
                    gridTemplateColumns: "repeat(3, 1fr)", 
                    gap: "12px",
                    marginBottom: "16px"
                  }}>
                    <div style={{ 
                      padding: "12px", 
                      background: "#f8fafc", 
                      borderRadius: "8px",
                      textAlign: "center"
                    }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                        <Users style={{ width: "14px", height: "14px", color: "#6b7280" }} />
                        <span style={{ fontSize: "18px", fontWeight: "600" }}>{org._count.users}</span>
                      </div>
                      <p style={{ fontSize: "11px", color: "#6b7280", margin: "2px 0 0 0" }}>Brukere</p>
                    </div>
                    <div style={{ 
                      padding: "12px", 
                      background: "#f8fafc", 
                      borderRadius: "8px",
                      textAlign: "center"
                    }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                        <FileText style={{ width: "14px", height: "14px", color: "#6b7280" }} />
                        <span style={{ fontSize: "18px", fontWeight: "600" }}>{org._count.forms}</span>
                      </div>
                      <p style={{ fontSize: "11px", color: "#6b7280", margin: "2px 0 0 0" }}>Skjemaer</p>
                    </div>
                    <div style={{ 
                      padding: "12px", 
                      background: "#f8fafc", 
                      borderRadius: "8px",
                      textAlign: "center"
                    }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                        <Mail style={{ width: "14px", height: "14px", color: "#6b7280" }} />
                        <span style={{ fontSize: "18px", fontWeight: "600" }}>{org._count.submissions}</span>
                      </div>
                      <p style={{ fontSize: "11px", color: "#6b7280", margin: "2px 0 0 0" }}>Leads</p>
                    </div>
                  </div>

                  {/* Info */}
                  <div style={{ 
                    display: "flex", 
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingTop: "12px",
                    borderTop: "1px solid #f1f5f9"
                  }}>
                    <p style={{ fontSize: "12px", color: "#6b7280", margin: 0 }}>
                      Opprettet {formatRelativeTime(org.createdAt)}
                    </p>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <Link href={`/dashboard/admin/customers/${org.id}`}>
                        <Button variant="outline" size="sm">
                          Administrer
                        </Button>
                      </Link>
                      <Link href={`/dashboard/admin/customers/${org.id}/impersonate`}>
                        <Button variant="ghost" size="sm" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <ExternalLink style={{ width: "14px", height: "14px" }} />
                          Logg inn som
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {organizations.length === 0 && (
          <Card style={{ textAlign: "center", padding: "48px" }}>
            <CardContent>
              <Building2 style={{ width: "48px", height: "48px", color: "#d1d5db", margin: "0 auto 16px" }} />
              <h3 style={{ fontSize: "18px", fontWeight: "600", margin: "0 0 8px 0" }}>Ingen kunder ennå</h3>
              <p style={{ color: "#6b7280", marginBottom: "16px" }}>
                Legg til din første kunde for å komme i gang
              </p>
              <Link href="/dashboard/admin/customers/new">
                <Button>Legg til kunde</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}

