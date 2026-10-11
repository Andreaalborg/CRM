import { NextResponse } from "next/server";

// Selvregistrering er stengt. Nye kundebrukere opprettes av admin
// (Dashboard → Admin → Kunder → Ny kunde).
export async function POST() {
  return NextResponse.json(
    { error: "Registrering er stengt. Kontakt IntelliSense for tilgang." },
    { status: 403 }
  );
}

export async function GET() {
  return POST();
}
