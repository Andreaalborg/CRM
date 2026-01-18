import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Header } from "@/components/layout/header";
import { Card, CardContent, Button } from "@/components/ui";
import { Mail, Plus, Edit, Trash2, Copy } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import Link from "next/link";

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  createdAt: Date;
}

async function getEmailTemplates(organizationId: string): Promise<EmailTemplate[]> {
  const templates = await db.emailTemplate.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
  });

  return templates as EmailTemplate[];
}

export default async function EmailsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.organizationId) {
    return null;
  }

  const templates = await getEmailTemplates(session.user.organizationId);

  return (
    <>
      <Header 
        title="E-postmaler"
        description="Lag og administrer e-postmaler for automasjoner"
        action={{
          label: "Ny mal",
          href: "/dashboard/emails/new",
        }}
      />
      
      <div className="p-6">
        {templates.length === 0 ? (
          <Card className="text-center py-16">
            <CardContent>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--color-primary-light)] mb-6">
                <Mail className="h-8 w-8 text-[var(--color-primary)]" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Ingen e-postmaler ennå</h3>
              <p className="text-[var(--color-muted)] mb-6 max-w-md mx-auto">
                Opprett din første e-postmal for å bruke i automasjoner.
              </p>
              <Link href="/dashboard/emails/new">
                <Button size="lg">
                  <Plus className="h-5 w-5" />
                  Opprett e-postmal
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 stagger-animation">
            {/* Ny mal-kort */}
            <Link href="/dashboard/emails/new">
              <Card className="h-full border-2 border-dashed border-[var(--color-border)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-light)] transition-all cursor-pointer group">
                <CardContent className="flex flex-col items-center justify-center h-full min-h-[200px] text-center">
                  <div className="p-4 rounded-full bg-[var(--color-input)] group-hover:bg-[var(--color-primary)] transition-colors mb-4">
                    <Plus className="h-8 w-8 text-[var(--color-muted)] group-hover:text-white transition-colors" />
                  </div>
                  <p className="font-medium text-[var(--color-muted)] group-hover:text-[var(--color-primary)] transition-colors">
                    Opprett ny mal
                  </p>
                </CardContent>
              </Card>
            </Link>

            {/* Eksisterende maler */}
            {templates.map((template) => (
              <Card key={template.id} hover className="h-full">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-2 rounded-lg bg-[var(--color-primary-light)]">
                      <Mail className="h-5 w-5 text-[var(--color-primary)]" />
                    </div>
                  </div>

                  <h3 className="font-semibold text-lg mb-1 truncate">{template.name}</h3>
                  <p className="text-sm text-[var(--color-muted)] mb-2 truncate">
                    Emne: {template.subject}
                  </p>
                  <p className="text-xs text-[var(--color-muted)]">
                    {formatRelativeTime(template.createdAt)}
                  </p>

                  <div className="flex items-center gap-2 mt-4">
                    <Link href={`/dashboard/emails/${template.id}`} className="flex-1">
                      <Button variant="outline" className="w-full" size="sm">
                        <Edit className="h-4 w-4" />
                        Rediger
                      </Button>
                    </Link>
                    <Button variant="ghost" size="icon-sm">
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon-sm" className="text-[var(--color-error)]">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

