"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, Button, Input } from "@/components/ui";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setIsSubmitted(true);
      } else {
        setError(data.error || "Noe gikk galt");
      }
    } catch {
      setError("Kunne ikke sende forespørsel");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: "20px"
      }}>
        <Card style={{ width: "100%", maxWidth: "420px" }}>
          <CardContent style={{ padding: "40px", textAlign: "center" }}>
            <div style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              background: "#dcfce7",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 24px"
            }}>
              <CheckCircle size={32} color="#16a34a" />
            </div>
            <h2 style={{ fontSize: "24px", fontWeight: "700", marginBottom: "12px" }}>
              Sjekk e-posten din
            </h2>
            <p style={{ color: "#6b7280", marginBottom: "24px", lineHeight: "1.6" }}>
              Hvis det finnes en konto med <strong>{email}</strong>, har vi sendt 
              instruksjoner for å tilbakestille passordet ditt.
            </p>
            <Link href="/login">
              <Button variant="outline" style={{ width: "100%" }}>
                <ArrowLeft size={16} style={{ marginRight: "8px" }} />
                Tilbake til innlogging
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      padding: "20px"
    }}>
      <Card style={{ width: "100%", maxWidth: "420px" }}>
        <CardHeader style={{ textAlign: "center", paddingBottom: "0" }}>
          <div style={{
            width: "56px",
            height: "56px",
            borderRadius: "12px",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px"
          }}>
            <Mail size={28} color="#fff" />
          </div>
          <CardTitle style={{ fontSize: "24px" }}>Glemt passord?</CardTitle>
          <p style={{ color: "#6b7280", marginTop: "8px" }}>
            Skriv inn e-postadressen din, så sender vi deg en lenke for å tilbakestille passordet.
          </p>
        </CardHeader>
        <CardContent style={{ padding: "32px" }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "20px" }}>
              <label style={{ 
                display: "block", 
                marginBottom: "8px", 
                fontSize: "14px", 
                fontWeight: "500" 
              }}>
                E-postadresse
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="din@epost.no"
                required
              />
            </div>

            {error && (
              <div style={{
                padding: "12px",
                background: "#fee2e2",
                borderRadius: "8px",
                color: "#dc2626",
                fontSize: "14px",
                marginBottom: "20px"
              }}>
                {error}
              </div>
            )}

            <Button 
              type="submit" 
              disabled={isLoading || !email}
              style={{ width: "100%", marginBottom: "16px" }}
            >
              {isLoading ? "Sender..." : "Send tilbakestillingslenke"}
            </Button>

            <Link 
              href="/login"
              style={{ 
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                color: "#6b7280",
                textDecoration: "none",
                fontSize: "14px"
              }}
            >
              <ArrowLeft size={16} />
              Tilbake til innlogging
            </Link>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}




