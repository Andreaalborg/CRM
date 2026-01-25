import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, Button } from "@/components/ui";
import { User, Building, Mail, Shield } from "lucide-react";

export default async function CustomerSettingsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.organizationId) {
    return null;
  }

  const [user, organization] = await Promise.all([
    db.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true, createdAt: true },
    }),
    db.organization.findUnique({
      where: { id: session.user.organizationId },
      select: { name: true, createdAt: true },
    }),
  ]);

  return (
    <div style={{ padding: "32px", maxWidth: "800px" }}>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: "700", margin: 0 }}>
          Innstillinger
        </h1>
        <p style={{ color: "#6b7280", marginTop: "8px" }}>
          Administrer din konto og innstillinger
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {/* Profil */}
        <Card>
          <CardHeader>
            <CardTitle style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <User style={{ width: "20px", height: "20px" }} />
              Profil
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ 
                  display: "block", 
                  fontSize: "14px", 
                  fontWeight: "500", 
                  marginBottom: "6px" 
                }}>
                  Navn
                </label>
                <input
                  type="text"
                  defaultValue={user?.name || ""}
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                    fontSize: "14px",
                  }}
                />
              </div>
              <div>
                <label style={{ 
                  display: "block", 
                  fontSize: "14px", 
                  fontWeight: "500", 
                  marginBottom: "6px" 
                }}>
                  E-post
                </label>
                <input
                  type="email"
                  defaultValue={user?.email || ""}
                  disabled
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                    fontSize: "14px",
                    background: "#f8fafc",
                    color: "#6b7280",
                  }}
                />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <Button>Lagre endringer</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Organisasjon */}
        <Card>
          <CardHeader>
            <CardTitle style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Building style={{ width: "20px", height: "20px" }} />
              Organisasjon
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              padding: "16px",
              background: "#f8fafc",
              borderRadius: "12px",
            }}>
              <div style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontWeight: "700",
                fontSize: "18px",
              }}>
                {organization?.name?.charAt(0).toUpperCase() || "O"}
              </div>
              <div>
                <p style={{ fontWeight: "600", margin: 0 }}>{organization?.name}</p>
                <p style={{ fontSize: "12px", color: "#6b7280", margin: "4px 0 0 0" }}>
                  Medlem siden {organization?.createdAt.toLocaleDateString("nb-NO", {
                    year: "numeric",
                    month: "long",
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Varsler */}
        <Card>
          <CardHeader>
            <CardTitle style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Mail style={{ width: "20px", height: "20px" }} />
              E-postvarsler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <label style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px",
                background: "#f8fafc",
                borderRadius: "8px",
                cursor: "pointer",
              }}>
                <input type="checkbox" defaultChecked style={{ width: "18px", height: "18px" }} />
                <div>
                  <p style={{ fontWeight: "500", margin: 0 }}>Nye leads</p>
                  <p style={{ fontSize: "12px", color: "#6b7280", margin: "2px 0 0 0" }}>
                    Få varsel når noen fyller ut et skjema
                  </p>
                </div>
              </label>
              <label style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px",
                background: "#f8fafc",
                borderRadius: "8px",
                cursor: "pointer",
              }}>
                <input type="checkbox" defaultChecked style={{ width: "18px", height: "18px" }} />
                <div>
                  <p style={{ fontWeight: "500", margin: 0 }}>Ukentlig oppsummering</p>
                  <p style={{ fontSize: "12px", color: "#6b7280", margin: "2px 0 0 0" }}>
                    Motta en ukentlig e-post med statistikk
                  </p>
                </div>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Sikkerhet */}
        <Card>
          <CardHeader>
            <CardTitle style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Shield style={{ width: "20px", height: "20px" }} />
              Sikkerhet
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="outline">Endre passord</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}






