import { db } from "@/lib/db";
import { AvmeldForm } from "./AvmeldForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Meld av – IntelliSense", robots: { index: false, follow: false } };

// Offentlig avmeldingsside. GET endrer ingenting (lenkeskannere i e-postklienter skal ikke melde av), knappen gjør det.
export default async function Avmeld({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const d = token.length >= 16 ? await db.outreachDraft.findUnique({ where: { token }, select: { til: true } }) : null;
  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-[var(--color-brand,#4f2fd0)]">IntelliSense</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Meld av e-post</h1>
        {d ? <AvmeldForm token={token} til={d.til} /> : <p className="mt-3 text-slate-700">Lenken er ugyldig eller utløpt. Send en e-post til <a className="underline" href="mailto:andreaalborg@intellisenseai.no?subject=Avmelding">andreaalborg@intellisenseai.no</a>, så fjerner vi dere manuelt.</p>}
        <p className="mt-6 text-xs text-slate-600">Les mer i <a className="underline" href="https://intellisenseai.no/personvern">personvernerklæringen</a>.</p>
      </div>
    </main>
  );
}
