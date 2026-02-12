import { Metadata } from "next";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  User,
  Building2,
  DollarSign,
  CheckSquare,
  Plus,
  ListTodo,
  Github,
  Users,
} from "lucide-react";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getProject } from "@/actions/projects";
import { formatDate, formatCurrency, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ProjectTaskList } from "@/components/projects/project-task-list";
import { GitHubCommitsCanvas } from "@/components/projects/github-commits-canvas";
import { ImportIssuesButton } from "@/components/projects/import-issues-button";
import { ProjectMembersSection } from "@/components/projects/project-members-section";
import { WpMonitoringCard } from "@/components/projects/wp-monitoring-card";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { MobileTabNavigation } from "@/components/mobile/tab-navigation";

interface ProjectPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: ProjectPageProps): Promise<Metadata> {
  const { id } = await params;
  const result = await getProject(id);

  if (!result.success) {
    return { title: "Proyecto no encontrado" };
  }

  return {
    title: result.data.name,
    description: result.data.description || `Proyecto ${result.data.name}`,
  };
}

const statusColors: Record<string, string> = {
  NOT_STARTED: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  IN_PROGRESS: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  ON_HOLD: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  COMPLETED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

const statusLabels: Record<string, string> = {
  NOT_STARTED: "No Iniciado",
  IN_PROGRESS: "En Progreso",
  ON_HOLD: "Pausado",
  COMPLETED: "Completado",
  CANCELLED: "Cancelado",
};

export default async function ProjectPage({ params }: ProjectPageProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.session.activeOrganizationId) {
    redirect("/select-org");
  }

  const { id } = await params;
  const result = await getProject(id);

  if (!result.success) {
    notFound();
  }

  const project = result.data;

  // Determine if user can manage project members
  const orgMember = await prisma.member.findUnique({
    where: {
      organizationId_userId: {
        organizationId: session.session.activeOrganizationId!,
        userId: session.user.id,
      },
    },
    select: { role: true },
  });
  const canManageMembers = orgMember?.role === "owner" || orgMember?.role === "admin";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Link
          href="/projects"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a proyectos
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">
                {project.name}
              </h1>
              <Badge
                variant="secondary"
                className={cn("font-normal", statusColors[project.status])}
              >
                {statusLabels[project.status]}
              </Badge>
            </div>
            {project.description && (
              <p className="text-muted-foreground">{project.description}</p>
            )}
          </div>

          <div className="flex gap-2">
            <Link href={`/projects/${id}/edit`}>
              <Button variant="outline">Editar</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile tabs - solo visible en móvil */}
      <MobileTabNavigation
        tabs={[
          { value: "overview", label: "Resumen", icon: ListTodo },
          { value: "tasks", label: "Tareas", icon: CheckSquare },
          { value: "github", label: "GitHub", icon: Github },
          { value: "members", label: "Miembros", icon: Users },
        ]}
        defaultValue="overview"
      >
        <TabsContent value="overview">
          <div className="lg:hidden space-y-4">
            <div className="grid gap-4 grid-cols-2">
              {/* Progress */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Progreso
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{project.progress}%</div>
                </CardContent>
              </Card>

              {/* Tasks */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Tareas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{project.tasks.length}</div>
                  <p className="text-sm text-muted-foreground">
                    {project.tasks.filter((t) => t.status === "DONE").length}{" "}
                    completadas
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="tasks">
          <div className="lg:hidden">
            <ProjectTaskList tasks={project.tasks} projectId={id} />
          </div>
        </TabsContent>

        <TabsContent value="github">
          <div className="lg:hidden">
            {project.repoUrl && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">GitHub Commits</CardTitle>
                </CardHeader>
                <CardContent>
                  <GitHubCommitsCanvas
                    repoUrl={project.repoUrl}
                    projectName={project.name}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="members">
          <div className="lg:hidden">
            <ProjectMembersSection
              projectId={id}
              members={project.projectMembers}
              canManage={canManageMembers}
            />
          </div>
        </TabsContent>
      </MobileTabNavigation>

      {/* Project info cards - desktop */}
      <div className="hidden lg:grid lg:gap-4 lg:grid-cols-4">
        {/* Progress */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Progreso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">{project.progress}%</div>
            <Progress value={project.progress} className="h-2" />
          </CardContent>
        </Card>

        {/* Tasks */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckSquare className="h-4 w-4" />
              Tareas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{project.tasks.length}</div>
            <p className="text-sm text-muted-foreground">
              {project.tasks.filter((t) => t.status === "DONE").length}{" "}
              completadas
            </p>
          </CardContent>
        </Card>

        {/* Deadline */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Fecha Limite
            </CardTitle>
          </CardHeader>
          <CardContent>
            {project.deadline ? (
              <>
                <div className="text-2xl font-bold">
                  {formatDate(project.deadline)}
                </div>
                {new Date(project.deadline) < new Date() &&
                  project.status !== "COMPLETED" && (
                    <p className="text-sm text-destructive">Vencido</p>
                  )}
              </>
            ) : (
              <div className="text-muted-foreground">Sin fecha limite</div>
            )}
          </CardContent>
        </Card>

        {/* Budget */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Presupuesto
            </CardTitle>
          </CardHeader>
          <CardContent>
            {project.budget ? (
              <>
                <div className="text-2xl font-bold">
                  {formatCurrency(project.spent, project.currency)}
                </div>
                <p className="text-sm text-muted-foreground">
                  de {formatCurrency(project.budget, project.currency)}
                </p>
              </>
            ) : (
              <div className="text-muted-foreground">Sin presupuesto</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Client info */}
      {project.client && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Cliente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Link
              href={`/clients/${project.client.id}`}
              className="flex items-center gap-4 hover:bg-muted/50 -mx-2 px-2 py-2 rounded-lg transition-colors"
            >
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">{project.client.name}</p>
                {project.client.email && (
                  <p className="text-sm text-muted-foreground">
                    {project.client.email}
                  </p>
                )}
              </div>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* WordPress Monitoring */}
      <WpMonitoringCard projectId={id} wpUrl={project.wpUrl} />

      {/* Project Members */}
      <ProjectMembersSection
        projectId={id}
        members={project.projectMembers}
        canManage={canManageMembers}
      />

      {/* GitHub Commits - only for GitHub projects */}
      {project.repoUrl && (
        <GitHubCommitsCanvas
          repoUrl={project.repoUrl}
          projectName={project.name}
        />
      )}

      {/* Tasks section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Tareas</CardTitle>
          <div className="flex gap-2">
            {project.repoUrl && (
              <ImportIssuesButton projectId={id} repoUrl={project.repoUrl} />
            )}
            <Link href={`/tasks?projectId=${id}`}>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Nueva Tarea
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <ProjectTaskList tasks={project.tasks} projectId={id} />
        </CardContent>
      </Card>

      {/* Activity section */}
      {project.activities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Actividad Reciente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {project.activities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-4">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                    {activity.user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{activity.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {activity.user.name} • {formatDate(activity.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
