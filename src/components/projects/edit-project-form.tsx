"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Github, ExternalLink, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { updateProject, deleteProject } from "@/actions/projects";
import {
  updateProjectSchema,
  type UpdateProjectInput,
} from "@/lib/validations/project";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  progress: number;
  startDate: Date | null;
  deadline: Date | null;
  budget: number | null;
  spent: number;
  currency: string;
  repoUrl?: string | null;
  techStack?: string[];
  client: { id: string; name: string; email: string | null } | null;
  // Extended fields
  productionUrl?: string | null;
  stagingUrl?: string | null;
  developmentUrl?: string | null;
  hostingProvider?: string | null;
  driveFolder?: string | null;
  figmaLink?: string | null;
  githubLink?: string | null;
  documentationLink?: string | null;
  envVars?: string | null;
  envVarsLastUpdated?: Date | null;
  techDatabase?: string | null;
  runtimeVersion?: string | null;
  devopsContact?: string | null;
  primaryClientContact?: string | null;
  emergencyContact?: string | null;
}

interface EditProjectFormProps {
  project: Project;
  clients: { id: string; name: string }[];
}

export function EditProjectForm({ project, clients }: EditProjectFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const formatDateForInput = (date: Date | null) => {
    if (!date) return "";
    return new Date(date).toISOString().split("T")[0];
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UpdateProjectInput>({
    resolver: zodResolver(updateProjectSchema),
    defaultValues: {
      name: project.name,
      description: project.description || undefined,
      status: project.status as UpdateProjectInput["status"],
      progress: project.progress,
      startDate: formatDateForInput(project.startDate) as unknown as Date,
      deadline: formatDateForInput(project.deadline) as unknown as Date,
      budget: project.budget || undefined,
      currency: project.currency,
      clientId: project.client?.id || undefined,
      // Extended fields
      productionUrl: project.productionUrl || undefined,
      stagingUrl: project.stagingUrl || undefined,
      developmentUrl: project.developmentUrl || undefined,
      hostingProvider: project.hostingProvider || undefined,
      driveFolder: project.driveFolder || undefined,
      figmaLink: project.figmaLink || undefined,
      githubLink: project.githubLink || undefined,
      documentationLink: project.documentationLink || undefined,
      envVars: project.envVars || undefined,
      envVarsLastUpdated: project.envVarsLastUpdated || undefined,
      techDatabase: project.techDatabase || undefined,
      runtimeVersion: project.runtimeVersion || undefined,
      devopsContact: project.devopsContact || undefined,
      primaryClientContact: project.primaryClientContact || undefined,
      emergencyContact: project.emergencyContact || undefined,
    },
  });

  const selectedStatus = watch("status");
  const selectedClient = watch("clientId");

  async function onSubmit(data: UpdateProjectInput) {
    setIsLoading(true);

    try {
      const result = await updateProject(project.id, data);

      if (result.success) {
        toast.success("Proyecto actualizado correctamente");
        router.push(`/projects/${project.id}`);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Error al actualizar proyecto");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete() {
    setIsDeleting(true);
    try {
      const result = await deleteProject(project.id);
      if (result.success) {
        toast.success("Proyecto eliminado correctamente");
        router.push("/projects");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Error al eliminar proyecto");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informacion General</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* GitHub info if exists */}
          {project.repoUrl && (
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Github className="h-5 w-5" />
              <div className="flex-1">
                <p className="text-sm font-medium">Proyecto de GitHub</p>
                <a
                  href={project.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                >
                  {project.repoUrl}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              {project.techStack && project.techStack.length > 0 && (
                <Badge variant="outline">{project.techStack[0]}</Badge>
              )}
            </div>
          )}

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Nombre <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Nombre del proyecto"
              disabled={isLoading}
              {...register("name")}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Descripcion</Label>
            <Textarea
              id="description"
              placeholder="Describe el proyecto..."
              rows={3}
              disabled={isLoading}
              {...register("description")}
            />
          </div>

          {/* Client */}
          <div className="space-y-2">
            <Label htmlFor="clientId">Cliente</Label>
            <Select
              value={selectedClient || "_none"}
              onValueChange={(value) =>
                setValue("clientId", value === "_none" ? undefined : value)
              }
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un cliente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">Sin cliente</SelectItem>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Estado y Progreso</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Estado</Label>
            <Select
              value={selectedStatus}
              onValueChange={(value) =>
                setValue("status", value as UpdateProjectInput["status"])
              }
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NOT_STARTED">No Iniciado</SelectItem>
                <SelectItem value="IN_PROGRESS">En Progreso</SelectItem>
                <SelectItem value="ON_HOLD">Pausado</SelectItem>
                <SelectItem value="COMPLETED">Completado</SelectItem>
                <SelectItem value="CANCELLED">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <Label htmlFor="progress">Progreso (%)</Label>
            <Input
              id="progress"
              type="number"
              min="0"
              max="100"
              disabled={isLoading}
              {...register("progress", { valueAsNumber: true })}
            />
            {errors.progress && (
              <p className="text-sm text-destructive">{errors.progress.message}</p>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Fecha de inicio</Label>
              <Input
                id="startDate"
                type="date"
                disabled={isLoading}
                {...register("startDate")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deadline">Fecha limite</Label>
              <Input
                id="deadline"
                type="date"
                disabled={isLoading}
                {...register("deadline")}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Presupuesto</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-2">
              <Label htmlFor="budget">Presupuesto</Label>
              <Input
                id="budget"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                disabled={isLoading}
                {...register("budget", { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Moneda</Label>
              <Select
                value={watch("currency")}
                onValueChange={(value) => setValue("currency", value)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="MXN">MXN</SelectItem>
                  <SelectItem value="ARS">ARS</SelectItem>
                  <SelectItem value="COP">COP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 1. INFORMACIÓN DE PRODUCCIÓN */}
      <Card>
        <CardHeader>
          <CardTitle>Información de Producción</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="productionUrl">URL de Producción</Label>
            <Input
              id="productionUrl"
              type="url"
              placeholder="https://ejemplo.com"
              disabled={isLoading}
              {...register("productionUrl")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="stagingUrl">URL de Staging</Label>
            <Input
              id="stagingUrl"
              type="url"
              placeholder="https://staging.ejemplo.com"
              disabled={isLoading}
              {...register("stagingUrl")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="developmentUrl">URL de Desarrollo</Label>
            <Input
              id="developmentUrl"
              type="url"
              placeholder="http://localhost:3000"
              disabled={isLoading}
              {...register("developmentUrl")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hostingProvider">Proveedor de Hosting</Label>
            <Input
              id="hostingProvider"
              placeholder="AWS, Vercel, DigitalOcean, Railway..."
              disabled={isLoading}
              {...register("hostingProvider")}
            />
          </div>
        </CardContent>
      </Card>

      {/* 2. ALMACENAMIENTO Y DOCUMENTACIÓN */}
      <Card>
        <CardHeader>
          <CardTitle>Almacenamiento y Documentación</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="driveFolder">Carpeta Google Drive</Label>
            <Input
              id="driveFolder"
              type="url"
              placeholder="https://drive.google.com/drive/folders/..."
              disabled={isLoading}
              {...register("driveFolder")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="figmaLink">Enlace Figma</Label>
            <Input
              id="figmaLink"
              type="url"
              placeholder="https://figma.com/file/..."
              disabled={isLoading}
              {...register("figmaLink")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="githubLink">Enlace GitHub</Label>
            <Input
              id="githubLink"
              type="url"
              placeholder="https://github.com/..."
              disabled={isLoading}
              {...register("githubLink")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="documentationLink">Documentación Técnica</Label>
            <Input
              id="documentationLink"
              type="url"
              placeholder="https://notion.so/... o https://..."
              disabled={isLoading}
              {...register("documentationLink")}
            />
          </div>
        </CardContent>
      </Card>

      {/* 3. CAJA FUERTE PARA ENV */}
      <Card className="border-2 border-orange-200 bg-orange-50/30">
        <CardHeader>
          <CardTitle className="text-orange-900">🔒 Caja Fuerte - Variables de Entorno</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-orange-100/50 p-3 text-sm text-orange-800">
            <p className="font-semibold mb-1">⚠️ Información Sensible</p>
            <p>Solo admins y desarrolladores principales pueden ver esto. Los cambios quedan registrados.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="envVars">Variables de Entorno (JSON)</Label>
            <Textarea
              id="envVars"
              placeholder={`{\n  "DB_URL": "postgresql://...",\n  "API_KEY": "...",\n  "SECRET": "..."\n}`}
              className="font-mono text-xs h-48"
              disabled={isLoading}
              {...register("envVars")}
            />
            <p className="text-xs text-muted-foreground">Formato JSON encriptado. Ej: {"{"}"DB_URL": "...", "API_KEY": "..."{"}"}</p>
          </div>
        </CardContent>
      </Card>

      {/* 4. INFORMACIÓN TÉCNICA */}
      <Card>
        <CardHeader>
          <CardTitle>Información Técnica</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="techDatabase">Base de Datos</Label>
            <Input
              id="techDatabase"
              placeholder="PostgreSQL, MongoDB, MySQL..."
              disabled={isLoading}
              {...register("techDatabase")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="runtimeVersion">Versión de Runtime</Label>
            <Input
              id="runtimeVersion"
              placeholder="Node 20.x, Python 3.11, PHP 8.2..."
              disabled={isLoading}
              {...register("runtimeVersion")}
            />
          </div>
        </CardContent>
      </Card>

      {/* 5. CONTACTOS CLAVE */}
      <Card>
        <CardHeader>
          <CardTitle>Contactos Clave</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="devopsContact">Contacto DevOps/Admin Principal</Label>
            <Input
              id="devopsContact"
              placeholder="Nombre o email del DevOps/Admin"
              disabled={isLoading}
              {...register("devopsContact")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="primaryClientContact">Contacto Principal del Cliente</Label>
            <Input
              id="primaryClientContact"
              placeholder="Nombre o email del cliente"
              disabled={isLoading}
              {...register("primaryClientContact")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="emergencyContact">Contacto de Emergencia</Label>
            <Input
              id="emergencyContact"
              placeholder="Email o teléfono de emergencia"
              disabled={isLoading}
              {...register("emergencyContact")}
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isLoading || isDeleting}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading || isDeleting}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar Cambios
          </Button>
        </div>

        <Button
          type="button"
          variant="destructive"
          onClick={() => setDeleteDialogOpen(true)}
          disabled={isLoading || isDeleting}
          className="sm:w-auto w-full"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Cortar por lo sano (Eliminar Proyecto)
        </Button>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar proyecto?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que quieres eliminar <strong>{project.name}</strong>? Esta acción eliminará
              todas las tareas asociadas y no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Eliminando..." : "Eliminar Permanentemente"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  );
}
