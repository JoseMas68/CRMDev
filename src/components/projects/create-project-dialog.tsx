"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { createProject } from "@/actions/projects";
import {
  createProjectSchema,
  type CreateProjectInput,
} from "@/lib/validations/project";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CreateProjectDialogProps {
  children: ReactNode;
  clients: { id: string; name: string }[];
}

export function CreateProjectDialog({
  children,
  clients,
}: CreateProjectDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateProjectInput>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      type: "OTHER",
      status: "NOT_STARTED",
      currency: "USD",
      techStack: [],
      labels: [],
    },
  });

  const selectedType = watch("type");
  const selectedStatus = watch("status");
  const selectedClient = watch("clientId");

  async function onSubmit(data: CreateProjectInput) {
    setIsLoading(true);

    try {
      const result = await createProject(data);

      if (result.success) {
        toast.success("Proyecto creado correctamente");
        reset();
        setOpen(false);
        router.push(`/projects/${result.data.id}`);
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Error al crear proyecto");
    } finally {
      setIsLoading(false);
    }
  }

  function handleOpenChange(newOpen: boolean) {
    if (!newOpen) {
      reset();
    }
    setOpen(newOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuevo Proyecto</DialogTitle>
          <DialogDescription>
            Crea un nuevo proyecto para organizar tus tareas y seguir el
            progreso.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
            <Label htmlFor="clientId">Cliente (opcional)</Label>
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

          {/* Project Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Tipo de Proyecto</Label>
            <Select
              value={selectedType}
              onValueChange={(value) =>
                setValue("type", value as CreateProjectInput["type"])
              }
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="OTHER">Otro</SelectItem>
                <SelectItem value="GITHUB">GitHub</SelectItem>
                <SelectItem value="WORDPRESS">WordPress</SelectItem>
                <SelectItem value="VERCEL">Vercel</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* URLs based on type */}
          {selectedType === "GITHUB" && (
            <div className="space-y-2">
              <Label htmlFor="repoUrl">URL del Repositorio (opcional)</Label>
              <Input
                id="repoUrl"
                type="url"
                placeholder="https://github.com/usuario/repo"
                disabled={isLoading}
                {...register("repoUrl")}
              />
              {errors.repoUrl && (
                <p className="text-sm text-destructive">{errors.repoUrl.message}</p>
              )}
            </div>
          )}

          {selectedType === "WORDPRESS" && (
            <div className="space-y-2">
              <Label htmlFor="wpUrl">URL del Sitio WordPress</Label>
              <Input
                id="wpUrl"
                type="url"
                placeholder="https://ejemplo.com"
                disabled={isLoading}
                {...register("wpUrl")}
              />
              {errors.wpUrl && (
                <p className="text-sm text-destructive">{errors.wpUrl.message}</p>
              )}
            </div>
          )}

          {selectedType === "VERCEL" && (
            <div className="space-y-2">
              <Label htmlFor="vercelUrl">URL de Vercel (opcional)</Label>
              <Input
                id="vercelUrl"
                type="url"
                placeholder="https://tu-app.vercel.app"
                disabled={isLoading}
                {...register("vercelUrl")}
              />
              {errors.vercelUrl && (
                <p className="text-sm text-destructive">{errors.vercelUrl.message}</p>
              )}
            </div>
          )}

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Estado</Label>
            <Select
              value={selectedStatus}
              onValueChange={(value) =>
                setValue("status", value as CreateProjectInput["status"])
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
              </SelectContent>
            </Select>
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

          {/* Budget */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="budget">Presupuesto (opcional)</Label>
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

          {/* Tech Stack */}
          <div className="space-y-2">
            <Label htmlFor="techStack">Tech Stack (separado por comas)</Label>
            <Input
              id="techStack"
              placeholder="React, Next.js, Prisma"
              disabled={isLoading}
              {...register("techStack")}
              onChange={(e) => {
                const value = e.target.value;
                setValue("techStack", value ? value.split(",").map(s => s.trim()) : []);
              }}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear Proyecto
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
