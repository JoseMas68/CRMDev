import { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  CheckSquare,
  FolderKanban,
  Users,
  Clock,
  Calendar,
  ArrowUpRight,
  Plus,
  Ticket,
  TrendingUp,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { auth } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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

  // Get today's date for display
  const today = new Date();
  const formattedDate = format(today, "EEEE, d 'de' MMMM", { locale: es });

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            Hola, {session.user.name?.split(" ")[0] ?? "Developer"} 👋
          </h1>
          <p className="text-muted-foreground text-base md:text-lg mt-1">
            {formattedDate} • Aquí está tu resumen
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
        <Card className="border-l-4 border-l-blue-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 px-4 pt-4">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              Tareas Activas
            </CardTitle>
            <CheckSquare className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-xl sm:text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-green-600">+3</span> esta semana
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 px-4 pt-4">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              Proyectos
            </CardTitle>
            <FolderKanban className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-xl sm:text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground mt-1">
              2 activos
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 px-4 pt-4">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              Clientes
            </CardTitle>
            <Users className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-xl sm:text-2xl font-bold">23</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-green-600">+2</span> nuevos
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 px-4 pt-4">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              Tiempo Hoy
            </CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-xl sm:text-2xl font-bold">4h 32m</div>
            <p className="text-xs text-muted-foreground mt-1">
              Meta: 8h
            </p>
            <Progress value={57} className="h-1 mt-2" />
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
                  Tus últimas tareas actualizadas
                </CardDescription>
              </div>
              <Link href="/tasks">
                <Button variant="ghost" size="sm">
                  Ver todas
                  <ArrowUpRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 sm:space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Link
                  key={i}
                  href="/tasks"
                  className="block"
                >
                  <div className="flex items-center justify-between p-3 sm:p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={cn(
                        "w-2 h-2 rounded-full flex-shrink-0",
                        i <= 2 ? "bg-green-500" : i <= 4 ? "bg-yellow-500" : "bg-red-500"
                      )} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {i === 1 && "Implementar autenticación con GitHub OAuth"}
                          {i === 2 && "Diseñar responsive para móvil"}
                          {i === 3 && "Configurar base de datos PostgreSQL"}
                          {i === 4 && "Crear componentes de UI con shadcn"}
                          {i === 5 && "Implementar control de tiempo"}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {i === 1 ? "Frontend" : i === 2 ? "Mobile" : i === 3 ? "Backend" : i === 4 ? "UI" : "Feature"}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs flex-shrink-0">
                      {i <= 2 ? "Completada" : i <= 4 ? "En progreso" : "Pendiente"}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
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
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <ArrowUpRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Current Timer */}
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-4 border border-primary/20">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">Trabajando en:</p>
                  <Button size="sm" className="gap-2 h-8" disabled>
                    <Plus className="h-3 w-3" />
                    Seleccionar
                  </Button>
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-center py-3">
                  00:00:00
                </div>
              </div>

              {/* Today's Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Hoy</span>
                  <span className="font-semibold">4h 32m</span>
                </div>
                <Progress value={57} className="h-2" />
                <p className="text-xs text-muted-foreground text-right">
                  Meta: 8h • 57% completado
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
                    Tickets recientes
                  </CardDescription>
                </div>
                <Link href="/support">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <ArrowUpRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  { title: "Error en login", status: "Abierto", time: "2h" },
                  { title: "No crear proyecto", status: "En progreso", time: "5h" },
                  { title: "Integración GitHub", status: "Resuelto", time: "1d" },
                ].map((ticket) => (
                  <Link
                    key={ticket.title}
                    href="/support"
                    className="block p-2 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <p className="text-xs font-medium truncate mb-1">{ticket.title}</p>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className={cn(
                        "text-[10px]",
                        ticket.status === "Resuelto" ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" :
                        ticket.status === "En progreso" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300" :
                        "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                      )}>
                        {ticket.status}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">{ticket.time}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Links Grid */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <Link href="/projects" className="group">
          <Card className="transition-all hover:shadow-lg hover:border-primary/50">
            <CardContent className="p-4 sm:p-6">
              <FolderKanban className="h-6 w-6 sm:h-8 sm:w-8 text-primary mb-2 sm:mb-3" />
              <h3 className="font-semibold text-sm sm:text-base mb-1">Proyectos</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">Gestiona tus proyectos</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/clients" className="group">
          <Card className="transition-all hover:shadow-lg hover:border-primary/50">
            <CardContent className="p-4 sm:p-6">
              <Users className="h-6 w-6 sm:h-8 sm:w-8 text-primary mb-2 sm:mb-3" />
              <h3 className="font-semibold text-sm sm:text-base mb-1">Clientes</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">Base de clientes</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/pipeline" className="group">
          <Card className="transition-all hover:shadow-lg hover:border-primary/50">
            <CardContent className="p-4 sm:p-6">
              <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-primary mb-2 sm:mb-3" />
              <h3 className="font-semibold text-sm sm:text-base mb-1">Pipeline</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">Ventas y oportunidades</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/tasks" className="group">
          <Card className="transition-all hover:shadow-lg hover:border-primary/50">
            <CardContent className="p-4 sm:p-6">
              <CheckSquare className="h-6 w-6 sm:h-8 sm:w-8 text-primary mb-2 sm:mb-3" />
              <h3 className="font-semibold text-sm sm:text-base mb-1">Tareas</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">Kanban de tareas</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
