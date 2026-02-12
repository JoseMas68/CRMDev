"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { createTask } from "@/actions/tasks";
import { createTaskSchema, type CreateTaskInput } from "@/lib/validations/task";
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

interface CreateTaskDialogProps {
  children: ReactNode;
  projects: { id: string; name: string }[];
  members: { id: string; name: string; image: string | null }[];
  defaultProjectId?: string;
}

export function CreateTaskDialog({
  children,
  projects,
  members,
  defaultProjectId,
}: CreateTaskDialogProps) {
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
  } = useForm<CreateTaskInput>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      status: "TODO",
      priority: "MEDIUM",
      projectId: defaultProjectId || undefined,
      labels: [],
      tags: [],
    },
  });

  const selectedStatus = watch("status");
  const selectedPriority = watch("priority");
  const selectedProject = watch("projectId");
  const selectedAssignee = watch("assigneeId");

  // Debug: log form errors
  console.log("Form errors:", errors);

  async function onSubmit(data: CreateTaskInput) {
    console.log("[CREATE-TASK] onSubmit llamado con:", data);
    setIsLoading(true);

    try {
      // Data has already been validated by zod, just pass it through
      // Clean up falsy values to undefined for optional fields
      const cleanData = {
        title: data.title,
        status: data.status,
        priority: data.priority,
        description: data.description || undefined,
        dueDate: data.dueDate || undefined,
        estimatedHours: data.estimatedHours ?? undefined,
        projectId: data.projectId || undefined,
        assigneeId: data.assigneeId || undefined,
        labels: [],
        tags: [],
      };

      console.log("Enviando datos:", cleanData);
      const result = await createTask(cleanData);
      console.log("Resultado:", result);

      if (result.success) {
        toast.success("Tarea creada correctamente");
        reset();
        setOpen(false);
        router.refresh();
      } else {
        toast.error(result.error || "Error desconocido");
        console.error("Error del servidor:", result.error);
      }
    } catch (error) {
      console.error("Error catch:", error);
      toast.error("Error al crear tarea: " + (error instanceof Error ? error.message : "desconocido"));
    } finally {
      setIsLoading(false);
    }
  }

  function handleOpenChange(newOpen: boolean) {
    if (!newOpen) {
      reset({
        status: "TODO",
        priority: "MEDIUM",
        projectId: defaultProjectId || undefined,
      });
    }
    setOpen(newOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva Tarea</DialogTitle>
          <DialogDescription>
            Crea una nueva tarea para organizar tu trabajo.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Titulo <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              placeholder="Titulo de la tarea"
              disabled={isLoading}
              {...register("title")}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Descripcion</Label>
            <Textarea
              id="description"
              placeholder="Describe la tarea..."
              rows={3}
              disabled={isLoading}
              {...register("description")}
            />
          </div>

          {/* Status and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <Select
                value={selectedStatus}
                onValueChange={(value) =>
                  setValue("status", value as CreateTaskInput["status"])
                }
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODO">Por Hacer</SelectItem>
                  <SelectItem value="IN_PROGRESS">En Progreso</SelectItem>
                  <SelectItem value="IN_REVIEW">En Revision</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Prioridad</Label>
              <Select
                value={selectedPriority}
                onValueChange={(value) =>
                  setValue("priority", value as CreateTaskInput["priority"])
                }
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Baja</SelectItem>
                  <SelectItem value="MEDIUM">Media</SelectItem>
                  <SelectItem value="HIGH">Alta</SelectItem>
                  <SelectItem value="URGENT">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Project */}
          <div className="space-y-2">
            <Label htmlFor="projectId">Proyecto (opcional)</Label>
            <Select
              value={selectedProject || "_none"}
              onValueChange={(value) =>
                setValue("projectId", value === "_none" ? undefined : value)
              }
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un proyecto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">Sin proyecto</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Assignee */}
          <div className="space-y-2">
            <Label htmlFor="assigneeId">Asignar a (opcional)</Label>
            <Select
              value={selectedAssignee || "_none"}
              onValueChange={(value) =>
                setValue("assigneeId", value === "_none" ? undefined : value)
              }
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un miembro" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">Sin asignar</SelectItem>
                {members.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Due Date and Estimated Hours */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dueDate">Fecha limite</Label>
              <Input
                id="dueDate"
                type="date"
                disabled={isLoading}
                {...register("dueDate")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimatedHours">Horas estimadas</Label>
              <Input
                id="estimatedHours"
                type="number"
                min="0"
                step="0.5"
                placeholder="0"
                disabled={isLoading}
                {...register("estimatedHours", { valueAsNumber: true })}
              />
            </div>
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
              Crear Tarea
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
