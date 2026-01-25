"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, Button, Input } from "@/components/ui";
import { Lock, CheckCircle, XCircle } from "lucide-react";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token || !email) {
      setError("Ugyldig eller manglende tilbakestillingslenke");
    }
  }, [token, email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Passordet må være minst 8 tegn");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passordene stemmer ikke overens");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setIsSuccess(true);
      } else {
        setError(data.error || "Kunne ikke tilbakestille passord");
      }
    } catch {
      setError("Noe gikk galt");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
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
              Passord oppdatert!
            </h2>
            <p style={{ color: "#6b7280", marginBottom: "24px" }}>
              Passordet ditt har blitt tilbakestilt. Du kan nå logge inn med ditt nye passord.
            </p>
            <Link href="/login">
              <Button style={{ width: "100%" }}>
                Gå til innlogging
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!token || !email) {
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
              background: "#fee2e2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 24px"
            }}>
              <XCircle size={32} color="#dc2626" />
            </div>
            <h2 style={{ fontSize: "24px", fontWeight: "700", marginBottom: "12px" }}>
              Ugyldig lenke
            </h2>
            <p style={{ color: "#6b7280", marginBottom: "24px" }}>
              Tilbakestillingslenken er ugyldig eller har utløpt.
            </p>
            <Link href="/forgot-password">
              <Button style={{ width: "100%" }}>
                Be om ny lenke
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
            <Lock size={28} color="#fff" />
          </div>
          <CardTitle style={{ fontSize: "24px" }}>Nytt passord</CardTitle>
          <p style={{ color: "#6b7280", marginTop: "8px" }}>
            Velg et nytt passord for kontoen din
          </p>
        </CardHeader>
        <CardContent style={{ padding: "32px" }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "16px" }}>
              <label style={{ 
                display: "block", 
                marginBottom: "8px", 
                fontSize: "14px", 
                fontWeight: "500" 
              }}>
                Nytt passord
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 tegn"
                required
                minLength={8}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ 
                display: "block", 
                marginBottom: "8px", 
                fontSize: "14px", 
                fontWeight: "500" 
              }}>
                Bekreft passord
              </label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Skriv passordet på nytt"
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
              disabled={isLoading}
              style={{ width: "100%" }}
            >
              {isLoading ? "Lagrer..." : "Oppdater passord"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
      }}>
        <p style={{ color: "#fff" }}>Laster...</p>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}




