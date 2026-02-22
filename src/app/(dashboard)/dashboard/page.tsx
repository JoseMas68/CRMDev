import { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Panel de control de CRMDev",
};

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.session.activeOrganizationId) {
    redirect("/login");
  }

  const orgId = session.session.activeOrganizationId;

  // Get real data from database
  const [
    tasks,
    projects,
    clients,
    timeEntriesToday,
    recentTasks,
    recentTickets,
  ] = await Promise.all([
    // Task statistics
    prisma.task.findMany({
      where: { organizationId: orgId },
      select: { status: true },
    }),
    // Projects
    prisma.project.findMany({
      where: { organizationId: orgId },
      select: { id: true, status: true },
    }),
    // Clients
    prisma.client.count({
      where: { organizationId: orgId },
    }),
    // Time entries for today
    prisma.timeEntry.findMany({
      where: {
        organizationId: orgId,
        userId: session.user.id,
        startTime: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    }),
    // Recent tasks
    prisma.task.findMany({
      where: { organizationId: orgId },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        updatedAt: true,
        project: {
          select: { name: true },
        },
      },
    }),
    // Recent tickets
    prisma.ticket.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
      },
    }),
  ]);

  // Calculate statistics
  const activeTasks = tasks.filter(t => t.status !== "DONE" && t.status !== "CANCELLED").length;
  const activeProjects = projects.filter(p => p.status === "IN_PROGRESS").length;

  // Calculate time today
  const totalSecondsToday = timeEntriesToday.reduce((acc, entry) => {
    const start = new Date(entry.startTime).getTime();
    const end = entry.endTime ? new Date(entry.endTime).getTime() : Date.now();
    return acc + (end - start) / 1000;
  }, 0);

  const hoursToday = Math.floor(totalSecondsToday / 3600);
  const minutesToday = Math.floor((totalSecondsToday % 3600) / 60);
  const timeTodayStr = `${hoursToday}h ${minutesToday}m`;

  // Get today's date for display
  const today = new Date();
  const formattedDate = format(today, "EEEE, d 'de' MMMM", { locale: es });

  return (
    <div className="space-y-4 md:space-y-6 px-4 sm:px-0">
      {/* Welcome Section */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
            Hola, {session.user.name?.split(" ")[0] ?? "Developer"}
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground mt-1">
            {formattedDate}
          </p>
        </div>
        <div className="hidden sm:flex">
          <Link href="/tasks">
            <Button size="lg" className="gap-2">
              <Plus className="h-4 w-4" />
              Nueva Tarea
            </Button>
          </Link>
        </div>
      </div>

      {/* Mobile quick action */}
      <div className="flex sm:hidden">
        <Link href="/tasks" className="w-full">
          <Button size="lg" className="w-full gap-2">
            <Plus className="h-4 w-4" />
            Nueva Tarea
          </Button>
        </Link>
      </div>

      {/* Stats Overview - Mobile cards, Desktop grid */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              Tareas Activas
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-xl sm:text-2xl font-bold">{activeTasks}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Tareas pendientes
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              Proyectos
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-xl sm:text-2xl font-bold">{projects.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {activeProjects} activos
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              Clientes
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-xl sm:text-2xl font-bold">{clients}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total clientes
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              Tiempo Hoy
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-xl sm:text-2xl font-bold">{timeTodayStr}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Tiempo registrado hoy
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-4 md:gap-6 lg:grid-cols-3">
        {/* Tasks Quick View - Takes 2 columns on large screens */}
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Tareas Recientes</CardTitle>
                <CardDescription>
                  {recentTasks.length > 0 ? "Tus últimas tareas actualizadas" : "No hay tareas todavía"}
                </CardDescription>
              </div>
              {recentTasks.length > 0 && (
                <Link href="/tasks">
                  <Button variant="ghost" size="sm">
                    Ver todas
                  </Button>
                </Link>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {recentTasks.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No hay tareas. Crea tu primera tarea.</p>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {recentTasks.map((task) => {
                  const statusColors: Record<string, string> = {
                    TODO: "bg-gray-500",
                    IN_PROGRESS: "bg-blue-500",
                    IN_REVIEW: "bg-yellow-500",
                    DONE: "bg-green-500",
                    CANCELLED: "bg-red-500",
                  };

                  const statusLabels: Record<string, string> = {
                    TODO: "Por Hacer",
                    IN_PROGRESS: "En Progreso",
                    IN_REVIEW: "En Revisión",
                    DONE: "Completada",
                    CANCELLED: "Cancelada",
                  };

                  return (
                    <Link
                      key={task.id}
                      href={`/tasks?taskId=${task.id}`}
                      className="block"
                    >
                      <div className="flex items-center justify-between p-3 sm:p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={cn(
                            "w-2 h-2 rounded-full flex-shrink-0",
                            statusColors[task.status]
                          )} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{task.title}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {task.project?.name || "Sin proyecto"}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground flex-shrink-0">
                          {statusLabels[task.status]}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Column */}
        <div className="space-y-4 md:space-y-6">
          {/* Time Tracker Widget */}
          <Card className="border-2 border-primary/20 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Time Tracker</CardTitle>
                  <CardDescription className="text-xs">
                    Registra tu tiempo
                  </CardDescription>
                </div>
                <Link href="/time">
                  <Button variant="ghost" size="sm">
                    Ver todo
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Today's Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Hoy</span>
                  <span className="font-semibold">{timeTodayStr}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Tiempo total registrado hoy
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Support Widget */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Soporte</CardTitle>
                  <CardDescription className="text-xs">
                    {recentTickets.length > 0 ? "Tickets recientes" : "No hay tickets"}
                  </CardDescription>
                </div>
                {recentTickets.length > 0 && (
                  <Link href="/support">
                    <Button variant="ghost" size="sm">
                      Ver todo
                    </Button>
                  </Link>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {recentTickets.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-xs text-muted-foreground">No hay tickets de soporte</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentTickets.map((ticket) => {
                    const statusColors: Record<string, string> = {
                      OPEN: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
                      IN_PROGRESS: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
                      RESOLVED: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
                    };

                    const statusLabels: Record<string, string> = {
                      OPEN: "Abierto",
                      IN_PROGRESS: "En progreso",
                      RESOLVED: "Resuelto",
                    };

                    const timeDiff = Math.floor((Date.now() - new Date(ticket.createdAt).getTime()) / (1000 * 60 * 60));
                    const timeAgo = timeDiff < 1 ? "hace un momento" : timeDiff < 24 ? `hace ${timeDiff}h` : `hace ${Math.floor(timeDiff / 24)}d`;

                    return (
                      <Link
                        key={ticket.id}
                        href={`/support/${ticket.id}`}
                        className="block p-2 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <p className="text-xs font-medium truncate mb-1">{ticket.title}</p>
                        <div className="flex items-center justify-between">
                          <span className={cn("text-[10px] px-2 py-0.5 rounded", statusColors[ticket.status])}>
                            {statusLabels[ticket.status]}
                          </span>
                          <span className="text-[10px] text-muted-foreground">{timeAgo}</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Links Grid */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <Link href="/projects" className="group">
          <Card className="transition-all hover:shadow-lg hover:border-primary/50">
            <CardContent className="p-4 sm:p-6">
              <h3 className="font-semibold text-sm sm:text-base mb-1">Proyectos</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">Gestiona tus proyectos</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/clients" className="group">
          <Card className="transition-all hover:shadow-lg hover:border-primary/50">
            <CardContent className="p-4 sm:p-6">
              <h3 className="font-semibold text-sm sm:text-base mb-1">Clientes</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">Base de clientes</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/pipeline" className="group">
          <Card className="transition-all hover:shadow-lg hover:border-primary/50">
            <CardContent className="p-4 sm:p-6">
              <h3 className="font-semibold text-sm sm:text-base mb-1">Pipeline</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">Ventas y oportunidades</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/tasks" className="group">
          <Card className="transition-all hover:shadow-lg hover:border-primary/50">
            <CardContent className="p-4 sm:p-6">
              <h3 className="font-semibold text-sm sm:text-base mb-1">Tareas</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">Kanban de tareas</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
