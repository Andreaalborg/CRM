"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  FileText,
  Users,
  Mail,
  Zap,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Building2,
  BarChart3,
  Shield,
} from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage, Button } from "@/components/ui";

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Skjemaer",
    href: "/dashboard/forms",
    icon: FileText,
  },
  {
    name: "Leads",
    href: "/dashboard/leads",
    icon: Users,
  },
  {
    name: "E-postmaler",
    href: "/dashboard/emails",
    icon: Mail,
  },
  {
    name: "Automasjoner",
    href: "/dashboard/automations",
    icon: Zap,
  },
  {
    name: "Statistikk",
    href: "/dashboard/analytics",
    icon: BarChart3,
  },
];

const adminNavigation = [
  {
    name: "Agency Admin",
    href: "/dashboard/admin",
    icon: Shield,
  },
];

const bottomNavigation = [
  {
    name: "Organisasjon",
    href: "/dashboard/organization",
    icon: Building2,
  },
  {
    name: "Innstillinger",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(false);

  const handleSignOut = () => {
    signOut({ callbackUrl: "/login" });
  };

  return (
    <aside
      className={cn(
        "flex flex-col h-screen bg-white border-r border-slate-200 transition-all duration-300 relative",
        collapsed ? "w-[72px]" : "w-64"
      )}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-7 z-10 flex items-center justify-center w-6 h-6 bg-white border border-slate-200 rounded-full shadow-md hover:bg-slate-50 transition-colors"
      >
        {collapsed ? (
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
        ) : (
          <ChevronLeft className="w-3.5 h-3.5 text-slate-600" />
        )}
      </button>

      {/* Header */}
      <div className={cn(
        "flex items-center h-16 border-b border-slate-200",
        collapsed ? "justify-center px-2" : "px-5"
      )}>
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-500/30">
            <FileText className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <span className="font-bold text-lg text-slate-900">Kundedata</span>
          )}
        </Link>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                collapsed && "justify-center px-0"
              )}
              title={collapsed ? item.name : undefined}
            >
              <item.icon className={cn("flex-shrink-0", collapsed ? "w-5 h-5" : "w-5 h-5")} />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          );
        })}

        {/* Admin Navigation - kun for SUPER_ADMIN */}
        {session?.user?.role === "SUPER_ADMIN" && (
          <>
            {!collapsed && (
              <div className="pt-4 pb-2 px-3">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Admin
                </span>
              </div>
            )}
            {adminNavigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30"
                      : "text-amber-700 hover:bg-amber-50",
                    collapsed && "justify-center px-0"
                  )}
                  title={collapsed ? item.name : undefined}
                >
                  <item.icon className={cn("flex-shrink-0", collapsed ? "w-5 h-5" : "w-5 h-5")} />
                  {!collapsed && <span>{item.name}</span>}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* Bottom Navigation */}
      <div className="px-3 py-3 border-t border-slate-200 space-y-1">
        {bottomNavigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-700",
                collapsed && "justify-center px-0"
              )}
              title={collapsed ? item.name : undefined}
            >
              <item.icon className={cn("flex-shrink-0", collapsed ? "w-5 h-5" : "w-5 h-5")} />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </div>

      {/* User Section */}
      <div className="p-3 border-t border-slate-200">
        {collapsed ? (
          <div className="flex flex-col items-center gap-2">
            <Avatar className="w-9 h-9 ring-2 ring-slate-100">
              <AvatarImage src={session?.user?.image || undefined} />
              <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-sm font-medium">
                {getInitials(session?.user?.name || "U")}
              </AvatarFallback>
            </Avatar>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleSignOut}
              title="Logg ut"
              className="text-slate-500 hover:text-red-600 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-50">
            <Avatar className="w-10 h-10 ring-2 ring-white shadow-sm">
              <AvatarImage src={session?.user?.image || undefined} />
              <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-sm font-medium">
                {getInitials(session?.user?.name || "U")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">
                {session?.user?.name}
              </p>
              <p className="text-xs text-slate-500 truncate">
                {session?.user?.organizationName || session?.user?.email}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleSignOut}
              title="Logg ut"
              className="text-slate-400 hover:text-red-600 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </aside>
  );
}
