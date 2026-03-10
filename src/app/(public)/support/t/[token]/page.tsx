/**
 * Client Support Portal - Token-based Public Page
 * Route: /support/t/[token]
 * Accessible to clients via their unique secret token
 */

import { Ticket, MessageSquare, AlertCircle, ShieldOff } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { SupportTicketForm } from "@/components/support/support-ticket-form";

interface TokenSupportPortalPageProps {
  params: Promise<{ token: string }>;
}

export async function generateMetadata({ params }: TokenSupportPortalPageProps) {
  const { token } = await params;

  const client = await prisma.client.findUnique({
    where: { supportToken: token },
    select: { name: true, company: true, supportTokenActive: true },
  });

  if (!client || !client.supportTokenActive) {
    return {
      title: "Portal de Soporte - Enlace no válido",
      description: "Este enlace de soporte no está disponible.",
    };
  }

  return {
    title: "Portal de Soporte CRMDev",
    description: "Reporta incidencias, solicita features o contacta con el equipo de soporte",
  };
}

export default async function TokenSupportPortalPage({ params }: TokenSupportPortalPageProps) {
  const { token } = await params;

  const client = await prisma.client.findUnique({
    where: { supportToken: token },
    select: {
      id: true,
      name: true,
      email: true,
      company: true,
      supportTokenActive: true,
      organization: {
        select: { slug: true, name: true },
      },
    },
  });

  // Error page if not found or revoked
  if (!client || !client.supportTokenActive) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
        <div className="container mx-auto px-4 py-12 max-w-md text-center">
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg border p-8">
            <div className="flex justify-center mb-4">
              <div className="bg-red-100 dark:bg-red-950 p-3 rounded-full">
                <ShieldOff className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <h1 className="text-2xl font-bold mb-3">Enlace no válido</h1>
            <p className="text-muted-foreground mb-4">
              Este enlace de soporte no está disponible. Puede que haya expirado o sido revocado.
            </p>
            <p className="text-sm text-muted-foreground">
              Contacta con el equipo para obtener un nuevo enlace de soporte.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const orgSlug = client.organization.slug;

  // Get available projects for this CLIENT only (not all org projects)
  const projects = await prisma.project.findMany({
    where: {
      organizationId: (await prisma.organization.findUnique({ where: { slug: orgSlug }, select: { id: true } }))!.id,
      clientId: client.id,
    },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
    take: 20,
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-primary/10 p-3 rounded-full">
              <MessageSquare className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2">Portal de Soporte CRMDev</h1>
          <p className="text-muted-foreground">
            ¿Necesitas ayuda? Crea un ticket y nuestro equipo te responderá lo antes posible.
          </p>
        </div>

        {/* Info banner */}
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-900 rounded-lg p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-900 dark:text-blue-100">
            <p className="font-medium mb-1">¿Cómo funciona?</p>
            <ul className="list-disc list-inside space-y-1 text-blue-800 dark:text-blue-200">
              <li>Completa el formulario con tu incidencia o solicitud</li>
              <li>Nuestra IA analizará tu ticket automáticamente</li>
              <li>Recibirás un email de confirmación inmediato</li>
              <li>El equipo revisará y te responderá en breve</li>
            </ul>
          </div>
        </div>

        {/* Ticket Form */}
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg border">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Ticket className="h-5 w-5" />
              Nuevo Ticket de Soporte
            </h2>
          </div>
          <div className="p-6">
            <SupportTicketForm
              orgSlug={orgSlug}
              projects={projects}
              clientName={client.company || client.name}
              clientEmail={client.email}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-muted-foreground">
          <p>Powered by CRMDev - Client Support Hub</p>
        </div>
      </div>
    </div>
  );
}
