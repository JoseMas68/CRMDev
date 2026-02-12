"use client";

import { useState } from "react";
import { Table2, LayoutGrid } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ClientsTable } from "@/components/clients/clients-table";
import { ClientCard } from "@/components/clients/client-card";

import type { Client } from "@prisma/client";

interface ClientsClientViewProps {
  clients: Client[];
  total: number;
  page: number;
  pageSize: number;
  currentStatus?: string;
  currentSearch?: string;
  children: React.ReactNode; // For the CreateClientDialog button
}

export function ClientsClientView({
  clients,
  total,
  page,
  pageSize,
  currentStatus,
  currentSearch,
  children,
}: ClientsClientViewProps) {
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

        {children}
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
          pageSize={pageSize}
          currentStatus={currentStatus}
          currentSearch={currentSearch}
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
