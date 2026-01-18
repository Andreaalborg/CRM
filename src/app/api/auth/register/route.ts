import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { registerSchema } from "@/lib/validations";
import { slugify } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Valider input
    const validationResult = registerSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, email, password } = validationResult.data;
    const normalizedEmail = email.toLowerCase();

    // Sjekk om brukeren allerede eksisterer
    const existingUser = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "En bruker med denne e-postadressen eksisterer allerede" },
        { status: 400 }
      );
    }

    // Hash passord
    const hashedPassword = await hashPassword(password);

    // Lag unik slug for organisasjon
    const baseSlug = slugify(name);
    let slug = baseSlug;
    let counter = 1;
    
    while (await db.organization.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Opprett organisasjon
    const organization = await db.organization.create({
      data: {
        name: `${name}s bedrift`,
        slug,
        settings: {
          create: {
            primaryColor: "#4F46E5",
            secondaryColor: "#F97316",
          },
        },
      },
    });

    // Opprett bruker
    const user = await db.user.create({
      data: {
        name,
        email: normalizedEmail,
        password: hashedPassword,
        role: "CUSTOMER",
        organizationId: organization.id,
      },
    });

    // Logg aktivitet
    await db.activityLog.create({
      data: {
        userId: user.id,
        action: "user.registered",
        resource: "user",
        resourceId: user.id,
        details: { organizationId: organization.id },
      },
    });

    return NextResponse.json(
      {
        message: "Bruker opprettet",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Noe gikk galt. Prøv igjen senere." },
      { status: 500 }
    );
  }
}
