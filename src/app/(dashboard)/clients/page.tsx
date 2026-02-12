import { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";

import { auth } from "@/lib/auth";
import { getClients } from "@/actions/clients";
import { Button } from "@/components/ui/button";
import { CreateClientDialog } from "@/components/clients/create-client-dialog";
import { ClientsClientView } from "@/components/clients/clients-client-view";

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

  return (
    <ClientsClientView
      clients={clients}
      total={total}
      page={page}
      pageSize={20}
      currentStatus={status}
      currentSearch={search}
    >
      <CreateClientDialog>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Cliente
        </Button>
      </CreateClientDialog>
    </ClientsClientView>
  );
}
