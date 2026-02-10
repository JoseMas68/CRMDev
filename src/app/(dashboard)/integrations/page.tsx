import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Webhook, Slack, Zap, CheckCircle2, Github } from "lucide-react";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GitHubSync } from "@/components/integrations/github-sync";

export default async function IntegrationsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.session.activeOrganizationId) {
    redirect("/login");
  }

  // Check if GitHub is connected
  const githubAccount = await prisma.account.findFirst({
    where: {
      userId: session.user.id,
      providerId: "github",
    },
    select: {
      accessToken: true,
    },
  });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { githubUsername: true },
  });

  const isGitHubConnected = !!(githubAccount?.accessToken);
  const githubUsername = user?.githubUsername || null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Integraciones</h1>
        <p className="text-muted-foreground">
          Conecta CRMDev con tus herramientas de desarrollo.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <GitHubSync
          initialConnected={isGitHubConnected}
          initialUsername={githubUsername}
        />

        <IntegrationCard
          icon={<Webhook className="h-8 w-8" />}
          title="Webhooks"
          description="Recibe actualizaciones en tiempo real de eventos de GitHub en tu panel de CRMDev."
          status="available"
          features={[
            "Eventos de PR",
            "Eventos de Issues",
            "Notificaciones push",
            "Estado de deployments",
          ]}
        />

        <IntegrationCard
          icon={<Slack className="h-8 w-8" />}
          title="Slack"
          description="Recibe notificaciones en tu workspace de Slack cuando ocurran eventos importantes."
          status="coming_soon"
          features={[
            "Notificaciones de tareas",
            "Actualizaciones de PRs",
            "Alertas de tiempo",
            "Canales personalizados",
          ]}
        />

        <IntegrationCard
          icon={<Zap className="h-8 w-8" />}
          title="Zapier"
          description="Conecta CRMDev con más de 5000 apps a través de automatizaciones de Zapier."
          status="coming_soon"
          features={[
            "Triggers personalizados",
            "Flujos automatizados",
            "Sincronización multi-app",
            "Configuración sin código",
          ]}
        />
      </div>

      {/* Webhook Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Configuración de Webhooks</CardTitle>
          <CardDescription>
            Configura webhooks para recibir actualizaciones en tiempo real de servicios externos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Github className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Webhooks de GitHub</p>
                  <p className="text-sm text-muted-foreground">
                    Endpoint: /api/webhooks/github
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                Configurar
              </Button>
            </div>

            <div className="p-4 border rounded-lg bg-muted/50">
              <h4 className="font-medium mb-2">Instrucciones de Configuración</h4>
              <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                <li>Ve a la configuración de tu repositorio en GitHub</li>
                <li>Navega a la sección de Webhooks</li>
                <li>Agrega un nuevo webhook con la URL de tu endpoint de CRMDev</li>
                <li>Selecciona eventos: Pull requests, Issues, Push, Deployments</li>
                <li>Copia el secret del webhook y agrégalo a tu entorno</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function IntegrationCard({
  icon,
  title,
  description,
  status,
  features,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  status: "available" | "connected" | "coming_soon";
  features: string[];
}) {
  return (
    <Card className="relative">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
          {status === "coming_soon" && (
            <Badge variant="secondary">Próximamente</Badge>
          )}
          {status === "connected" && (
            <Badge variant="default" className="bg-accent-green">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Conectado
            </Badge>
          )}
        </div>
        <CardTitle className="text-lg mt-4">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 mb-4">
          {features.map((feature) => (
            <li
              key={feature}
              className="text-sm text-muted-foreground flex items-center gap-2"
            >
              <CheckCircle2 className="h-3 w-3 text-accent-green" />
              {feature}
            </li>
          ))}
        </ul>
        <Button
          variant={status === "coming_soon" ? "secondary" : "default"}
          className="w-full"
          disabled={status === "coming_soon"}
        >
          {status === "connected"
            ? "Administrar"
            : status === "coming_soon"
            ? "Próximamente"
            : "Conectar"}
        </Button>
      </CardContent>
    </Card>
  );
}
