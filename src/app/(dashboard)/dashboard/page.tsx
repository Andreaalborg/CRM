import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { FileText, Users, Mail, Zap, TrendingUp, ArrowUpRight, ArrowDownRight, Clock } from "lucide-react";
import { formatRelativeTime, formatNumber } from "@/lib/utils";
import Link from "next/link";

interface RecentSubmission {
  id: string;
  data: Record<string, unknown>;
  createdAt: Date;
  form: { name: string };
}

async function getDashboardData(organizationId: string) {
  const [formsCount, submissionsCount, recentSubmissionsData, automationsCount] = await Promise.all([
    db.form.count({
      where: { organizationId },
    }),
    db.submission.count({
      where: { organizationId },
    }),
    db.submission.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        form: {
          select: { name: true },
        },
      },
    }),
    db.automation.count({
      where: { organizationId },
    }),
  ]);

  const recentSubmissions = recentSubmissionsData as unknown as RecentSubmission[];

  const stats = [
    {
      name: "Totalt skjemaer",
      value: formsCount,
      change: "+2",
      changeType: "increase" as const,
      icon: FileText,
      href: "/dashboard/forms",
      gradient: "from-indigo-500 to-purple-600",
      bgLight: "bg-indigo-50",
      textColor: "text-indigo-600",
    },
    {
      name: "Totalt leads",
      value: submissionsCount,
      change: "+12%",
      changeType: "increase" as const,
      icon: Users,
      href: "/dashboard/leads",
      gradient: "from-emerald-500 to-teal-600",
      bgLight: "bg-emerald-50",
      textColor: "text-emerald-600",
    },
    {
      name: "E-poster sendt",
      value: 0,
      change: "0",
      changeType: "neutral" as const,
      icon: Mail,
      href: "/dashboard/emails",
      gradient: "from-orange-500 to-red-600",
      bgLight: "bg-orange-50",
      textColor: "text-orange-600",
    },
    {
      name: "Aktive automasjoner",
      value: automationsCount,
      change: "+1",
      changeType: "increase" as const,
      icon: Zap,
      href: "/dashboard/automations",
      gradient: "from-blue-500 to-cyan-600",
      bgLight: "bg-blue-50",
      textColor: "text-blue-600",
    },
  ];

  return { stats, recentSubmissions };
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.organizationId) {
    return (
      <div className="p-6">
        <p>Ingen organisasjon funnet. Vennligst kontakt support.</p>
      </div>
    );
  }

  const { stats, recentSubmissions } = await getDashboardData(session.user.organizationId);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          Hei, {session.user.name?.split(" ")[0]}! 👋
        </h1>
        <p className="text-slate-500 mt-1">Her er en oversikt over din aktivitet</p>
      </div>
      
      {/* Statistikk-kort */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Link key={stat.name} href={stat.href}>
            <div 
              className="relative group bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-xl hover:border-slate-300 transition-all duration-300"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <stat.icon className="h-5 w-5 text-white" />
                </div>
                {stat.changeType !== "neutral" && (
                  <div className={`flex items-center gap-1 text-sm font-medium ${
                    stat.changeType === "increase" 
                      ? "text-emerald-600" 
                      : "text-red-600"
                  }`}>
                    {stat.changeType === "increase" ? (
                      <ArrowUpRight className="h-4 w-4" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4" />
                    )}
                    <span>{stat.change}</span>
                  </div>
                )}
              </div>
              <div>
                <p className="text-4xl font-bold text-slate-900">{formatNumber(stat.value)}</p>
                <p className="text-sm text-slate-500 mt-1">{stat.name}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Hovedinnhold */}
      <div className="grid gap-8 lg:grid-cols-5">
        {/* Siste leads - 3 kolonner */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between p-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-50">
                <Users className="h-5 w-5 text-emerald-600" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900">Siste leads</h2>
            </div>
            <Link 
              href="/dashboard/leads" 
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              Se alle →
            </Link>
          </div>
          <div className="p-6">
            {recentSubmissions.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center">
                  <Users className="h-8 w-8 text-slate-400" />
                </div>
                <p className="text-slate-600 font-medium">Ingen leads ennå</p>
                <p className="text-sm text-slate-400 mt-1">
                  Leads vil vises her når noen fyller ut skjemaene dine
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentSubmissions.map((submission) => {
                  const data = submission.data as Record<string, unknown>;
                  const name = (data.name as string) || (data.navn as string) || "Ukjent";
                  const email = (data.email as string) || (data.epost as string) || "";
                  
                  return (
                    <div
                      key={submission.id}
                      className="flex items-center justify-between p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold shadow-lg shadow-indigo-500/30">
                          {name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{name}</p>
                          <p className="text-sm text-slate-500">{email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                          {submission.form.name}
                        </span>
                        <p className="text-xs text-slate-400 mt-1 flex items-center justify-end gap-1">
                          <Clock className="h-3 w-3" />
                          {formatRelativeTime(submission.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Hurtigstart - 2 kolonner */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 p-6 border-b border-slate-100">
            <div className="p-2 rounded-xl bg-orange-50">
              <TrendingUp className="h-5 w-5 text-orange-600" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900">Kom i gang</h2>
          </div>
          <div className="p-6 space-y-4">
            <Link href="/dashboard/forms/new">
              <div className="group p-4 rounded-xl border-2 border-dashed border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 transition-all cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-indigo-100 group-hover:bg-gradient-to-br group-hover:from-indigo-500 group-hover:to-purple-600 transition-all">
                    <FileText className="h-5 w-5 text-indigo-600 group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Lag ditt første skjema</p>
                    <p className="text-sm text-slate-500">Bygg et skjema med drag-and-drop</p>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/dashboard/automations/new">
              <div className="group p-4 rounded-xl border-2 border-dashed border-slate-200 hover:border-orange-400 hover:bg-orange-50/50 transition-all cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-orange-100 group-hover:bg-gradient-to-br group-hover:from-orange-500 group-hover:to-red-600 transition-all">
                    <Zap className="h-5 w-5 text-orange-600 group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Sett opp automasjon</p>
                    <p className="text-sm text-slate-500">Send automatiske e-poster</p>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/dashboard/emails/new">
              <div className="group p-4 rounded-xl border-2 border-dashed border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/50 transition-all cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-emerald-100 group-hover:bg-gradient-to-br group-hover:from-emerald-500 group-hover:to-teal-600 transition-all">
                    <Mail className="h-5 w-5 text-emerald-600 group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Lag e-postmal</p>
                    <p className="text-sm text-slate-500">Design vakre e-poster</p>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
