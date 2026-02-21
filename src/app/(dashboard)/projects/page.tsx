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
    <div className="space-y-4 sm:space-y-6">
      {/* Header - Mobile optimized */}
      <div className="flex flex-col gap-3 sm:gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Proyectos</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Gestiona tus proyectos y su progreso
            </p>
          </div>

          <CreateProjectDialog
            clients={clients.map((c) => ({ id: c.id, name: c.name }))}
          >
            <Button size="default" className="sm:hidden">
              <Plus className="h-5 w-5" />
            </Button>
          </CreateProjectDialog>
        </div>

        <div className="hidden sm:block">
          <CreateProjectDialog
            clients={clients.map((c) => ({ id: c.id, name: c.name }))}
          >
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Proyecto
            </Button>
          </CreateProjectDialog>
        </div>
      </div>

      {/* Stats - Hide on mobile to save space */}
      <div className="hidden sm:block">
        {stats && <ProjectStats stats={stats} />}
      </div>

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
