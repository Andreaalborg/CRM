import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { SessionProvider } from "@/components/providers/session-provider";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard - Kundedata",
  description: "Administrer skjemaer, leads og automasjoner",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <SessionProvider>
      <div className="flex flex-col md:flex-row h-screen bg-slate-50">
        <Sidebar />
        <MobileNav />
        <main className="flex-1 min-w-0 overflow-auto">
          <div className="p-4 md:p-8">
            {children}
          </div>
        </main>
      </div>
    </SessionProvider>
  );
}
