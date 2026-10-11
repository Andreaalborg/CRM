import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

/** Kun kundebrukere med organisasjon. organizationId hentes fra DB (ikke stoles på klienten). */
export async function requireCustomer(opts: { redirectTo?: boolean } = { redirectTo: true }) {
  const s = await getServerSession(authOptions);
  const u = s?.user?.id ? await db.user.findUnique({ where: { id: s.user.id }, include: { organization: { select: { id: true, name: true, logo: true } } } }) : null;
  if (!u || u.role !== "CUSTOMER" || !u.organizationId || !u.organization) {
    if (opts.redirectTo) redirect(s?.user?.role === "SUPER_ADMIN" ? "/dashboard" : "/customer/login");
    throw new Error("Ikke autorisert");
  }
  return { userId: u.id, orgId: u.organizationId, orgName: u.organization.name, logo: u.organization.logo, user: u };
}
