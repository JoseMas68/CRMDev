"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Github, ExternalLink } from "lucide-react";
import { toast } from "sonner";

import { updateProject } from "@/actions/projects";
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
}

interface EditProjectFormProps {
  project: Project;
  clients: { id: string; name: string }[];
}

export function EditProjectForm({ project, clients }: EditProjectFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

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
          <div className="grid grid-cols-2 gap-4">
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
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-2">
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

      {/* Actions */}
      <div className="flex gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Guardar Cambios
        </Button>
      </div>
    </form>
  );
}
