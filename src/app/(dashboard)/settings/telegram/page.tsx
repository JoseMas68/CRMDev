import { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTelegramConnection } from "@/actions/telegram";
import { TelegramClientPage } from "./client-page";

export const metadata: Metadata = {
  title: "Telegram - Settings",
  description: "Conecta tu CRM con Telegram para gestionar desde el móvil",
};

export default async function TelegramPage() {
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

  const canManageTelegram = member?.role === "owner" || member?.role === "admin";

  const connectionsResult = await getTelegramConnection();
  const connections = connectionsResult.success ? connectionsResult.data : [];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Telegram Integration</h3>
        <p className="text-sm text-muted-foreground">
          Conecta tu CRM con Telegram para gestionar tareas, proyectos y clientes desde tu móvil.
          Un solo bot atiende a todas las organizaciones de forma segura.
        </p>
      </div>

      <TelegramClientPage
        initialConnections={connections}
        canManageTelegram={canManageTelegram}
      />
    </div>
  );
}
