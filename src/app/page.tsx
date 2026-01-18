import Link from "next/link";
import { ArrowRight, FileText, Zap, Users, BarChart3, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui";

const features = [
  {
    icon: FileText,
    title: "Skjemabygger",
    description: "Lag profesjonelle skjemaer med drag-and-drop. Embed dem enkelt på din nettside.",
    gradient: "from-indigo-500 to-purple-600",
  },
  {
    icon: Users,
    title: "Lead-håndtering",
    description: "Se alle leads på ett sted. Filtrer, søk og eksporter til CSV.",
    gradient: "from-emerald-500 to-teal-600",
  },
  {
    icon: Zap,
    title: "E-post Automasjon",
    description: "Send automatiske e-poster når noen fyller ut skjemaet ditt.",
    gradient: "from-orange-500 to-red-600",
  },
  {
    icon: BarChart3,
    title: "Statistikk",
    description: "Se hvordan skjemaene dine presterer med detaljert analyse.",
    gradient: "from-blue-500 to-cyan-600",
  },
];

const benefits = [
  "Ingen koding nødvendig",
  "Responsivt design",
  "GDPR-kompatibel",
  "Ubegrensede skjemaer",
];

export default function HomePage() {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      {/* Header */}
      <header style={{ 
        position: "sticky", 
        top: 0, 
        zIndex: 50, 
        backgroundColor: "rgba(255,255,255,0.9)", 
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid #e2e8f0"
      }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "64px" }}>
            <Link href="/" style={{ display: "flex", alignItems: "center", gap: "12px", textDecoration: "none" }}>
              <div style={{ 
                width: "40px", 
                height: "40px", 
                borderRadius: "12px", 
                background: "linear-gradient(135deg, #4F46E5, #7C3AED)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 14px rgba(79, 70, 229, 0.4)"
              }}>
                <FileText style={{ width: "20px", height: "20px", color: "white" }} />
              </div>
              <span style={{ fontWeight: 700, fontSize: "20px", color: "#0f172a" }}>Kundedata</span>
            </Link>
            
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <Link href="/login">
                <Button variant="ghost">Logg inn</Button>
              </Link>
              <Link href="/register">
                <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
                  Kom i gang
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section style={{ position: "relative", overflow: "hidden", padding: "80px 0" }}>
        {/* Bakgrunnsgrafikk */}
        <div style={{ position: "absolute", inset: 0, zIndex: -1, overflow: "hidden" }}>
          <div style={{ 
            position: "absolute", 
            top: "20%", 
            left: "20%", 
            width: "400px", 
            height: "400px", 
            background: "#818cf8", 
            opacity: 0.15, 
            borderRadius: "50%", 
            filter: "blur(80px)" 
          }} />
          <div style={{ 
            position: "absolute", 
            top: "40%", 
            right: "20%", 
            width: "500px", 
            height: "500px", 
            background: "#a855f7", 
            opacity: 0.1, 
            borderRadius: "50%", 
            filter: "blur(100px)" 
          }} />
        </div>

        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 24px" }}>
          <div style={{ textAlign: "center", maxWidth: "800px", margin: "0 auto" }}>
            <div style={{ 
              display: "inline-flex", 
              alignItems: "center", 
              gap: "8px", 
              padding: "8px 16px", 
              borderRadius: "9999px", 
              backgroundColor: "#eef2ff", 
              border: "1px solid #c7d2fe",
              color: "#4338ca", 
              fontSize: "14px", 
              fontWeight: 500, 
              marginBottom: "32px" 
            }}>
              <Zap style={{ width: "16px", height: "16px" }} />
              Nyhet: E-post automasjon nå tilgjengelig
            </div>
            
            <h1 style={{ 
              fontSize: "clamp(2.5rem, 5vw, 4rem)", 
              fontWeight: 700, 
              marginBottom: "24px", 
              lineHeight: 1.1, 
              letterSpacing: "-0.02em",
              color: "#0f172a"
            }}>
              Samle leads.{" "}
              <span style={{ 
                background: "linear-gradient(135deg, #4F46E5, #7C3AED, #DB2777)", 
                WebkitBackgroundClip: "text", 
                WebkitTextFillColor: "transparent" 
              }}>
                Automatiser.
              </span>
              <br />Voks raskere.
            </h1>
            
            <p style={{ 
              fontSize: "20px", 
              color: "#475569", 
              marginBottom: "40px", 
              maxWidth: "600px", 
              margin: "0 auto 40px",
              lineHeight: 1.7
            }}>
              Bygg profesjonelle skjemaer, samle inn leads og automatiser oppfølging 
              – alt på ett sted. Erstatt dyre verktøy med én enkel løsning.
            </p>
            
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: "16px", marginBottom: "48px" }}>
              <Link href="/register">
                <Button size="xl" className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-xl text-lg px-8 group">
                  Start gratis
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link href="#features">
                <Button variant="outline" size="xl" className="text-lg px-8 border-2">
                  Se funksjoner
                </Button>
              </Link>
            </div>
            
            {/* Trust badges */}
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: "24px" }}>
              {benefits.map((benefit) => (
                <div key={benefit} style={{ display: "flex", alignItems: "center", gap: "8px", color: "#64748b", fontSize: "14px" }}>
                  <CheckCircle2 style={{ width: "20px", height: "20px", color: "#10b981" }} />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" style={{ padding: "96px 0", backgroundColor: "white" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 24px" }}>
          <div style={{ textAlign: "center", marginBottom: "64px" }}>
            <h2 style={{ fontSize: "clamp(1.875rem, 4vw, 2.5rem)", fontWeight: 700, marginBottom: "16px", color: "#0f172a" }}>
              Alt du trenger for å samle leads
            </h2>
            <p style={{ fontSize: "18px", color: "#64748b", maxWidth: "600px", margin: "0 auto" }}>
              Fra skjemabygging til e-post automasjon – vi har verktøyene du trenger.
            </p>
          </div>
          
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", 
            gap: "24px" 
          }}>
            {features.map((feature) => (
              <div 
                key={feature.title}
                style={{ 
                  padding: "32px", 
                  borderRadius: "16px", 
                  backgroundColor: "white", 
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                  transition: "all 0.3s ease"
                }}
                className="hover:shadow-xl hover:border-slate-300"
              >
                <div 
                  className={`bg-gradient-to-br ${feature.gradient}`}
                  style={{ 
                    width: "56px", 
                    height: "56px", 
                    borderRadius: "16px", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center", 
                    marginBottom: "24px",
                    boxShadow: "0 4px 14px rgba(0,0,0,0.15)"
                  }}
                >
                  <feature.icon style={{ width: "28px", height: "28px", color: "white" }} />
                </div>
                <h3 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "12px", color: "#0f172a" }}>
                  {feature.title}
                </h3>
                <p style={{ color: "#64748b", lineHeight: 1.6, margin: 0 }}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "96px 0", backgroundColor: "#f8fafc" }}>
        <div style={{ maxWidth: "960px", margin: "0 auto", padding: "0 24px" }}>
          <div style={{ 
            position: "relative",
            padding: "64px 48px", 
            borderRadius: "24px", 
            background: "linear-gradient(135deg, #4F46E5, #7C3AED, #DB2777)",
            overflow: "hidden",
            boxShadow: "0 25px 50px -12px rgba(79, 70, 229, 0.35)"
          }}>
            {/* Dekorative elementer */}
            <div style={{ position: "absolute", inset: 0, opacity: 0.3 }}>
              <div style={{ position: "absolute", top: "-50px", left: "-50px", width: "200px", height: "200px", borderRadius: "50%", background: "rgba(255,255,255,0.2)", filter: "blur(40px)" }} />
              <div style={{ position: "absolute", bottom: "-80px", right: "-80px", width: "300px", height: "300px", borderRadius: "50%", background: "rgba(255,255,255,0.1)", filter: "blur(60px)" }} />
            </div>
            
            <div style={{ position: "relative", zIndex: 10, textAlign: "center" }}>
              <h2 style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 700, color: "white", marginBottom: "24px" }}>
                Klar til å komme i gang?
              </h2>
              <p style={{ fontSize: "18px", color: "rgba(255,255,255,0.9)", marginBottom: "40px", maxWidth: "500px", margin: "0 auto 40px" }}>
                Opprett din første skjema på under 5 minutter. 
                Ingen kredittkort nødvendig.
              </p>
              <Link href="/register">
                <Button 
                  size="xl" 
                  className="bg-white text-indigo-700 hover:bg-slate-100 shadow-xl text-lg px-10 font-semibold"
                >
                  Opprett gratis konto
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ backgroundColor: "white", borderTop: "1px solid #e2e8f0", padding: "48px 0" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 24px" }}>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ 
                width: "40px", 
                height: "40px", 
                borderRadius: "12px", 
                background: "linear-gradient(135deg, #4F46E5, #7C3AED)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <FileText style={{ width: "20px", height: "20px", color: "white" }} />
              </div>
              <span style={{ fontWeight: 700, fontSize: "18px", color: "#0f172a" }}>Kundedata</span>
            </div>
            
            <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>
              © {new Date().getFullYear()} Kundedata. Alle rettigheter reservert.
            </p>
            
            <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
              <Link href="/privacy" style={{ fontSize: "14px", color: "#64748b", textDecoration: "none" }}>
                Personvern
              </Link>
              <Link href="/terms" style={{ fontSize: "14px", color: "#64748b", textDecoration: "none" }}>
                Vilkår
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
