import { Metadata } from "next";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  Phone,
  Building2,
  Globe,
  MapPin,
  Calendar,
  DollarSign,
  FolderKanban,
  User,
  Tag,
  FileText,
  Edit,
  Trash2,
} from "lucide-react";

import { auth } from "@/lib/auth";
import { getClient, deleteClient } from "@/actions/clients";
import { formatDate, formatCurrency, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ClientPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: ClientPageProps): Promise<Metadata> {
  const { id } = await params;
  const result = await getClient(id);

  if (!result.success || !result.data) {
    return { title: "Cliente no encontrado" };
  }

  return {
    title: result.data.name,
    description: `Detalles del cliente ${result.data.name}`,
  };
}

const statusColors: Record<string, string> = {
  LEAD: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  PROSPECT: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  CUSTOMER: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  INACTIVE: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  CHURNED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

const statusLabels: Record<string, string> = {
  LEAD: "Lead",
  PROSPECT: "Prospecto",
  CUSTOMER: "Cliente",
  INACTIVE: "Inactivo",
  CHURNED: "Perdido",
};

export default async function ClientPage({ params }: ClientPageProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.session.activeOrganizationId) {
    redirect("/select-org");
  }

  const { id } = await params;
  const result = await getClient(id);

  if (!result.success || !result.data) {
    notFound();
  }

  const client = result.data;

  // Calculate total deals value
  const totalDealsValue = client.deals?.reduce(
    (sum, deal) => sum + Number(deal.value),
    0
  ) || 0;

  const openDeals = client.deals?.filter((d) => d.status === "OPEN") || [];
  const wonDeals = client.deals?.filter((d) => d.status === "WON") || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Link
          href="/clients"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a clientes
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight">
                  {client.name}
                </h1>
                <Badge
                  variant="secondary"
                  className={cn("font-normal", statusColors[client.status])}
                >
                  {statusLabels[client.status]}
                </Badge>
              </div>
              {client.company && (
                <p className="text-muted-foreground flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  {client.company}
                  {client.position && ` - ${client.position}`}
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Link href={`/clients/${id}/edit`}>
              <Button variant="outline">
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Button>
            </Link>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Eliminar cliente</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta accion no se puede deshacer. Se eliminaran todos los
                    datos asociados a este cliente, incluyendo oportunidades y
                    proyectos.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <form
                    action={async () => {
                      "use server";
                      await deleteClient(id);
                      redirect("/clients");
                    }}
                  >
                    <AlertDialogAction type="submit" className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Eliminar
                    </AlertDialogAction>
                  </form>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Deals Value */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Valor Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalDealsValue)}
            </div>
            <p className="text-sm text-muted-foreground">
              {client.deals?.length || 0} oportunidades
            </p>
          </CardContent>
        </Card>

        {/* Open Deals */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Oportunidades Abiertas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openDeals.length}</div>
            <p className="text-sm text-muted-foreground">
              {formatCurrency(
                openDeals.reduce((sum, d) => sum + Number(d.value), 0)
              )}
            </p>
          </CardContent>
        </Card>

        {/* Won Deals */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Oportunidades Ganadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {wonDeals.length}
            </div>
            <p className="text-sm text-muted-foreground">
              {formatCurrency(
                wonDeals.reduce((sum, d) => sum + Number(d.value), 0)
              )}
            </p>
          </CardContent>
        </Card>

        {/* Projects */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <FolderKanban className="h-4 w-4" />
              Proyectos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {client.projects?.length || 0}
            </div>
            <p className="text-sm text-muted-foreground">
              {client.projects?.filter((p) => p.status === "IN_PROGRESS").length || 0} en progreso
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Contact Info */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Informacion de Contacto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {client.email && (
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a
                  href={`mailto:${client.email}`}
                  className="text-sm hover:text-primary"
                >
                  {client.email}
                </a>
              </div>
            )}

            {client.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <a
                  href={`tel:${client.phone}`}
                  className="text-sm hover:text-primary"
                >
                  {client.phone}
                </a>
              </div>
            )}

            {client.website && (
              <div className="flex items-center gap-3">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <a
                  href={client.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm hover:text-primary"
                >
                  {client.website}
                </a>
              </div>
            )}

            {(client.address || client.city || client.country) && (
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="text-sm">
                  {client.address && <p>{client.address}</p>}
                  {(client.city || client.state) && (
                    <p>
                      {[client.city, client.state].filter(Boolean).join(", ")}
                    </p>
                  )}
                  {(client.country || client.postalCode) && (
                    <p>
                      {[client.country, client.postalCode]
                        .filter(Boolean)
                        .join(" ")}
                    </p>
                  )}
                </div>
              </div>
            )}

            {client.source && (
              <div className="flex items-center gap-3">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Fuente: {client.source}</span>
              </div>
            )}

            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                Cliente desde {formatDate(client.createdAt)}
              </span>
            </div>

            {client.tags && client.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {client.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notes & Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Notas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {client.notes ? (
              <p className="text-sm whitespace-pre-wrap">{client.notes}</p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Sin notas agregadas
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Deals section */}
      {client.deals && client.deals.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Oportunidades Recientes</CardTitle>
            <Link href={`/pipeline?clientId=${id}`}>
              <Button variant="ghost" size="sm">
                Ver todas
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {client.deals.map((deal) => (
                <div
                  key={deal.id}
                  className="flex items-center justify-between hover:bg-muted/50 -mx-2 px-2 py-2 rounded-lg transition-colors"
                >
                  <div>
                    <p className="font-medium">{deal.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(deal.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {formatCurrency(Number(deal.value))}
                    </p>
                    <span
                      className={cn(
                        "text-xs",
                        deal.status === "WON" && "text-green-600",
                        deal.status === "LOST" && "text-red-600",
                        deal.status === "OPEN" && "text-blue-600"
                      )}
                    >
                      {deal.status === "WON"
                        ? "Ganada"
                        : deal.status === "LOST"
                        ? "Perdida"
                        : "Abierta"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Projects section */}
      {client.projects && client.projects.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Proyectos</CardTitle>
            <Link href={`/projects?clientId=${id}`}>
              <Button variant="ghost" size="sm">
                Ver todos
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {client.projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="flex items-center justify-between hover:bg-muted/50 -mx-2 px-2 py-2 rounded-lg transition-colors"
                >
                  <div>
                    <p className="font-medium">{project.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(project.createdAt)}
                    </p>
                  </div>
                  <Badge variant="secondary">{project.status}</Badge>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Activity section */}
      {client.activities && client.activities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Actividad Reciente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {client.activities.map((activity) => (
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
