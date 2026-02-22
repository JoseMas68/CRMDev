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
  Clock,
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
import { ProjectTimeReport } from "@/components/projects/project-time-report"; // Added ProjectTimeReport import

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
    <div className="space-y-4 sm:space-y-6">
      {/* Header - Mobile optimized */}
      <div className="flex flex-col gap-3 sm:gap-4">
        <Link
          href="/projects"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a proyectos
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight truncate">
                {project.name}
              </h1>
              <Badge
                variant="secondary"
                className={cn("font-normal text-xs sm:text-sm whitespace-nowrap", statusColors[project.status])}
              >
                {statusLabels[project.status]}
              </Badge>
            </div>
            {project.description && (
              <p className="text-sm sm:text-base text-muted-foreground line-clamp-2">
                {project.description}
              </p>
            )}
          </div>

          <Link href={`/projects/${id}/edit`} className="w-full sm:w-auto shrink-0 mt-2 sm:mt-0">
            <Button variant="outline" size="sm" className="w-full sm:w-auto">
              Editar Proyecto
            </Button>
          </Link>
        </div>
      </div>

      {/* Mobile tabs - visible on mobile/tablet */}
      <MobileTabNavigation
        tabs={[
          { value: "overview", label: "Resumen", icon: ListTodo },
          { value: "tasks", label: "Tareas", icon: CheckSquare },
          { value: "time", label: "Horas", icon: Clock }, // Added "Horas" tab
          { value: "github", label: "GitHub", icon: Github },
          { value: "members", label: "Miembros", icon: Users },
        ]}
        defaultValue="overview"
      >
        {/* OVERVIEW TAB */}
        <TabsContent value="overview">
          <div className="lg:hidden space-y-4">
            {/* Stats Grid */}
            <div className="grid gap-3 grid-cols-2">
              {/* Progress */}
              <Card className="border-2">
                <CardHeader className="pb-2 px-4 pt-4">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary"></div>
                    Progreso
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="text-3xl font-bold mb-2">{project.progress}%</div>
                  <Progress value={project.progress} className="h-2" />
                </CardContent>
              </Card>

              {/* Tasks */}
              <Card className="border-2">
                <CardHeader className="pb-2 px-4 pt-4">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <CheckSquare className="h-4 w-4" />
                    Tareas
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="text-3xl font-bold">{project.tasks.length}</div>
                  <p className="text-sm text-muted-foreground">
                    {project.tasks.filter((t) => t.status === "DONE").length}{" "}
                    completadas
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Full width cards */}
            <div className="grid gap-3">
              {/* Deadline */}
              {project.deadline && (
                <Card className="border-2">
                  <CardHeader className="pb-2 px-4 pt-4">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Fecha Límite
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    <div className="text-xl font-bold mb-1">
                      {formatDate(project.deadline)}
                    </div>
                    {new Date(project.deadline) < new Date() &&
                      project.status !== "COMPLETED" && (
                        <p className="text-sm text-destructive">Vencido</p>
                      )}
                  </CardContent>
                </Card>
              )}

              {/* Budget */}
              {project.budget && (
                <Card className="border-2">
                  <CardHeader className="pb-2 px-4 pt-4">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Presupuesto
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    <div className="text-xl font-bold mb-1">
                      {formatCurrency(project.spent, project.currency)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      de {formatCurrency(project.budget, project.currency)}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Client */}
            {project.client && (
              <Card className="border-2">
                <CardHeader className="pb-2 px-4 pt-4">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Cliente
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <Link
                    href={`/clients/${project.client.id}`}
                    className="flex items-center gap-3 hover:bg-muted/50 -mx-2 px-2 py-2 rounded-lg transition-colors"
                  >
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-base">{project.client.name}</p>
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
          </div>
        </TabsContent>

        {/* TASKS TAB */}
        <TabsContent value="tasks">
          <div className="lg:hidden">
            <Card className="border-2">
              <CardHeader className="flex flex-row items-center justify-between px-4 pt-4">
                <CardTitle className="text-lg">Tareas</CardTitle>
                <div className="flex gap-2">
                  {project.repoUrl && (
                    <ImportIssuesButton projectId={id} repoUrl={project.repoUrl} />
                  )}
                  <Link href={`/tasks?projectId=${id}`}>
                    <Button size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <ProjectTaskList tasks={project.tasks} projectId={id} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TIME TRACKING TAB */}
        <TabsContent value="time">
          <div className="lg:hidden">
            <Card className="border-2 mt-4">
              <CardContent className="px-4 py-4">
                <ProjectTimeReport projectId={id} projectName={project.name} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* GITHUB TAB */}
        <TabsContent value="github">
          <div className="lg:hidden">
            {project.repoUrl && (
              <Card className="border-2">
                <CardHeader className="px-4 pt-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Github className="h-5 w-5" />
                    GitHub Commits
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <GitHubCommitsCanvas
                    repoUrl={project.repoUrl}
                    projectName={project.name}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* MEMBERS TAB */}
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

      {/* Desktop layout */}
      <div className="hidden lg:space-y-6 lg:block">
        {/* Stats Grid */}
        <div className="grid gap-4 grid-cols-4">
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

        {/* GitHub Commits */}
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

        {/* Time Tracking Report section (Desktop) */}
        <Card>
          <CardContent className="pt-6">
            <ProjectTimeReport projectId={id} projectName={project.name} />
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
    </div>
  );
}
