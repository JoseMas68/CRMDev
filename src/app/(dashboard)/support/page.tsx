/**
 * Support Dashboard - Developer View
 * Shows all tickets, stats, and allows management
 */

import { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Ticket, TrendingUp, CheckCircle2 } from "lucide-react";
import { auth } from "@/lib/auth";
import { getTicketStats } from "@/actions/tickets";
import { SupportTicketsTable } from "@/components/support/support-tickets-table";

export const metadata: Metadata = {
  title: "Soporte al Cliente",
  description: "Gestiona los tickets de soporte de tus clientes",
};

export default async function SupportDashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.session.activeOrganizationId) {
    redirect("/select-org");
  }

  const statsResult = await getTicketStats();
  const stats = statsResult.success ? statsResult.data : {
    total: 0,
    byStatus: {},
    byPriority: {},
    open: 0,
    resolvedThisWeek: 0,
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Ticket className="h-8 w-8" />
          Soporte al Cliente
        </h1>
        <p className="text-muted-foreground">
          Gestiona los tickets de soporte, responde a clientes y da seguimiento.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Total Tickets</p>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold mt-2">{stats.total}</div>
        </div>

        <div className="rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Abiertos</p>
            <Ticket className="h-4 w-4 text-orange-600" />
          </div>
          <div className="text-2xl font-bold mt-2">{stats.open}</div>
        </div>

        <div className="rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Resueltos Semana</p>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </div>
          <div className="text-2xl font-bold mt-2">{stats.resolvedThisWeek}</div>
        </div>

        <div className="rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Tasa Resolución</p>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold mt-2">
            {stats.total > 0 ? Math.round((stats.resolvedThisWeek / stats.total) * 100) : 0}%
          </div>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="rounded-lg border">
        <SupportTicketsTable />
      </div>
    </div>
  );
}
