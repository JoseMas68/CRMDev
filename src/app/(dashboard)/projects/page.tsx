import { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";

import { auth } from "@/lib/auth";
import { getProjects, getProjectStats } from "@/actions/projects";
import { getClients } from "@/actions/clients";
import { Button } from "@/components/ui/button";
import { ProjectsGrid } from "@/components/projects/projects-grid";
import { CreateProjectDialog } from "@/components/projects/create-project-dialog";
import { ProjectStats } from "@/components/projects/project-stats";

export const metadata: Metadata = {
  title: "Proyectos",
  description: "Gestiona tus proyectos y su progreso",
};

interface ProjectsPageProps {
  searchParams: Promise<{
    page?: string;
    status?: string;
    search?: string;
  }>;
}

export default async function ProjectsPage({ searchParams }: ProjectsPageProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.session.activeOrganizationId) {
    redirect("/select-org");
  }

  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const status = params.status as any;
  const search = params.search;

  const [projectsResult, statsResult, clientsResult] = await Promise.all([
    getProjects({ page, status, search, limit: 12 }),
    getProjectStats(),
    getClients({ limit: 100 }),
  ]);

  const projects = projectsResult.success ? projectsResult.data.projects : [];
  const total = projectsResult.success ? projectsResult.data.total : 0;
  const stats = statsResult.success ? statsResult.data : null;
  const clients = clientsResult.success ? clientsResult.data.clients : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Proyectos</h1>
          <p className="text-muted-foreground">
            Gestiona tus proyectos y trackea su progreso
          </p>
        </div>

        <CreateProjectDialog
          clients={clients.map((c) => ({ id: c.id, name: c.name }))}
        >
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Proyecto
          </Button>
        </CreateProjectDialog>
      </div>

      {/* Stats */}
      {stats && <ProjectStats stats={stats} />}

      {/* Projects Grid */}
      <ProjectsGrid
        projects={projects}
        total={total}
        page={page}
        pageSize={12}
        currentStatus={status}
        currentSearch={search}
      />
    </div>
  );
}
