import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    // Sjekk om Supabase er konfigurert
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json(
        { error: "Bildeopplasting er ikke konfigurert. Mangler Supabase-konfigurasjon." },
        { status: 503 }
      );
    }
    
    // Dynamisk import for å unngå build-feil
    const { uploadFile, isValidImageType, isValidFileSize } = await import("@/lib/storage");
    
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Ikke autorisert" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = (formData.get('folder') as string) || 'images';

    if (!file) {
      return NextResponse.json(
        { error: "Ingen fil lastet opp" },
        { status: 400 }
      );
    }

    // Valider filtype
    if (!isValidImageType(file)) {
      return NextResponse.json(
        { error: "Ugyldig filtype. Kun bilder (JPG, PNG, GIF, WebP, SVG) er tillatt." },
        { status: 400 }
      );
    }

    // Valider filstørrelse (maks 5MB)
    if (!isValidFileSize(file, 5)) {
      return NextResponse.json(
        { error: "Filen er for stor. Maks 5MB." },
        { status: 400 }
      );
    }

    // Last opp fil
    const result = await uploadFile(file, folder);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Kunne ikke laste opp fil" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      url: result.url,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Intern serverfeil" },
      { status: 500 }
    );
  }
}


