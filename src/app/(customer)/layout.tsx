import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SessionProvider } from "@/components/providers/session-provider";
import Link from "next/link";
import { LayoutDashboard, Users, FileText, LogOut, Settings } from "lucide-react";

export default async function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <SessionProvider session={session}>
      <div style={{ 
        minHeight: "100vh", 
        background: "#f8fafc",
        display: "flex"
      }}>
        {/* Sidebar */}
        <aside style={{
          width: "260px",
          background: "white",
          borderRight: "1px solid #e2e8f0",
          display: "flex",
          flexDirection: "column",
          position: "fixed",
          height: "100vh",
        }}>
          {/* Logo */}
          <div style={{ 
            padding: "24px", 
            borderBottom: "1px solid #e2e8f0" 
          }}>
            <h1 style={{ 
              fontSize: "20px", 
              fontWeight: "700", 
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              margin: 0
            }}>
              Kundeportal
            </h1>
            <p style={{ 
              fontSize: "12px", 
              color: "#6b7280", 
              margin: "4px 0 0 0" 
            }}>
              {session.user?.name || session.user?.email}
            </p>
          </div>

          {/* Navigation */}
          <nav style={{ padding: "16px", flex: 1 }}>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              <li>
                <Link href="/customer" style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "12px 16px",
                  borderRadius: "8px",
                  color: "#374151",
                  textDecoration: "none",
                  marginBottom: "4px",
                }}>
                  <LayoutDashboard style={{ width: "20px", height: "20px" }} />
                  Oversikt
                </Link>
              </li>
              <li>
                <Link href="/customer/leads" style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "12px 16px",
                  borderRadius: "8px",
                  color: "#374151",
                  textDecoration: "none",
                  marginBottom: "4px",
                }}>
                  <Users style={{ width: "20px", height: "20px" }} />
                  Mine leads
                </Link>
              </li>
              <li>
                <Link href="/customer/forms" style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "12px 16px",
                  borderRadius: "8px",
                  color: "#374151",
                  textDecoration: "none",
                  marginBottom: "4px",
                }}>
                  <FileText style={{ width: "20px", height: "20px" }} />
                  Skjemaer
                </Link>
              </li>
              <li>
                <Link href="/customer/settings" style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "12px 16px",
                  borderRadius: "8px",
                  color: "#374151",
                  textDecoration: "none",
                  marginBottom: "4px",
                }}>
                  <Settings style={{ width: "20px", height: "20px" }} />
                  Innstillinger
                </Link>
              </li>
            </ul>
          </nav>

          {/* Footer */}
          <div style={{ padding: "16px", borderTop: "1px solid #e2e8f0" }}>
            <Link href="/api/auth/signout" style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "12px 16px",
              borderRadius: "8px",
              color: "#ef4444",
              textDecoration: "none",
            }}>
              <LogOut style={{ width: "20px", height: "20px" }} />
              Logg ut
            </Link>
          </div>
        </aside>

        {/* Main content */}
        <main style={{ 
          marginLeft: "260px", 
          flex: 1,
          minHeight: "100vh"
        }}>
          {children}
        </main>
      </div>
    </SessionProvider>
  );
}

