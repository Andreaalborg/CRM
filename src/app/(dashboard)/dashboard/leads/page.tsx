import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Header } from "@/components/layout/header";
import { Card, CardContent, Badge, Button, Input } from "@/components/ui";
import { Users, Search, Filter, Eye, Mail, MoreVertical } from "lucide-react";
import { formatDateTime, formatRelativeTime } from "@/lib/utils";
import Link from "next/link";
import { ExportButton } from "@/components/leads";

interface SubmissionWithForm {
  id: string;
  status: "NEW" | "CONTACTED" | "QUALIFIED" | "CONVERTED" | "LOST" | "SPAM";
  data: Record<string, unknown>;
  createdAt: Date;
  form: { name: string; slug: string };
}

async function getSubmissions(organizationId: string): Promise<SubmissionWithForm[]> {
  const submissions = await db.submission.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
    include: {
      form: {
        select: { name: true, slug: true },
      },
    },
  });

  return submissions as unknown as SubmissionWithForm[];
}

const statusColors = {
  NEW: "info",
  CONTACTED: "warning",
  QUALIFIED: "success",
  CONVERTED: "success",
  LOST: "error",
  SPAM: "muted",
} as const;

const statusLabels = {
  NEW: "Ny",
  CONTACTED: "Kontaktet",
  QUALIFIED: "Kvalifisert",
  CONVERTED: "Konvertert",
  LOST: "Tapt",
  SPAM: "Spam",
};

export default async function LeadsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.organizationId) {
    return null;
  }

  const submissions = await getSubmissions(session.user.organizationId);

  return (
    <>
      <Header 
        title="Leads"
        description={`${submissions.length} leads totalt`}
      />
      
      <div className="p-6">
        {/* Verktøylinje */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Søk i leads..."
              icon={<Search className="h-4 w-4" />}
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
            <ExportButton />
          </div>
        </div>

        {submissions.length === 0 ? (
          <Card className="text-center py-16">
            <CardContent>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--color-primary-light)] mb-6">
                <Users className="h-8 w-8 text-[var(--color-primary)]" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Ingen leads ennå</h3>
              <p className="text-[var(--color-muted)] mb-6 max-w-md mx-auto">
                Leads vil vises her når noen fyller ut skjemaene dine.
              </p>
              <Link href="/dashboard/forms/new">
                <Button>Opprett skjema</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-[var(--color-border)]">
                    <th className="text-left p-4 font-medium text-[var(--color-muted)]">Kontakt</th>
                    <th className="text-left p-4 font-medium text-[var(--color-muted)]">Skjema</th>
                    <th className="text-left p-4 font-medium text-[var(--color-muted)]">Status</th>
                    <th className="text-left p-4 font-medium text-[var(--color-muted)]">Dato</th>
                    <th className="text-right p-4 font-medium text-[var(--color-muted)]">Handlinger</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {submissions.map((submission) => {
                    const data = submission.data as Record<string, unknown>;
                    const name = (data.name as string) || (data.navn as string) || (data.full_name as string) || "Ukjent";
                    const email = (data.email as string) || (data.epost as string) || "";
                    const phone = (data.phone as string) || (data.telefon as string) || "";

                    return (
                      <tr key={submission.id} className="hover:bg-[var(--color-input)] transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white font-medium">
                              {name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium">{name}</p>
                              <p className="text-sm text-[var(--color-muted)]">
                                {email || phone || "Ingen kontaktinfo"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge variant="outline">{submission.form.name}</Badge>
                        </td>
                        <td className="p-4">
                          <Badge variant={statusColors[submission.status]}>
                            {statusLabels[submission.status]}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <div>
                            <p className="text-sm">{formatDateTime(submission.createdAt)}</p>
                            <p className="text-xs text-[var(--color-muted)]">
                              {formatRelativeTime(submission.createdAt)}
                            </p>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-1">
                            <Link href={`/dashboard/leads/${submission.id}`}>
                              <Button variant="ghost" size="icon-sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            {email && (
                              <a href={`mailto:${email}`}>
                                <Button variant="ghost" size="icon-sm">
                                  <Mail className="h-4 w-4" />
                                </Button>
                              </a>
                            )}
                            <Button variant="ghost" size="icon-sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
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
    </>
  );
}

