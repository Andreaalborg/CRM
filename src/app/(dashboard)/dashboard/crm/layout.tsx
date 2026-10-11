import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { CrmNav } from "@/components/crm/CrmNav";

export const metadata = { title: "Salgs-CRM – IntelliSense" };

export default async function CrmLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "SUPER_ADMIN") redirect("/dashboard");
  return (
    <div className="-m-4 md:-m-8 min-h-full bg-brand-bg p-4 md:p-8 text-brand-ink">
      <CrmNav />
      {children}
    </div>
  );
}
