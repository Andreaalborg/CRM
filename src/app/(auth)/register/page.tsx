import Link from "next/link";

export const metadata = { title: "Registrering stengt" };

export default function RegisterPage() {
  return (
    <div style={{ maxWidth: 420, margin: "10vh auto", padding: 24, textAlign: "center" }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>Registrering er stengt</h1>
      <p style={{ marginBottom: 24 }}>
        Kontoer opprettes av IntelliSense. Kontakt oss hvis du trenger tilgang.
      </p>
      <Link href="/login" style={{ color: "#4A30C2", fontWeight: 600 }}>Gå til innlogging</Link>
    </div>
  );
}
