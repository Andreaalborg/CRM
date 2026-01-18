import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, Badge } from "@/components/ui";
import { FileText, Copy, ExternalLink, Users } from "lucide-react";
import Link from "next/link";
import { CopyButton } from "@/components/ui/copy-button";

export default async function CustomerFormsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.organizationId) {
    return null;
  }

  const forms = await db.form.findMany({
    where: { 
      organizationId: session.user.organizationId,
      status: "PUBLISHED",
    },
    include: {
      _count: {
        select: { submissions: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return (
    <div style={{ padding: "32px", maxWidth: "1200px" }}>
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: "700", margin: 0 }}>
          Mine skjemaer
        </h1>
        <p style={{ color: "#6b7280", marginTop: "8px" }}>
          {forms.length} publiserte skjemaer
        </p>
      </div>

      {forms.length === 0 ? (
        <Card style={{ textAlign: "center", padding: "64px 24px" }}>
          <CardContent>
            <div style={{
              width: "64px",
              height: "64px",
              borderRadius: "16px",
              background: "linear-gradient(135deg, #dcfce7, #bbf7d0)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 24px",
            }}>
              <FileText style={{ width: "32px", height: "32px", color: "#16a34a" }} />
            </div>
            <h3 style={{ fontSize: "20px", fontWeight: "600", margin: "0 0 8px 0" }}>
              Ingen publiserte skjemaer
            </h3>
            <p style={{ color: "#6b7280", maxWidth: "400px", margin: "0 auto" }}>
              Kontakt administratoren for å få publiserte skjemaer.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", 
          gap: "20px" 
        }}>
          {forms.map((form) => {
            const formUrl = `${baseUrl}/f/${form.slug}`;
            
            return (
              <Card key={form.id}>
                <CardContent style={{ padding: "24px" }}>
                  <div style={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "flex-start",
                    marginBottom: "16px"
                  }}>
                    <div style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "12px",
                      background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}>
                      <FileText style={{ width: "24px", height: "24px", color: "white" }} />
                    </div>
                    <Badge variant="success">Publisert</Badge>
                  </div>

                  <h3 style={{ fontSize: "18px", fontWeight: "600", margin: "0 0 8px 0" }}>
                    {form.name}
                  </h3>
                  
                  {form.description && (
                    <p style={{ 
                      color: "#6b7280", 
                      fontSize: "14px", 
                      margin: "0 0 16px 0",
                      lineHeight: "1.5"
                    }}>
                      {form.description}
                    </p>
                  )}

                  <div style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "8px",
                    marginBottom: "20px",
                    color: "#6b7280",
                    fontSize: "14px"
                  }}>
                    <Users style={{ width: "16px", height: "16px" }} />
                    <span>{form._count.submissions} leads</span>
                  </div>

                  {/* URL */}
                  <div style={{
                    background: "#f8fafc",
                    borderRadius: "8px",
                    padding: "12px",
                    marginBottom: "16px",
                  }}>
                    <p style={{ 
                      fontSize: "12px", 
                      color: "#6b7280", 
                      margin: "0 0 6px 0" 
                    }}>
                      Skjema-URL
                    </p>
                    <div style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      gap: "8px" 
                    }}>
                      <code style={{ 
                        flex: 1, 
                        fontSize: "12px",
                        color: "#374151",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}>
                        {formUrl}
                      </code>
                      <CopyButton text={formUrl} />
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: "8px" }}>
                    <a 
                      href={formUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        padding: "10px",
                        borderRadius: "8px",
                        background: "#6366f1",
                        color: "white",
                        textDecoration: "none",
                        fontSize: "14px",
                        fontWeight: "500",
                      }}
                    >
                      <ExternalLink style={{ width: "16px", height: "16px" }} />
                      Åpne skjema
                    </a>
                    <Link
                      href={`/customer/leads?formId=${form.id}`}
                      style={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        padding: "10px",
                        borderRadius: "8px",
                        border: "1px solid #e2e8f0",
                        color: "#374151",
                        textDecoration: "none",
                        fontSize: "14px",
                        fontWeight: "500",
                      }}
                    >
                      <Users style={{ width: "16px", height: "16px" }} />
                      Se leads
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

