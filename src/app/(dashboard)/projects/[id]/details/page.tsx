import { Metadata } from "next";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Globe,
  Database,
  Figma,
  FileText,
  Lock,
  User,
  Phone,
  Mail,
  FolderOpen,
  Github,
  Calendar,
  Settings,
} from "lucide-react";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getProject } from "@/actions/projects";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ProjectDetailsPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: ProjectDetailsPageProps): Promise<Metadata> {
  const { id } = await params;
  const result = await getProject(id);

  if (!result.success) {
    return { title: "Proyecto no encontrado" };
  }

  return {
    title: `Detalles de ${result.data.name}`,
    description: `Información técnica extendida del proyecto ${result.data.name}`,
  };
}

export default async function ProjectDetailsPage({ params }: ProjectDetailsPageProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.session.activeOrganizationId) {
    redirect("/select-org");
  }

  const { id } = await params;

  // Fetch full project details with all fields
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      client: {
        select: { id: true, name: true },
      },
    },
  });

  if (!project) {
    notFound();
  }

  // Check if user is admin for sensitive data
  const orgMember = await prisma.member.findUnique({
    where: {
      organizationId_userId: {
        organizationId: session.session.activeOrganizationId!,
        userId: session.user.id,
      },
    },
    select: { role: true },
  });

  const isAdmin = orgMember?.role === "owner" || orgMember?.role === "admin";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Link
          href={`/projects/${id}`}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver al proyecto
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Detalles Técnicos: {project.name}
            </h1>
            <p className="text-muted-foreground">
              Información extendida del proyecto para desarrolladores y administradores
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="production" className="space-y-4">
        <TabsList className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 w-full">
          <TabsTrigger value="production">Producción</TabsTrigger>
          <TabsTrigger value="documentation">Documentación</TabsTrigger>
          <TabsTrigger value="technical">Técnico</TabsTrigger>
          <TabsTrigger value="contacts">Contactos</TabsTrigger>
          {isAdmin && <TabsTrigger value="env">Env Vars</TabsTrigger>}
        </TabsList>

        {/* PRODUCTION TAB */}
        <TabsContent value="production">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                URLs de Producción
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {project.productionUrl && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Producción</label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="text-sm bg-muted px-2 py-1 rounded flex-1">
                      {project.productionUrl}
                    </code>
                    <Button size="sm" variant="outline" asChild>
                      <a href={project.productionUrl} target="_blank" rel="noopener noreferrer">
                        Abrir
                      </a>
                    </Button>
                  </div>
                </div>
              )}

              {project.stagingUrl && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Staging</label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="text-sm bg-muted px-2 py-1 rounded flex-1">
                      {project.stagingUrl}
                    </code>
                    <Button size="sm" variant="outline" asChild>
                      <a href={project.stagingUrl} target="_blank" rel="noopener noreferrer">
                        Abrir
                      </a>
                    </Button>
                  </div>
                </div>
              )}

              {project.developmentUrl && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Desarrollo</label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="text-sm bg-muted px-2 py-1 rounded flex-1">
                      {project.developmentUrl}
                    </code>
                    <Button size="sm" variant="outline" asChild>
                      <a href={project.developmentUrl} target="_blank" rel="noopener noreferrer">
                        Abrir
                      </a>
                    </Button>
                  </div>
                </div>
              )}

              {project.hostingProvider && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Hosting</label>
                  <p className="text-sm mt-1">{project.hostingProvider}</p>
                </div>
              )}

              {!project.productionUrl && !project.stagingUrl && !project.developmentUrl && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No hay URLs de producción configuradas
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* DOCUMENTATION TAB */}
        <TabsContent value="documentation">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Documentación y Recursos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {project.githubLink && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Github className="h-4 w-4" />
                    Repositorio GitHub
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="text-sm bg-muted px-2 py-1 rounded flex-1">
                      {project.githubLink}
                    </code>
                    <Button size="sm" variant="outline" asChild>
                      <a href={project.githubLink} target="_blank" rel="noopener noreferrer">
                        Ver
                      </a>
                    </Button>
                  </div>
                </div>
              )}

              {project.figmaLink && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Figma className="h-4 w-4" />
                    Figma
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="text-sm bg-muted px-2 py-1 rounded flex-1">
                      {project.figmaLink}
                    </code>
                    <Button size="sm" variant="outline" asChild>
                      <a href={project.figmaLink} target="_blank" rel="noopener noreferrer">
                        Abrir
                      </a>
                    </Button>
                  </div>
                </div>
              )}

              {project.documentationLink && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Documentación Técnica</label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="text-sm bg-muted px-2 py-1 rounded flex-1">
                      {project.documentationLink}
                    </code>
                    <Button size="sm" variant="outline" asChild>
                      <a href={project.documentationLink} target="_blank" rel="noopener noreferrer">
                        Ver
                      </a>
                    </Button>
                  </div>
                </div>
              )}

              {project.driveFolder && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <FolderOpen className="h-4 w-4" />
                    Google Drive
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="text-sm bg-muted px-2 py-1 rounded flex-1">
                      {project.driveFolder}
                    </code>
                    <Button size="sm" variant="outline" asChild>
                      <a href={project.driveFolder} target="_blank" rel="noopener noreferrer">
                        Abrir
                      </a>
                    </Button>
                  </div>
                </div>
              )}

              {!project.githubLink && !project.figmaLink && !project.documentationLink && !project.driveFolder && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No hay enlaces de documentación configurados
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TECHNICAL TAB */}
        <TabsContent value="technical">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Información Técnica
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {project.techDatabase && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    Base de Datos
                  </label>
                  <p className="text-sm mt-1">{project.techDatabase}</p>
                </div>
              )}

              {project.runtimeVersion && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Versión Runtime</label>
                  <p className="text-sm mt-1">{project.runtimeVersion}</p>
                </div>
              )}

              {project.techStack && project.techStack.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Tech Stack</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {project.techStack.map((tech, index) => (
                      <Badge key={index} variant="secondary">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {!project.techDatabase && !project.runtimeVersion && (!project.techStack || project.techStack.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No hay información técnica configurada
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* CONTACTS TAB */}
        <TabsContent value="contacts">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Contactos Clave
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {project.primaryClientContact && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Cliente Principal
                  </label>
                  <p className="text-sm mt-1">{project.primaryClientContact}</p>
                </div>
              )}

              {project.devopsContact && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Contacto DevOps</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm">{project.devopsContact}</p>
                  </div>
                </div>
              )}

              {project.emergencyContact && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Contacto de Emergencia
                  </label>
                  <p className="text-sm mt-1 font-medium text-destructive">{project.emergencyContact}</p>
                </div>
              )}

              {!project.primaryClientContact && !project.devopsContact && !project.emergencyContact && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No hay contactos configurados
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ENV VARS TAB - ADMIN ONLY */}
        {isAdmin && (
          <TabsContent value="env">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Variables de Entorno
                  <Badge variant="secondary" className="ml-2">
                    Solo Admin
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {project.envVars ? (
                  <div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Las variables de entorno están almacenadas de forma segura en formato
                      encriptado.
                    </p>
                    <div className="bg-muted p-4 rounded-lg">
                      <p className="text-xs font-mono text-muted-foreground">
                        {project.envVars}
                      </p>
                    </div>
                    {project.envVarsLastUpdated && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Última actualización: {formatDate(project.envVarsLastUpdated)}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No hay variables de entorno configuradas
                  </p>
                )}

                <Separator />

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/projects/${id}/edit`}>
                      Editar Variables
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
