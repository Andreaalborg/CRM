import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Ikke autorisert" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "csv";
    const formId = searchParams.get("formId");
    const status = searchParams.get("status");

    // Bygg query
    const where: Record<string, unknown> = {
      organizationId: session.user.organizationId,
    };

    if (formId) {
      where.formId = formId;
    }

    if (status) {
      where.status = status;
    }

    // Hent leads
    const submissions = await db.submission.findMany({
      where,
      include: {
        form: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (format === "csv") {
      // Samle alle unike felt
      const allFields = new Set<string>();
      submissions.forEach((sub) => {
        const data = sub.data as Record<string, unknown>;
        Object.keys(data).forEach((key) => allFields.add(key));
      });

      const fields = ["id", "status", "form", "createdAt", ...Array.from(allFields)];

      // Bygg CSV
      const rows = submissions.map((sub) => {
        const data = sub.data as Record<string, unknown>;
        return fields.map((field) => {
          if (field === "id") return sub.id;
          if (field === "status") return sub.status;
          if (field === "form") return sub.form.name;
          if (field === "createdAt") return sub.createdAt.toISOString();
          const value = data[field];
          if (value === null || value === undefined) return "";
          const str = String(value);
          // Escape quotes and wrap in quotes if contains comma or newline
          if (str.includes(",") || str.includes("\n") || str.includes('"')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        }).join(",");
      });

      const csv = [fields.join(","), ...rows].join("\n");

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="leads-${new Date().toISOString().split("T")[0]}.csv"`,
        },
      });
    }

    // JSON format
    return NextResponse.json(submissions);
  } catch (error) {
    console.error("Error exporting leads:", error);
    return NextResponse.json(
      { error: "Kunne ikke eksportere leads" },
      { status: 500 }
    );
  }
}

