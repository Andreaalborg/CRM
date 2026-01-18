import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { 
  ArrowLeft, 
  ExternalLink, 
  Edit, 
  CheckCircle2,
  Users,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui";
import { PublishToggle } from "@/components/forms/publish-toggle";
import { EmbedCode } from "@/components/forms/embed-code";
import { formatRelativeTime } from "@/lib/utils";

interface PageProps {
  params: Promise<{ formId: string }>;
}

async function getForm(formId: string, organizationId: string) {
  const form = await db.form.findFirst({
    where: {
      id: formId,
      organizationId,
    },
    include: {
      fields: {
        orderBy: { order: "asc" },
      },
      _count: {
        select: { submissions: true },
      },
    },
  });

  return form;
}

async function getRecentSubmissions(formId: string) {
  const submissions = await db.submission.findMany({
    where: { formId },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return submissions;
}

export default async function FormDetailPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  const { formId } = await params;

  if (!session?.user?.organizationId) {
    redirect("/login");
  }

  const form = await getForm(formId, session.user.organizationId);

  if (!form) {
    notFound();
  }

  const recentSubmissions = await getRecentSubmissions(formId);
  const formUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/f/${form.slug}`;
  const isPublished = form.status === "PUBLISHED";

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <Link 
          href="/dashboard/forms" 
          style={{ 
            display: "inline-flex", 
            alignItems: "center", 
            gap: "8px", 
            color: "#64748b", 
            fontSize: "14px",
            textDecoration: "none",
            marginBottom: "16px"
          }}
        >
          <ArrowLeft style={{ width: "16px", height: "16px" }} />
          Tilbake til skjemaer
        </Link>

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "24px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
              <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                {form.name}
              </h1>
              <PublishToggle formId={form.id} isPublished={isPublished} />
            </div>
            {form.description && (
              <p style={{ color: "#64748b", margin: 0 }}>{form.description}</p>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Link href={`/dashboard/forms/${form.id}/edit`}>
              <Button variant="outline">
                <Edit style={{ width: "16px", height: "16px" }} />
                Rediger
              </Button>
            </Link>
            {isPublished && (
              <Link href={formUrl} target="_blank">
                <Button>
                  <ExternalLink style={{ width: "16px", height: "16px" }} />
                  Åpne skjema
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Advarsel hvis ikke publisert */}
      {!isPublished && (
        <div style={{
          backgroundColor: "#fef3c7",
          border: "1px solid #fbbf24",
          borderRadius: "12px",
          padding: "16px 20px",
          marginBottom: "24px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}>
          <span style={{ fontSize: "20px" }}>⚠️</span>
          <div>
            <p style={{ fontSize: "14px", fontWeight: 600, color: "#92400e", margin: 0 }}>
              Skjemaet er ikke publisert
            </p>
            <p style={{ fontSize: "13px", color: "#a16207", margin: 0 }}>
              Klikk på &quot;Kladd&quot;-knappen ovenfor for å publisere skjemaet og gjøre det tilgjengelig.
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
        gap: "16px",
        marginBottom: "32px"
      }}>
        <div style={{
          backgroundColor: "#fff",
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
          padding: "20px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ 
              width: "40px", 
              height: "40px", 
              borderRadius: "10px", 
              backgroundColor: "#eef2ff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <Users style={{ width: "20px", height: "20px", color: "#4f46e5" }} />
            </div>
            <div>
              <p style={{ fontSize: "24px", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                {form._count.submissions}
              </p>
              <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>Totalt innsendinger</p>
            </div>
          </div>
        </div>

        <div style={{
          backgroundColor: "#fff",
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
          padding: "20px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ 
              width: "40px", 
              height: "40px", 
              borderRadius: "10px", 
              backgroundColor: "#ecfdf5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <CheckCircle2 style={{ width: "20px", height: "20px", color: "#10b981" }} />
            </div>
            <div>
              <p style={{ fontSize: "24px", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                {form.fields.length}
              </p>
              <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>Felt i skjemaet</p>
            </div>
          </div>
        </div>

        <div style={{
          backgroundColor: "#fff",
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
          padding: "20px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ 
              width: "40px", 
              height: "40px", 
              borderRadius: "10px", 
              backgroundColor: "#fef3c7",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <Calendar style={{ width: "20px", height: "20px", color: "#f59e0b" }} />
            </div>
            <div>
              <p style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a", margin: 0 }}>
                {formatRelativeTime(form.createdAt)}
              </p>
              <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>Opprettet</p>
            </div>
          </div>
        </div>
      </div>

      {/* Embed-kode (kun hvis publisert) */}
      {isPublished && (
        <div style={{ marginBottom: "32px" }}>
          <EmbedCode formUrl={formUrl} formName={form.name} />
        </div>
      )}

      {/* Innhold i to kolonner */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        {/* Felt-oversikt */}
        <div style={{
          backgroundColor: "#fff",
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
          padding: "20px",
        }}>
          <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#0f172a", marginBottom: "16px" }}>
            Felt i skjemaet
          </h3>
          {form.fields.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 0" }}>
              <p style={{ color: "#64748b", fontSize: "14px", margin: 0 }}>Ingen felt ennå</p>
              <Link 
                href={`/dashboard/forms/${form.id}/edit`}
                style={{ 
                  display: "inline-block",
                  marginTop: "12px",
                  fontSize: "13px", 
                  color: "#4f46e5", 
                  textDecoration: "none" 
                }}
              >
                Legg til felt →
              </Link>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {form.fields.map((field, index) => (
                <div 
                  key={field.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px",
                    backgroundColor: "#f8fafc",
                    borderRadius: "8px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ 
                      width: "24px", 
                      height: "24px", 
                      borderRadius: "6px", 
                      backgroundColor: "#e2e8f0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "12px",
                      fontWeight: 500,
                      color: "#64748b"
                    }}>
                      {index + 1}
                    </span>
                    <div>
                      <p style={{ fontSize: "14px", fontWeight: 500, color: "#0f172a", margin: 0 }}>
                        {field.label}
                        {field.required && <span style={{ color: "#ef4444", marginLeft: "4px" }}>*</span>}
                      </p>
                      <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>{field.type}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Siste innsendinger */}
        <div style={{
          backgroundColor: "#fff",
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
          padding: "20px",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#0f172a", margin: 0 }}>
              Siste innsendinger
            </h3>
            {form._count.submissions > 0 && (
              <Link 
                href={`/dashboard/leads?formId=${form.id}`}
                style={{ fontSize: "13px", color: "#4f46e5", textDecoration: "none" }}
              >
                Se alle →
              </Link>
            )}
          </div>
          {recentSubmissions.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 0" }}>
              <Users style={{ width: "40px", height: "40px", color: "#cbd5e1", margin: "0 auto 12px" }} />
              <p style={{ color: "#64748b", fontSize: "14px", margin: 0 }}>Ingen innsendinger ennå</p>
              <p style={{ color: "#94a3b8", fontSize: "13px", marginTop: "4px" }}>
                {isPublished ? "Innsendinger vil vises her" : "Publiser skjemaet for å motta innsendinger"}
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {recentSubmissions.map((submission) => {
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
                      padding: "12px",
                      backgroundColor: "#f8fafc",
                      borderRadius: "8px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ 
                        width: "36px", 
                        height: "36px", 
                        borderRadius: "50%", 
                        background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        fontSize: "14px",
                        fontWeight: 600
                      }}>
                        {name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p style={{ fontSize: "14px", fontWeight: 500, color: "#0f172a", margin: 0 }}>
                          {name}
                        </p>
                        <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>{email}</p>
                      </div>
                    </div>
                    <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                      {formatRelativeTime(submission.createdAt)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
