import { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ArrowLeft, Calendar, DollarSign, Building2, Edit, Trophy, X, Clock, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDealById } from "@/actions/deals";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const dealResult = await getDealById(id);

  if (!dealResult.success || !dealResult.data) {
    return {
      title: "Deal no encontrado",
    };
  }

  return {
    title: dealResult.data.title,
    description: `Deal de ${formatCurrency(dealResult.data.value)}`,
  };
}

export default async function DealDetailPage({ params }: Props) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.session.activeOrganizationId) {
    redirect("/login");
  }

  const { id } = await params;
  const dealResult = await getDealById(id);

  if (!dealResult.success || !dealResult.data) {
    redirect("/pipeline");
  }

  const deal = dealResult.data;

  // Obtener stage del deal
  const stage = await prisma.pipelineStage.findFirst({
    where: {
      id: deal.stageId,
      organizationId: session.session.activeOrganizationId,
    },
  });

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2 sm:gap-4">
        <Link href="/pipeline">
          <Button variant="ghost" size="icon" className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight truncate">
            {deal.title}
          </h1>
        </div>

        {deal.status === "OPEN" && (
          <Link href={`/pipeline/${deal.id}/edit`} className="shrink-0 block lg:hidden">
            <Button variant="outline" size="icon" className="h-9 w-9">
              <Edit className="h-4 w-4 text-muted-foreground" />
            </Button>
          </Link>
        )}
      </div>

      {/* Main Content */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Deal Details */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Información del Deal</CardTitle>
                <CardDescription>
                  Creado el {formatDate(deal.createdAt)}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Value */}
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">Valor del Deal</span>
                </div>
                <span className="text-xl font-bold text-primary">
                  {formatCurrency(deal.value)}
                </span>
              </div>

              {/* Client */}
              {deal.client && (
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">Cliente</span>
                  </div>
                  <Link
                    href={`/clients/${deal.client.id}`}
                    className="text-primary hover:underline font-medium"
                  >
                    {deal.client.name}
                  </Link>
                </div>
              )}

              {/* Expected Close Date */}
              {deal.expectedCloseDate && (
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">Fecha Esperada de Cierre</span>
                  </div>
                  <span className="text-sm">
                    {format(deal.expectedCloseDate, "d 'de' MMMM, yyyy", { locale: es })}
                  </span>
                </div>
              )}

              {/* Stage */}
              {stage && (
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">Etapa Actual</span>
                  </div>
                  <Badge
                    variant="outline"
                    className="gap-1"
                    style={{ borderColor: stage.color }}
                  >
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: stage.color }}
                    />
                    {stage.name}
                  </Badge>
                </div>
              )}

              {/* Status */}
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Badge className="h-5 w-5" />
                  <span className="font-medium">Estado</span>
                </div>
                <Badge
                  variant={deal.status === "WON" ? "default" : deal.status === "LOST" ? "destructive" : "secondary"}
                  className={cn(
                    "gap-1",
                    deal.status === "WON" && "bg-green-500 hover:bg-green-600 text-white",
                    deal.status === "OPEN" && "bg-blue-500 hover:bg-blue-600 text-white"
                  )}
                >
                  {deal.status === "WON" && <Trophy className="h-3 w-3" />}
                  {deal.status === "LOST" && <X className="h-3 w-3" />}
                  {deal.status === "OPEN" && <Clock className="h-3 w-3" />}
                  {deal.status === "WON" ? "Ganado" : deal.status === "LOST" ? "Perdido" : "Abierto"}
                </Badge>
              </div>

              {/* Notes */}
              {deal.notes && (
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm font-medium mb-2">Notas</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {deal.notes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Actions */}
        <div className="space-y-4">
          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Resumen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Valor</span>
                <span className="font-semibold">{formatCurrency(deal.value)}</span>
              </div>
              {stage && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Etapa</span>
                    <span className="text-sm">{stage.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Probabilidad</span>
                    <span className="text-sm font-semibold">{stage.probability}%</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Danger Zone */}
          {deal.status === "OPEN" && (
            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="text-destructive text-base">Acciones</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href={`/pipeline/${deal.id}/edit`} className="block">
                  <Button variant="outline" className="w-full gap-2">
                    <Edit className="h-4 w-4" />
                    Editar Deal
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
