"use client";

import { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Plus, Table2, LayoutGrid } from "lucide-react";

import { auth } from "@/lib/auth";
import { getClients } from "@/actions/clients";
import { Button } from "@/components/ui/button";
import { ClientsTable } from "@/components/clients/clients-table";
import { CreateClientDialog } from "@/components/clients/create-client-dialog";
import { ClientCard } from "@/components/clients/client-card";
import { useState } from "react";

export const metadata: Metadata = {
  title: "Clientes",
  description: "Gestiona tus clientes, leads y contactos",
};

interface ClientsPageProps {
  searchParams: Promise<{
    page?: string;
    status?: string;
    search?: string;
  }>;
}

/**
 * Clients Page
 *
 * Security Notes:
 * - Session validated server-side
 * - All data filtered by activeOrganizationId via Prisma middleware
 */
export default async function ClientsPage({ searchParams }: ClientsPageProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.session.activeOrganizationId) {
    redirect("/select-org");
  }

  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const status = params.status as any;
  const search = params.search;

  const result = await getClients({
    page,
    status,
    search,
    limit: 20,
  });

  const clients = result.success ? result.data.clients : [];
  const total = result.success ? result.data.total : 0;
  const [view, setView] = useState<"table" | "cards">("table");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground">
            Gestiona tus clientes, leads y contactos
          </p>
        </div>

        <CreateClientDialog>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Cliente
          </Button>
        </CreateClientDialog>
      </div>

      {/* View toggle - solo móvil */}
      <div className="flex gap-2 lg:hidden mb-4">
        <Button
          variant={view === "table" ? "default" : "outline"}
          size="icon"
          onClick={() => setView("table")}
        >
          <Table2 className="h-4 w-4" />
        </Button>
        <Button
          variant={view === "cards" ? "default" : "outline"}
          size="icon"
          onClick={() => setView("cards")}
        >
          <LayoutGrid className="h-4 w-4" />
        </Button>
      </div>

      {/* Table - desktop */}
      <div className={view === "cards" ? "hidden" : ""}>
      <ClientsTable
        clients={clients}
        total={total}
        page={page}
        pageSize={20}
        currentStatus={status}
        currentSearch={search}
      />
      </div>

      {/* Cards - móvil */}
      {view === "cards" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map((client) => (
            <ClientCard key={client.id} client={client} />
          ))}
        </div>
      )}
    </div>
  );
}
