import { Metadata } from "next";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { auth } from "@/lib/auth";
import { getProject } from "@/actions/projects";
import { getClients } from "@/actions/clients";
import { EditProjectForm } from "@/components/projects/edit-project-form";

interface EditProjectPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: EditProjectPageProps): Promise<Metadata> {
  const { id } = await params;
  const result = await getProject(id);

  if (!result.success) {
    return { title: "Proyecto no encontrado" };
  }

  return {
    title: `Editar ${result.data.name}`,
    description: `Editar proyecto ${result.data.name}`,
  };
}

export default async function EditProjectPage({ params }: EditProjectPageProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.session.activeOrganizationId) {
    redirect("/select-org");
  }

  const { id } = await params;
  const [projectResult, clientsResult] = await Promise.all([
    getProject(id),
    getClients({ limit: 100 }),
  ]);

  if (!projectResult.success) {
    notFound();
  }

  const project = projectResult.data;
  const clients = clientsResult.success ? clientsResult.data.clients : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Link
          href={`/projects/${id}`}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver al proyecto
        </Link>

        <div>
          <h1 className="text-2xl font-bold tracking-tight">Editar Proyecto</h1>
          <p className="text-muted-foreground">
            Modifica los detalles de {project.name}
          </p>
        </div>
      </div>

      {/* Edit Form */}
      <EditProjectForm
        project={project}
        clients={clients.map((c) => ({ id: c.id, name: c.name }))}
      />
    </div>
  );
}
