import { Metadata } from "next";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";

import { auth } from "@/lib/auth";
import { getClient } from "@/actions/clients";
import { EditClientForm } from "@/components/clients/edit-client-form";

interface EditClientPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: EditClientPageProps): Promise<Metadata> {
  const { id } = await params;
  const result = await getClient(id);

  if (!result.success || !result.data) {
    return { title: "Cliente no encontrado" };
  }

  return {
    title: `Editar ${result.data.name}`,
    description: `Editar informacion del cliente ${result.data.name}`,
  };
}

export default async function EditClientPage({ params }: EditClientPageProps) {
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

  return (
    <EditClientForm
      client={{
        id: client.id,
        name: client.name,
        email: client.email,
        phone: client.phone,
        company: client.company,
        position: client.position,
        website: client.website,
        address: client.address,
        city: client.city,
        state: client.state,
        country: client.country,
        postalCode: client.postalCode,
        status: client.status,
        source: client.source,
        tags: client.tags,
        notes: client.notes,
      }}
    />
  );
}
