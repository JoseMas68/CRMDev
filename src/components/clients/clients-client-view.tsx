"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

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
  // En móvil siempre usar cards, en desktop usar tabla
  const isMobile = typeof window !== "undefined" ? window.innerWidth < 768 : false;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header - Mobile optimized */}
      <div className="flex flex-col gap-3 sm:gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Clientes</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Gestiona tus clientes, leads y contactos
            </p>
          </div>

          {/* Mobile: Icon only button */}
          <div className="sm:hidden">
            {children}
          </div>
        </div>

        {/* Desktop: Full button */}
        <div className="hidden sm:block">
          {children}
        </div>
      </div>

      {/* Table - desktop only */}
      <div className="hidden md:block">
        <ClientsTable
          clients={clients}
          total={total}
          page={page}
          pageSize={pageSize}
          currentStatus={currentStatus}
          currentSearch={currentSearch}
        />
      </div>

      {/* Cards - mobile only */}
      <div className="md:hidden space-y-3">
        {clients.map((client) => (
          <ClientCard key={client.id} client={client} />
        ))}
      </div>
    </div>
  );
}
