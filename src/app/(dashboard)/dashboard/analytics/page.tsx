import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { BarChart3, TrendingUp, Users, FileText, Calendar } from "lucide-react";
import { formatNumber } from "@/lib/utils";

interface TopForm {
  name: string;
  count: number;
}

interface StatusCount {
  status: string;
  count: number;
}

interface Analytics {
  totalForms: number;
  totalSubmissions: number;
  submissionsLast30Days: number;
  submissionsLast7Days: number;
  topForms: TopForm[];
  submissionsByStatus: StatusCount[];
}

async function getAnalytics(organizationId: string): Promise<Analytics> {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const totalForms = await db.form.count({ where: { organizationId } });
  const totalSubmissions = await db.submission.count({ where: { organizationId } });
  const submissionsLast30Days = await db.submission.count({
    where: {
      organizationId,
      createdAt: { gte: thirtyDaysAgo },
    },
  });
  const submissionsLast7Days = await db.submission.count({
    where: {
      organizationId,
      createdAt: { gte: sevenDaysAgo },
    },
  });

  // Hent topp 5 skjemaer med flest submissions
  const topFormsData = await db.form.findMany({
    where: { organizationId },
    select: {
      id: true,
      name: true,
      _count: {
        select: { submissions: true },
      },
    },
    orderBy: {
      submissions: { _count: "desc" },
    },
    take: 5,
  });

  const topForms: TopForm[] = topFormsData.map((f: { name: string; _count: { submissions: number } }) => ({
    name: f.name,
    count: f._count.submissions,
  }));

  // Hent submissions gruppert etter status
  const allSubmissions = await db.submission.findMany({
    where: { organizationId },
    select: { status: true },
  });

  const statusCounts: Record<string, number> = {};
  allSubmissions.forEach((s: { status: string }) => {
    statusCounts[s.status] = (statusCounts[s.status] || 0) + 1;
  });

  const submissionsByStatus: StatusCount[] = Object.entries(statusCounts).map(
    ([status, count]) => ({ status, count })
  );

  return {
    totalForms,
    totalSubmissions,
    submissionsLast30Days,
    submissionsLast7Days,
    topForms,
    submissionsByStatus,
  };
}

const statusLabels: Record<string, string> = {
  NEW: "Nye",
  CONTACTED: "Kontaktet",
  QUALIFIED: "Kvalifisert",
  CONVERTED: "Konvertert",
  LOST: "Tapt",
  SPAM: "Spam",
};

const statusColors: Record<string, string> = {
  NEW: "bg-blue-500",
  CONTACTED: "bg-yellow-500",
  QUALIFIED: "bg-green-500",
  CONVERTED: "bg-emerald-600",
  LOST: "bg-red-500",
  SPAM: "bg-gray-500",
};

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.organizationId) {
    return null;
  }

  const analytics = await getAnalytics(session.user.organizationId);

  const totalStatusCount = analytics.submissionsByStatus.reduce(
    (sum, s) => sum + s.count,
    0
  );

  return (
    <>
      <Header 
        title="Statistikk"
        description="Oversikt over skjemaer og leads"
      />
      
      <div className="p-6 space-y-6">
        {/* Hovedtall */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 stagger-animation">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-lg bg-[var(--color-primary-light)]">
                  <FileText className="h-5 w-5 text-[var(--color-primary)]" />
                </div>
              </div>
              <p className="text-3xl font-bold">{formatNumber(analytics.totalForms)}</p>
              <p className="text-sm text-[var(--color-muted)]">Totalt skjemaer</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-lg bg-[var(--color-success-light)]">
                  <Users className="h-5 w-5 text-[var(--color-success)]" />
                </div>
              </div>
              <p className="text-3xl font-bold">{formatNumber(analytics.totalSubmissions)}</p>
              <p className="text-sm text-[var(--color-muted)]">Totalt leads</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-lg bg-[var(--color-secondary-light)]">
                  <Calendar className="h-5 w-5 text-[var(--color-secondary)]" />
                </div>
              </div>
              <p className="text-3xl font-bold">{formatNumber(analytics.submissionsLast30Days)}</p>
              <p className="text-sm text-[var(--color-muted)]">Leads siste 30 dager</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-lg bg-[var(--color-info-light)]">
                  <TrendingUp className="h-5 w-5 text-[var(--color-info)]" />
                </div>
              </div>
              <p className="text-3xl font-bold">{formatNumber(analytics.submissionsLast7Days)}</p>
              <p className="text-sm text-[var(--color-muted)]">Leads siste 7 dager</p>
            </CardContent>
          </Card>
        </div>

        {/* Detaljer */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Topp skjemaer */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-[var(--color-primary)]" />
                Topp skjemaer
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.topForms.length === 0 ? (
                <p className="text-[var(--color-muted)] text-center py-8">
                  Ingen data ennå
                </p>
              ) : (
                <div className="space-y-4">
                  {analytics.topForms.map((form, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium truncate">{form.name}</p>
                          <span className="text-sm text-[var(--color-muted)]">
                            {formatNumber(form.count)}
                          </span>
                        </div>
                        <div className="h-2 bg-[var(--color-input)] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[var(--color-primary)] rounded-full transition-all"
                            style={{
                              width: `${
                                (form.count / (analytics.topForms[0]?.count || 1)) * 100
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status-fordeling */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-[var(--color-success)]" />
                Lead-status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.submissionsByStatus.length === 0 ? (
                <p className="text-[var(--color-muted)] text-center py-8">
                  Ingen data ennå
                </p>
              ) : (
                <div className="space-y-4">
                  {analytics.submissionsByStatus.map((status) => (
                    <div key={status.status} className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-3 h-3 rounded-full ${
                                statusColors[status.status] || "bg-gray-500"
                              }`}
                            />
                            <p className="font-medium">
                              {statusLabels[status.status] || status.status}
                            </p>
                          </div>
                          <span className="text-sm text-[var(--color-muted)]">
                            {formatNumber(status.count)} (
                            {totalStatusCount > 0
                              ? Math.round((status.count / totalStatusCount) * 100)
                              : 0}
                            %)
                          </span>
                        </div>
                        <div className="h-2 bg-[var(--color-input)] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              statusColors[status.status] || "bg-gray-500"
                            }`}
                            style={{
                              width: `${
                                totalStatusCount > 0
                                  ? (status.count / totalStatusCount) * 100
                                  : 0
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
