/**
 * Client Support Portal - Public Page
 * Route: /support/[orgSlug]
 * Accessible to clients without authentication
 * Allows ticket submission with AI triage and auto-reply
 */

import { notFound } from "next/navigation";
import { Ticket, MessageSquare, AlertCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { SupportTicketForm } from "@/components/support/support-ticket-form";

interface SupportPortalPageProps {
  params: Promise<{ orgSlug: string }>;
}

export async function generateMetadata({ params }: SupportPortalPageProps) {
  const { orgSlug } = await params;
  return {
    title: `Portal de Soporte - ${orgSlug}`,
    description: "Reporta incidencias, solicita features o contacta con el equipo de soporte",
  };
}

export default async function SupportPortalPage({ params }: SupportPortalPageProps) {
  const { orgSlug } = await params;

  // Verify organization exists
  const org = await prisma.organization.findUnique({
    where: { slug: orgSlug },
    select: { id: true, name: true },
  });

  if (!org) {
    notFound();
  }

  // Get available projects for this org (for context in tickets)
  const projects = await prisma.project.findMany({
    where: { organizationId: org.id },
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
          <h1 className="text-3xl font-bold mb-2">Portal de Soporte</h1>
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
            <SupportTicketForm orgSlug={orgSlug} projects={projects} />
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
