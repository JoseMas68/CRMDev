import { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Plus, Trophy, XCircle } from "lucide-react";

import { auth } from "@/lib/auth";
import { getDealsForKanban, createDefaultPipelineStages, getClosedDeals } from "@/actions/deals";
import { getClients } from "@/actions/clients";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { KanbanBoard } from "@/components/pipeline/kanban-board";
import { CreateDealDialog } from "@/components/pipeline/create-deal-dialog";

export const metadata: Metadata = {
  title: "Pipeline",
  description: "Gestiona tu pipeline de ventas",
};

/**
 * Pipeline Page
 *
 * Security Notes:
 * - Session validated server-side
 * - All data filtered by activeOrganizationId via Prisma middleware
 */
export default async function PipelinePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.session.activeOrganizationId) {
    redirect("/select-org");
  }

  // Ensure default stages exist
  await createDefaultPipelineStages();

  // Fetch data in parallel
  const [kanbanResult, clientsResult, closedResult] = await Promise.all([
    getDealsForKanban(),
    getClients({ limit: 100 }),
    getClosedDeals(),
  ]);

  const stages = kanbanResult.success ? kanbanResult.data.stages : [];
  const totalValue = kanbanResult.success ? kanbanResult.data.totalValue : 0;
  const clients = clientsResult.success ? clientsResult.data.clients : [];
  const closedDeals = closedResult.success ? closedResult.data : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pipeline de Ventas</h1>
          <p className="text-muted-foreground">
            {formatCurrency(totalValue)} en oportunidades abiertas
          </p>
        </div>

        <CreateDealDialog
          stages={stages}
          clients={clients.map((c) => ({ id: c.id, name: c.name }))}
        >
          <Button className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Deal
          </Button>
        </CreateDealDialog>
      </div>

      {/* Kanban Board */}
      <KanbanBoard
        initialStages={stages}
        clients={clients.map((c) => ({ id: c.id, name: c.name }))}
      />

      {/* Closed Deals */}
      {closedDeals && (closedDeals.won.length > 0 || closedDeals.lost.length > 0) && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Won Deals */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-green-500" />
                <CardTitle className="text-lg">Ganados</CardTitle>
              </div>
              <CardDescription>
                {formatCurrency(closedDeals.totalWon)} en deals cerrados
              </CardDescription>
            </CardHeader>
            <CardContent>
              {closedDeals.won.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin deals ganados aun</p>
              ) : (
                <div className="space-y-3">
                  {closedDeals.won.map((deal) => (
                    <div
                      key={deal.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/20"
                    >
                      <div>
                        <p className="font-medium text-sm">{deal.title}</p>
                        <p className="text-xs text-muted-foreground">{deal.client?.name || "Sin cliente"}</p>
                      </div>
                      <p className="font-semibold text-green-500">
                        {formatCurrency(deal.value)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Lost Deals */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-500" />
                <CardTitle className="text-lg">Perdidos</CardTitle>
              </div>
              <CardDescription>
                {formatCurrency(closedDeals.totalLost)} en oportunidades perdidas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {closedDeals.lost.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin deals perdidos</p>
              ) : (
                <div className="space-y-3">
                  {closedDeals.lost.map((deal) => (
                    <div
                      key={deal.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-red-500/10 border border-red-500/20"
                    >
                      <div>
                        <p className="font-medium text-sm">{deal.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {deal.client?.name || "Sin cliente"}
                          {deal.lostReason && ` - ${deal.lostReason}`}
                        </p>
                      </div>
                      <p className="font-semibold text-red-500">
                        {formatCurrency(deal.value)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
