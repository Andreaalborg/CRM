import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from "@/components/ui";
import { ArrowLeft, Mail, Phone, Calendar, FileText, Clock, Send } from "lucide-react";
import { formatDateTime, formatRelativeTime } from "@/lib/utils";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LeadStatusSelect } from "@/components/leads/lead-status-select";
import { LeadNotes } from "@/components/leads/lead-notes";

interface Props {
  params: Promise<{ id: string }>;
}

const statusLabels: Record<string, string> = {
  NEW: "Ny",
  CONTACTED: "Kontaktet",
  QUALIFIED: "Kvalifisert",
  CONVERTED: "Konvertert",
  LOST: "Tapt",
  SPAM: "Spam",
};

export default async function LeadDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.organizationId) {
    return null;
  }

  const submission = await db.submission.findFirst({
    where: {
      id,
      organizationId: session.user.organizationId,
    },
    include: {
      form: {
        select: { name: true, slug: true },
      },
      emailLogs: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!submission) {
    notFound();
  }

  const data = submission.data as Record<string, unknown>;
  const name = (data.name as string) || (data.navn as string) || (data.full_name as string) || "Ukjent";
  const email = (data.email as string) || (data.epost as string) || "";
  const phone = (data.phone as string) || (data.telefon as string) || "";

  return (
    <>
      <Header 
        title="Lead-detaljer"
        description={`${name} - ${submission.form.name}`}
      />
      
      <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
        {/* Tilbake-knapp */}
        <Link href="/dashboard/leads" style={{ display: "inline-flex", alignItems: "center", gap: "8px", marginBottom: "24px", color: "#6366f1", textDecoration: "none" }}>
          <ArrowLeft style={{ width: "16px", height: "16px" }} />
          Tilbake til leads
        </Link>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 350px", gap: "24px" }}>
          {/* Hovedinnhold */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Kontaktinfo-kort */}
            <Card>
              <CardHeader>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <div style={{ 
                      width: "64px", 
                      height: "64px", 
                      borderRadius: "50%", 
                      background: "linear-gradient(135deg, #6366f1, #8b5cf6)", 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "center", 
                      color: "white", 
                      fontSize: "24px", 
                      fontWeight: "600" 
                    }}>
                      {name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h2 style={{ fontSize: "24px", fontWeight: "600", margin: 0 }}>{name}</h2>
                      <p style={{ color: "#6b7280", margin: "4px 0 0 0" }}>
                        Fra: {submission.form.name}
                      </p>
                    </div>
                  </div>
                  <LeadStatusSelect 
                    submissionId={submission.id} 
                    currentStatus={submission.status} 
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
                  {email && (
                    <a 
                      href={`mailto:${email}`}
                      style={{ 
                        display: "flex", 
                        alignItems: "center", 
                        gap: "12px", 
                        padding: "16px", 
                        background: "#f8fafc", 
                        borderRadius: "12px",
                        textDecoration: "none",
                        color: "inherit",
                        transition: "background 0.2s"
                      }}
                    >
                      <div style={{ 
                        width: "40px", 
                        height: "40px", 
                        borderRadius: "10px", 
                        background: "#e0e7ff", 
                        display: "flex", 
                        alignItems: "center", 
                        justifyContent: "center" 
                      }}>
                        <Mail style={{ width: "20px", height: "20px", color: "#6366f1" }} />
                      </div>
                      <div>
                        <p style={{ fontSize: "12px", color: "#6b7280", margin: 0 }}>E-post</p>
                        <p style={{ fontWeight: "500", margin: "2px 0 0 0" }}>{email}</p>
                      </div>
                    </a>
                  )}
                  
                  {phone && (
                    <a 
                      href={`tel:${phone}`}
                      style={{ 
                        display: "flex", 
                        alignItems: "center", 
                        gap: "12px", 
                        padding: "16px", 
                        background: "#f8fafc", 
                        borderRadius: "12px",
                        textDecoration: "none",
                        color: "inherit"
                      }}
                    >
                      <div style={{ 
                        width: "40px", 
                        height: "40px", 
                        borderRadius: "10px", 
                        background: "#dcfce7", 
                        display: "flex", 
                        alignItems: "center", 
                        justifyContent: "center" 
                      }}>
                        <Phone style={{ width: "20px", height: "20px", color: "#16a34a" }} />
                      </div>
                      <div>
                        <p style={{ fontSize: "12px", color: "#6b7280", margin: 0 }}>Telefon</p>
                        <p style={{ fontWeight: "500", margin: "2px 0 0 0" }}>{phone}</p>
                      </div>
                    </a>
                  )}
                  
                  <div style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "12px", 
                    padding: "16px", 
                    background: "#f8fafc", 
                    borderRadius: "12px" 
                  }}>
                    <div style={{ 
                      width: "40px", 
                      height: "40px", 
                      borderRadius: "10px", 
                      background: "#fef3c7", 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "center" 
                    }}>
                      <Calendar style={{ width: "20px", height: "20px", color: "#d97706" }} />
                    </div>
                    <div>
                      <p style={{ fontSize: "12px", color: "#6b7280", margin: 0 }}>Mottatt</p>
                      <p style={{ fontWeight: "500", margin: "2px 0 0 0" }}>{formatRelativeTime(submission.createdAt)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Alle innsendte data */}
            <Card>
              <CardHeader>
                <CardTitle style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <FileText style={{ width: "20px", height: "20px" }} />
                  Innsendte data
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {Object.entries(data).map(([key, value]) => (
                    <div 
                      key={key}
                      style={{ 
                        display: "flex", 
                        justifyContent: "space-between", 
                        padding: "12px 16px", 
                        background: "#f8fafc", 
                        borderRadius: "8px" 
                      }}
                    >
                      <span style={{ color: "#6b7280", textTransform: "capitalize" }}>
                        {key.replace(/_/g, " ")}
                      </span>
                      <span style={{ fontWeight: "500" }}>
                        {typeof value === "boolean" 
                          ? (value ? "Ja" : "Nei") 
                          : String(value) || "-"}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* E-posthistorikk */}
            {submission.emailLogs.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Send style={{ width: "20px", height: "20px" }} />
                    E-posthistorikk
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {submission.emailLogs.map((log) => (
                      <div 
                        key={log.id}
                        style={{ 
                          display: "flex", 
                          justifyContent: "space-between", 
                          alignItems: "center",
                          padding: "12px 16px", 
                          background: "#f8fafc", 
                          borderRadius: "8px" 
                        }}
                      >
                        <div>
                          <p style={{ fontWeight: "500", margin: 0 }}>{log.subject}</p>
                          <p style={{ fontSize: "12px", color: "#6b7280", margin: "4px 0 0 0" }}>
                            Til: {log.to}
                          </p>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <Badge variant={log.status === "SENT" ? "success" : log.status === "FAILED" ? "error" : "warning"}>
                            {log.status === "SENT" ? "Sendt" : log.status === "FAILED" ? "Feilet" : "Venter"}
                          </Badge>
                          <p style={{ fontSize: "12px", color: "#6b7280", margin: "4px 0 0 0" }}>
                            {formatRelativeTime(log.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Hurtighandlinger */}
            <Card>
              <CardHeader>
                <CardTitle>Hurtighandlinger</CardTitle>
              </CardHeader>
              <CardContent>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {email && (
                    <a href={`mailto:${email}`} style={{ textDecoration: "none" }}>
                      <Button variant="outline" style={{ width: "100%", justifyContent: "flex-start", gap: "8px" }}>
                        <Mail style={{ width: "16px", height: "16px" }} />
                        Send e-post
                      </Button>
                    </a>
                  )}
                  {phone && (
                    <a href={`tel:${phone}`} style={{ textDecoration: "none" }}>
                      <Button variant="outline" style={{ width: "100%", justifyContent: "flex-start", gap: "8px" }}>
                        <Phone style={{ width: "16px", height: "16px" }} />
                        Ring
                      </Button>
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Tidslinje */}
            <Card>
              <CardHeader>
                <CardTitle style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Clock style={{ width: "20px", height: "20px" }} />
                  Tidslinje
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div style={{ display: "flex", gap: "12px" }}>
                    <div style={{ 
                      width: "8px", 
                      height: "8px", 
                      borderRadius: "50%", 
                      background: "#6366f1", 
                      marginTop: "6px" 
                    }} />
                    <div>
                      <p style={{ fontWeight: "500", margin: 0 }}>Lead opprettet</p>
                      <p style={{ fontSize: "12px", color: "#6b7280", margin: "2px 0 0 0" }}>
                        {formatDateTime(submission.createdAt)}
                      </p>
                    </div>
                  </div>
                  
                  {submission.emailLogs.map((log) => (
                    <div key={log.id} style={{ display: "flex", gap: "12px" }}>
                      <div style={{ 
                        width: "8px", 
                        height: "8px", 
                        borderRadius: "50%", 
                        background: log.status === "SENT" ? "#16a34a" : "#ef4444", 
                        marginTop: "6px" 
                      }} />
                      <div>
                        <p style={{ fontWeight: "500", margin: 0 }}>
                          E-post {log.status === "SENT" ? "sendt" : "feilet"}
                        </p>
                        <p style={{ fontSize: "12px", color: "#6b7280", margin: "2px 0 0 0" }}>
                          {formatDateTime(log.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Notater */}
            <LeadNotes submissionId={submission.id} />
          </div>
        </div>
      </div>
    </>
  );
}



