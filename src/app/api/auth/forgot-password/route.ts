import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import crypto from "crypto";

// POST /api/auth/forgot-password - Send tilbakestillingslenke
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "E-post er påkrevd" },
        { status: 400 }
      );
    }

    // Finn bruker
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    // Alltid returner suksess for å unngå user enumeration
    if (!user) {
      return NextResponse.json({ 
        success: true,
        message: "Hvis e-postadressen finnes, vil du motta en e-post" 
      });
    }

    // Generer token
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 3600000); // 1 time

    // Lagre token i database
    await db.verificationToken.create({
      data: {
        identifier: email.toLowerCase(),
        token,
        expires,
      }
    });

    // Send e-post
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const resetUrl = `${baseUrl}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

    await sendEmail({
      to: email,
      subject: "Tilbakestill passord",
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Tilbakestill passord</h1>
          </div>
          <div style="padding: 40px; background: #ffffff; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
              Hei${user.name ? ` ${user.name}` : ""},
            </p>
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
              Vi mottok en forespørsel om å tilbakestille passordet ditt. Klikk på knappen nedenfor for å velge et nytt passord:
            </p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${resetUrl}" style="
                display: inline-block;
                padding: 14px 32px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                text-decoration: none;
                border-radius: 8px;
                font-weight: 600;
                font-size: 16px;
              ">
                Tilbakestill passord
              </a>
            </div>
            <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
              Denne lenken utløper om <strong>1 time</strong>.
            </p>
            <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
              Hvis du ikke ba om å tilbakestille passordet ditt, kan du trygt ignorere denne e-posten.
            </p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">
            <p style="color: #9ca3af; font-size: 12px; text-align: center;">
              Hvis knappen ikke fungerer, kopier og lim inn denne lenken i nettleseren:<br>
              <a href="${resetUrl}" style="color: #6366f1;">${resetUrl}</a>
            </p>
          </div>
        </div>
      `,
    });

    return NextResponse.json({ 
      success: true,
      message: "E-post sendt" 
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Kunne ikke sende e-post" },
      { status: 500 }
    );
  }
}

