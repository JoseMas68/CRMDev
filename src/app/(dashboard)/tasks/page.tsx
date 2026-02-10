import { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";

import { auth } from "@/lib/auth";
import { getTasksForKanban, getTaskStats } from "@/actions/tasks";
import { getProjects } from "@/actions/projects";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { TasksKanban } from "@/components/tasks/tasks-kanban";
import { TaskStats } from "@/components/tasks/task-stats";
import { CreateTaskDialog } from "@/components/tasks/create-task-dialog";

export const metadata: Metadata = {
  title: "Tareas",
  description: "Gestiona tus tareas y mantente organizado",
};

interface TasksPageProps {
  searchParams: Promise<{
    projectId?: string;
  }>;
}

export default async function TasksPage({ searchParams }: TasksPageProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.session.activeOrganizationId) {
    redirect("/select-org");
  }

  const params = await searchParams;
  const projectId = params.projectId;

  // Fetch data in parallel
  const [kanbanResult, statsResult, projectsResult, membersResult] =
    await Promise.all([
      getTasksForKanban(projectId),
      getTaskStats(),
      getProjects({ limit: 100 }),
      // Get organization members for assignee selection
      prisma.member.findMany({
        where: { organizationId: session.session.activeOrganizationId },
        select: {
          user: {
            select: { id: true, name: true, image: true },
          },
        },
      }),
    ]);

  const columns = kanbanResult.success ? kanbanResult.data.columns : [];
  const stats = statsResult.success ? statsResult.data : null;
  const projects = projectsResult.success ? projectsResult.data.projects : [];
  const members = membersResult.map((m) => m.user);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tareas</h1>
          <p className="text-muted-foreground">
            {stats ? `${stats.myTasks} tareas asignadas a ti` : "Gestiona tus tareas"}
          </p>
        </div>

        <CreateTaskDialog
          projects={projects.map((p) => ({ id: p.id, name: p.name }))}
          members={members}
          defaultProjectId={projectId}
        >
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Tarea
          </Button>
        </CreateTaskDialog>
      </div>

      {/* Stats */}
      {stats && <TaskStats stats={stats} />}

      {/* Kanban Board */}
      <TasksKanban
        initialColumns={columns}
        projects={projects.map((p) => ({ id: p.id, name: p.name }))}
        members={members}
        currentProjectId={projectId}
      />
    </div>
  );
}
