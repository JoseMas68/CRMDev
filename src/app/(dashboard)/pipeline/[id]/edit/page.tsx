import { Metadata } from "next";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { auth } from "@/lib/auth";
import { getDealById, getDealsForKanban } from "@/actions/deals";
import { getClients } from "@/actions/clients";
import { EditDealForm } from "@/components/pipeline/edit-deal-form";

interface EditDealPageProps {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({
    params,
}: EditDealPageProps): Promise<Metadata> {
    const { id } = await params;
    const result = await getDealById(id);

    if (!result.success || !result.data) {
        return { title: "Deal no encontrado" };
    }

    return {
        title: `Editar ${result.data.title}`,
        description: `Editar deal ${result.data.title}`,
    };
}

export default async function EditDealPage({ params }: EditDealPageProps) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.session.activeOrganizationId) {
        redirect("/select-org");
    }

    const { id } = await params;

    // Fetch data in parallel
    const [dealResult, kanbanResult, clientsResult] = await Promise.all([
        getDealById(id),
        getDealsForKanban(),
        getClients({ limit: 100 }),
    ]);

    if (!dealResult.success || !dealResult.data) {
        notFound();
    }

    const deal = dealResult.data;
    const stages = kanbanResult.success ? kanbanResult.data.stages.map(s => ({ id: s.id, name: s.name, color: s.color })) : [];
    const clients = clientsResult.success ? clientsResult.data.clients : [];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <Link
                    href={`/pipeline/${id}`}
                    className="inline-flex items-center text-sm text-muted-foreground hover:text-primary"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver al deal
                </Link>

                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Editar Deal</h1>
                    <p className="text-muted-foreground">
                        Modifica los detalles de {deal.title}
                    </p>
                </div>
            </div>

            {/* Edit Form */}
            <EditDealForm
                deal={deal}
                stages={stages}
                clients={clients.map((c) => ({ id: c.id, name: c.name }))}
            />
        </div>
    );
}
