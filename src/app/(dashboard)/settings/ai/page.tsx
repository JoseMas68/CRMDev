import { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOpenAIApiKey } from "@/actions/ai";
import { AiClientPage } from "./client-page";

export const metadata: Metadata = {
  title: "AI Assistant - Settings",
  description: "Configura tu asistente de IA para gestionar el CRM con lenguaje natural",
};

export default async function AiSettingsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user || !session.session.activeOrganizationId) {
    redirect("/sign-in");
  }

  // Comprobar rol del usuario
  const member = await prisma.member.findUnique({
    where: {
      organizationId_userId: {
        organizationId: session.session.activeOrganizationId,
        userId: session.user.id,
      },
    },
    select: { role: true },
  });

  const canManageAI = member?.role === "owner" || member?.role === "admin";

  const apiKeyResult = await getOpenAIApiKey();
  const hasApiKey = apiKeyResult.success ? (apiKeyResult.data?.hasApiKey ?? false) : false;
  const preview = apiKeyResult.success ? (apiKeyResult.data?.preview ?? null) : null;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">AI Assistant</h3>
        <p className="text-sm text-muted-foreground">
          Configura tu asistente de IA impulsado por OpenAI. Podrás crear tareas, proyectos y clientes usando lenguaje natural.
        </p>
      </div>

      <AiClientPage
        canManageAI={canManageAI}
        hasApiKey={hasApiKey}
        preview={preview}
      />
    </div>
  );
}
