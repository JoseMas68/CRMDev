import { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Bell, Mail, CheckSquare2 } from "lucide-react";

import { auth } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export const metadata: Metadata = {
  title: "Notificaciones",
  description: "Configura tus preferencias de notificación",
};

export default async function NotificationsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Notificaciones</h1>
        <p className="text-muted-foreground mt-2">
          Elige qué notificaciones deseas recibir.
        </p>
      </div>

      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Notificaciones por Email
          </CardTitle>
          <CardDescription>
            Recibe actualizaciones importantes en tu correo electrónico
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="tasks-updates">Actualizaciones de Tareas</Label>
              <p className="text-sm text-muted-foreground">
                Cuando una tarea asignada a ti cambia de estado
              </p>
            </div>
            <Switch id="tasks-updates" defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="new-assignments">Nuevas Asignaciones</Label>
              <p className="text-sm text-muted-foreground">
                Cuando alguien te asigna una nueva tarea
              </p>
            </div>
            <Switch id="new-assignments" defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="comments">Comentarios y Menciones</Label>
              <p className="text-sm text-muted-foreground">
                Cuando alguien te menciona o comenta en tus tareas
              </p>
            </div>
            <Switch id="comments" defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="invitations">Invitaciones a Organizaciones</Label>
              <p className="text-sm text-muted-foreground">
                Cuando alguien te invita a unirte a una organización
              </p>
            </div>
            <Switch id="invitations" defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="weekly-summary">Resumen Semanal</Label>
              <p className="text-sm text-muted-foreground">
                Resumen semanal de tu progreso y tareas pendientes
              </p>
            </div>
            <Switch id="weekly-summary" />
          </div>
        </CardContent>
      </Card>

      {/* Push Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificaciones del Navegador
          </CardTitle>
          <CardDescription>
            Recibe notificaciones en tiempo real mientras usas la aplicación
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="browser-notifications">Activar Notificaciones</Label>
              <p className="text-sm text-muted-foreground">
                Habilita las notificaciones del navegador para alertas instantáneas
              </p>
            </div>
            <Switch id="browser-notifications" />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="sound">Sonido de Notificación</Label>
              <p className="text-sm text-muted-foreground">
                Reproducir un sonido cuando llegue una notificación
              </p>
            </div>
            <Switch id="sound" defaultChecked />
          </div>
        </CardContent>
      </Card>

      {/* Task Reminders */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckSquare2 className="h-5 w-5" />
            Recordatorios de Tareas
          </CardTitle>
          <CardDescription>
            Configura recordatorios automáticos para tus tareas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="due-date-reminders">Recordatorios de Fecha Límite</Label>
              <p className="text-sm text-muted-foreground">
                Recibe alertas antes de que venzan tus tareas
              </p>
            </div>
            <Switch id="due-date-reminders" defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="overdue-tasks">Tareas Vencidas</Label>
              <p className="text-sm text-muted-foreground">
                Alerta diaria por tareas con fecha límite vencida
              </p>
            </div>
            <Switch id="overdue-tasks" defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="reminder-time">Hora de Recordatorio</Label>
              <p className="text-sm text-muted-foreground">
                Hora a la que deseas recibir recordatorios diarios
              </p>
            </div>
            <select className="border rounded px-3 py-1 text-sm">
              <option>09:00 AM</option>
              <option>10:00 AM</option>
              <option selected>11:00 AM</option>
              <option>12:00 PM</option>
              <option>01:00 PM</option>
              <option>02:00 PM</option>
              <option>03:00 PM</option>
              <option>04:00 PM</option>
              <option>05:00 PM</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button variant="outline">Restablecer</Button>
        <Button>Guardar Cambios</Button>
      </div>
    </div>
  );
}
