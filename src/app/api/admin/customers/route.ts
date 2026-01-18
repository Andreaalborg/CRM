import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, hashPassword } from "@/lib/auth";
import { db } from "@/lib/db";
import { slugify } from "@/lib/utils";

// GET - Hent alle kunder
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Ikke autorisert" }, { status: 401 });
    }

    const organizations = await db.organization.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        settings: true,
        _count: {
          select: { users: true, forms: true, submissions: true },
        },
      },
    });

    return NextResponse.json(organizations);
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json({ error: "Kunne ikke hente kunder" }, { status: 500 });
  }
}

// POST - Opprett ny kunde
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Ikke autorisert" }, { status: 401 });
    }

    const body = await request.json();
    const {
      companyName,
      contactName,
      contactEmail,
      contactPhone,
      contactPassword,
      website,
      description,
      organizationNumber,
      phone,
      address,
      city,
      postalCode,
      country,
      plan,
      maxUsers,
      maxForms,
      notes,
      primaryColor,
      secondaryColor,
    } = body;

    // Valider påkrevde felt
    if (!companyName || !contactEmail || !contactPassword) {
      return NextResponse.json(
        { error: "Bedriftsnavn, e-post og passord er påkrevd" },
        { status: 400 }
      );
    }

    // Sjekk om e-post allerede eksisterer
    const existingUser = await db.user.findUnique({
      where: { email: contactEmail.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "E-postadressen er allerede i bruk" },
        { status: 400 }
      );
    }

    // Generer unik slug
    let slug = slugify(companyName);
    let slugExists = await db.organization.findUnique({ where: { slug } });
    let counter = 1;
    while (slugExists) {
      slug = `${slugify(companyName)}-${counter}`;
      slugExists = await db.organization.findUnique({ where: { slug } });
      counter++;
    }

    // Hash passord
    const hashedPassword = await hashPassword(contactPassword);

    // Opprett organisasjon og bruker i en transaksjon
    const organization = await db.organization.create({
      data: {
        name: companyName,
        slug,
        website: website || null,
        description: description || null,
        organizationNumber: organizationNumber || null,
        phone: phone || null,
        address: address || null,
        city: city || null,
        postalCode: postalCode || null,
        country: country || "Norge",
        plan: plan || "standard",
        maxUsers: maxUsers || 5,
        maxForms: maxForms || 10,
        notes: notes || null,
        settings: {
          create: {
            primaryColor: primaryColor || "#6366f1",
            secondaryColor: secondaryColor || "#8b5cf6",
          },
        },
        users: {
          create: {
            name: contactName || null,
            email: contactEmail.toLowerCase(),
            password: hashedPassword,
            role: "CUSTOMER",
          },
        },
      },
      include: {
        settings: true,
        users: true,
      },
    });

    // Logg aktivitet
    await db.activityLog.create({
      data: {
        userId: session.user.id,
        action: "admin.customer_created",
        resource: "organization",
        resourceId: organization.id,
        details: { companyName },
      },
    });

    return NextResponse.json(organization, { status: 201 });
  } catch (error) {
    console.error("Error creating customer:", error);
    return NextResponse.json({ error: "Kunne ikke opprette kunde" }, { status: 500 });
  }
}

