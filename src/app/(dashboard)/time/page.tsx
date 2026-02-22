import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Clock, Calendar, DollarSign } from "lucide-react";

import { auth } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TimeTracker } from "@/components/time/time-tracker";
import { getTasks } from "@/actions/tasks";
import { getTimeStats } from "@/actions/time";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDuration } from "@/lib/utils";

export default async function TimeTrackingPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.session.activeOrganizationId) {
    redirect("/login");
  }

  // Fetch tasks for the time tracker
  const tasksResult = await getTasks({ limit: 50 });
  const tasks = tasksResult.success ? tasksResult.data.tasks : [];

  const statsResult = await getTimeStats();
  const stats = statsResult.success ? statsResult.data : null;

  // Fetch recent time entries
  const recentEntries = await prisma.timeEntry.findMany({
    where: {
      organizationId: session.session.activeOrganizationId,
      userId: session.user.id,
    },
    include: {
      task: {
        select: { title: true, project: { select: { name: true } } }
      }
    },
    orderBy: { startTime: 'desc' },
    take: 10,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Control de Tiempo</h1>
          <p className="text-muted-foreground">
            Registra el tiempo dedicado a tus tareas y proyectos.
          </p>
        </div>
      </div>

      {/* Time Tracker */}
      <TimeTracker tasks={tasks} />

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hoy</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats ? `${stats.today.hours}h ${stats.today.minutes}m` : "0h 0m"}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats ? `Total: ${stats.today.totalMinutes} min` : "0 min"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Esta Semana</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats ? `${stats.thisWeek.hours}h ${stats.thisWeek.minutes}m` : "0h 0m"}
            </div>
            <p className="text-xs text-muted-foreground">
              Semana actual
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Este Mes</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats ? `${stats.thisMonth.hours}h ${stats.thisMonth.minutes}m` : "0h 0m"}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats ? `${Math.floor(stats.thisMonth.billableMinutes / 60)}h ${stats.thisMonth.billableMinutes % 60}m facturables` : "0 horar"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Facturable Estimado</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {/* Simplificación temporal, asumiendo 50 USD la hora */}
              {stats ? formatCurrency((stats.thisMonth.billableMinutes / 60) * 50) : "$0.00"}
            </div>
            <p className="text-xs text-muted-foreground">
              Aprox ($50/h)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Time Entries List */}
      <Card>
        <CardHeader>
          <CardTitle>Entradas de Tiempo</CardTitle>
          <CardDescription>
            Tus registros de tiempo más recientes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentEntries.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">
                Las entradas de tiempo aparecerán aquí después de guardar el timer
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentEntries.map((entry) => (
                <div key={entry.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-4">
                  <div>
                    <h4 className="font-semibold text-sm">{entry.task.title}</h4>
                    <p className="text-xs text-muted-foreground">
                      {entry.task.project?.name || "Sin proyecto"} • {entry.description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(entry.startTime).toLocaleDateString()} a las {new Date(entry.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-bold text-lg">{entry.duration} min</p>
                      <p className="text-xs text-muted-foreground">{entry.billable ? "Facturable" : "No facturable"}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
