import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

// POST /api/auth/reset-password - Tilbakestill passord
export async function POST(request: NextRequest) {
  try {
    const { token, email, password } = await request.json();

    if (!token || !email || !password) {
      return NextResponse.json(
        { error: "Mangler påkrevde felt" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Passordet må være minst 8 tegn" },
        { status: 400 }
      );
    }

    // Finn og valider token
    const verificationToken = await db.verificationToken.findFirst({
      where: {
        identifier: email.toLowerCase(),
        token,
        expires: { gt: new Date() }
      }
    });

    if (!verificationToken) {
      return NextResponse.json(
        { error: "Ugyldig eller utløpt token" },
        { status: 400 }
      );
    }

    // Finn bruker
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      return NextResponse.json(
        { error: "Bruker ikke funnet" },
        { status: 404 }
      );
    }

    // Hash nytt passord
    const hashedPassword = await bcrypt.hash(password, 12);

    // Oppdater passord
    await db.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });

    // Slett token
    await db.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: email.toLowerCase(),
          token
        }
      }
    });

    return NextResponse.json({ 
      success: true,
      message: "Passord oppdatert" 
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Kunne ikke tilbakestille passord" },
      { status: 500 }
    );
  }
}

