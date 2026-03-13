/**
 * Client Support Portal - Public Page (by Project)
 * Route: /support/[projectToken]
 * Accessible to clients without authentication
 * Each project has a unique supportToken for direct access
 */

import { notFound } from "next/navigation";
import { Ticket, MessageSquare, AlertCircle, Building2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { SupportTicketForm } from "@/components/support/support-ticket-form";

interface SupportPortalPageProps {
  params: Promise<{ projectToken: string }>;
}

export async function generateMetadata({ params }: SupportPortalPageProps) {
  const { projectToken } = await params;

  // Get project for metadata
  const project = await prisma.project.findUnique({
    where: { supportToken: projectToken },
    select: { name: true, organization: { select: { name: true } } },
  });

  const projectName = project?.name || "Proyecto";
  const orgName = project?.organization?.name || "";

  return {
    title: `Portal de Soporte - ${projectName}`,
    description: orgName ? `Reporta incidencias para ${projectName} de ${orgName}` : "Reporta incidencias o solicita soporte",
  };
}

export default async function SupportPortalPage({ params }: SupportPortalPageProps) {
  const { projectToken } = await params;

  // Find project by supportToken
  const project = await prisma.project.findUnique({
    where: { supportToken: projectToken },
    select: {
      id: true,
      name: true,
      organization: {
        select: {
          id: true,
          name: true,
          logo: true,
        },
      },
    },
  });

  if (!project) {
    notFound();
  }

  const org = project.organization;

  // Validate organization exists
  if (!org) {
    throw new Error(`Project ${project.id} has no organization associated`);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4 gap-4">
            {org.logo ? (
              <div className="bg-white dark:bg-slate-800 p-3 rounded-full shadow-sm">
                <img
                  src={org.logo}
                  alt={`${org.name} logo`}
                  className="h-12 w-12 object-contain"
                />
              </div>
            ) : (
              <div className="bg-primary/10 p-3 rounded-full">
                <Building2 className="h-8 w-8 text-primary" />
              </div>
            )}
            <div className="bg-primary/10 p-3 rounded-full">
              <MessageSquare className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">
            Portal de Soporte
          </h1>
          <p className="text-lg text-muted-foreground mb-1">
            de <span className="font-bold text-primary">{org.name}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Proyecto: <span className="font-semibold text-foreground">{project.name}</span>
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
              projectToken={projectToken}
              projectName={project.name}
              projectId={project.id}
              organizationId={org.id}
              orgName={org.name}
              orgLogo={org.logo}
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
