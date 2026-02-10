import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Clock, Play, Calendar, DollarSign } from "lucide-react";

import { auth } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function TimeTrackingPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.session.activeOrganizationId) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Control de Tiempo</h1>
          <p className="text-muted-foreground">
            Registra el tiempo dedicado a tareas y proyectos.
          </p>
        </div>
        <Button className="gap-2">
          <Play className="h-4 w-4" />
          Iniciar Timer
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hoy</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0h 0m</div>
            <p className="text-xs text-muted-foreground">
              0 entradas registradas
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Esta Semana</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0h 0m</div>
            <p className="text-xs text-muted-foreground">
              Objetivo: 40h
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Este Mes</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0h 0m</div>
            <p className="text-xs text-muted-foreground">
              0 horas facturables
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Facturable</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$0</div>
            <p className="text-xs text-muted-foreground">
              Este mes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Time Entries */}
      <Card>
        <CardHeader>
          <CardTitle>Entradas de Tiempo Recientes</CardTitle>
          <CardDescription>
            Tus registros de tiempo de la última semana.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Clock className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">Sin entradas de tiempo aún</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Comienza a registrar tiempo en tus tareas para ver las entradas aquí.
            </p>
            <Button variant="outline" className="gap-2">
              <Play className="h-4 w-4" />
              Iniciar tu primer timer
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
