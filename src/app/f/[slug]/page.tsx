import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { Metadata } from "next";
import { PublicForm } from "@/components/forms/public-form";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getForm(slug: string) {
  const form = await db.form.findFirst({
    where: { 
      slug,
      status: "PUBLISHED",
    },
    include: {
      fields: {
        orderBy: { order: "asc" },
      },
      organization: {
        select: {
          name: true,
          logo: true,
          settings: {
            select: {
              primaryColor: true,
            },
          },
        },
      },
    },
  });

  return form;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const form = await getForm(slug);

  if (!form) {
    return { title: "Skjema ikke funnet" };
  }

  return {
    title: form.name,
    description: form.description || `Fyll ut skjemaet fra ${form.organization.name}`,
  };
}

export default async function PublicFormPage({ params }: PageProps) {
  const { slug } = await params;
  const form = await getForm(slug);

  if (!form) {
    notFound();
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{ 
        backgroundColor: form.backgroundColor,
        fontFamily: form.fontFamily,
      }}
    >
      <PublicForm form={form} />
    </div>
  );
}






