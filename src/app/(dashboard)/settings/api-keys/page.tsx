import { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getApiKeys } from "@/actions/api-keys";
import { ApiKeysClientPage } from "./client-page";

export const metadata: Metadata = {
    title: "API Keys - Settings",
    description: "Administra las llaves de acceso para la API y MCP",
};

export default async function ApiKeysPage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user || !session.session.activeOrganizationId) {
        redirect("/sign-in");
    }

    // Comprobar rol del usuario para este org
    const member = await prisma.member.findUnique({
        where: {
            organizationId_userId: {
                organizationId: session.session.activeOrganizationId,
                userId: session.user.id,
            },
        },
        select: { role: true },
    });

    const canManageKeys = member?.role === "owner" || member?.role === "admin";

    const apiKeysResult = await getApiKeys();
    const apiKeys = apiKeysResult.success ? apiKeysResult.data : [];

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">API Keys & MCP</h3>
                <p className="text-sm text-muted-foreground">
                    Genera llaves secretas para conectar IAs externas (ChatGPT, Claude Desktop, etc) a tu CRM usando MCP (Model Context Protocol).
                </p>
            </div>

            <ApiKeysClientPage initialKeys={apiKeys || []} canManageKeys={canManageKeys} />
        </div>
    );
}
