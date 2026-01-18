import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Header } from "@/components/layout/header";
import { Card, CardContent, Badge, Button } from "@/components/ui";
import { FileText, Plus, MoreVertical, Eye, Edit, Trash2, Copy, ExternalLink } from "lucide-react";
import { formatRelativeTime, formatNumber } from "@/lib/utils";
import Link from "next/link";

interface FormWithCount {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  buttonColor: string;
  createdAt: Date;
  _count: { submissions: number };
}

async function getForms(organizationId: string): Promise<FormWithCount[]> {
  const forms = await db.form.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { submissions: true },
      },
    },
  });

  return forms as FormWithCount[];
}

const statusColors = {
  DRAFT: "muted",
  PUBLISHED: "success",
  ARCHIVED: "warning",
} as const;

const statusLabels = {
  DRAFT: "Utkast",
  PUBLISHED: "Publisert",
  ARCHIVED: "Arkivert",
};

export default async function FormsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.organizationId) {
    return null;
  }

  const forms = await getForms(session.user.organizationId);

  return (
    <>
      <Header 
        title="Skjemaer"
        description="Opprett og administrer skjemaer for å samle inn leads"
        action={{
          label: "Nytt skjema",
          href: "/dashboard/forms/new",
        }}
      />
      
      <div className="p-6">
        {forms.length === 0 ? (
          <Card className="text-center py-16">
            <CardContent>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--color-primary-light)] mb-6">
                <FileText className="h-8 w-8 text-[var(--color-primary)]" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Ingen skjemaer ennå</h3>
              <p className="text-[var(--color-muted)] mb-6 max-w-md mx-auto">
                Opprett ditt første skjema for å begynne å samle inn leads fra nettsiden din.
              </p>
              <Link href="/dashboard/forms/new">
                <Button size="lg">
                  <Plus className="h-5 w-5" />
                  Opprett skjema
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 stagger-animation">
            {/* Nytt skjema-kort */}
            <Link href="/dashboard/forms/new">
              <Card className="h-full border-2 border-dashed border-[var(--color-border)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-light)] transition-all cursor-pointer group">
                <CardContent className="flex flex-col items-center justify-center h-full min-h-[200px] text-center">
                  <div className="p-4 rounded-full bg-[var(--color-input)] group-hover:bg-[var(--color-primary)] transition-colors mb-4">
                    <Plus className="h-8 w-8 text-[var(--color-muted)] group-hover:text-white transition-colors" />
                  </div>
                  <p className="font-medium text-[var(--color-muted)] group-hover:text-[var(--color-primary)] transition-colors">
                    Opprett nytt skjema
                  </p>
                </CardContent>
              </Card>
            </Link>

            {/* Eksisterende skjemaer */}
            {forms.map((form) => (
              <Card key={form.id} hover className="h-full">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: form.buttonColor + "20" }}>
                      <FileText className="h-5 w-5" style={{ color: form.buttonColor }} />
                    </div>
                    <Badge variant={statusColors[form.status]}>
                      {statusLabels[form.status]}
                    </Badge>
                  </div>

                  <h3 className="font-semibold text-lg mb-1 truncate">{form.name}</h3>
                  <p className="text-sm text-[var(--color-muted)] mb-4 line-clamp-2">
                    {form.description || "Ingen beskrivelse"}
                  </p>

                  <div className="flex items-center justify-between text-sm text-[var(--color-muted)] mb-4">
                    <span>{formatNumber(form._count.submissions)} leads</span>
                    <span>{formatRelativeTime(form.createdAt)}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link href={`/dashboard/forms/${form.id}`} className="flex-1">
                      <Button variant="outline" className="w-full" size="sm">
                        <Edit className="h-4 w-4" />
                        Rediger
                      </Button>
                    </Link>
                    <Link href={`/dashboard/forms/${form.id}/preview`}>
                      <Button variant="ghost" size="icon-sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    {form.status === "PUBLISHED" && (
                      <Link href={`/f/${form.slug}`} target="_blank">
                        <Button variant="ghost" size="icon-sm">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </Link>
                    )}
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

