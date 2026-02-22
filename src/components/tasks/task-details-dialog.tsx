"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  FolderKanban,
  User,
  Tag,
  GitBranch,
  GitPullRequest,
  ExternalLink,
  CheckCircle2,
  Trash2,
  X,
  ArrowUpDown,
} from "lucide-react";
import { toast } from "sonner";

import { cn, formatDate } from "@/lib/utils";
import { updateTask, deleteTask } from "@/actions/tasks";
import { addManualTimeEntry } from "@/actions/time";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: Date | null;
  order: number;
  project: { id: string; name: string } | null;
  assignee: { id: string; name: string; image: string | null } | null;
  _count: { subtasks: number };
  issueUrl?: string | null;
  prUrl?: string | null;
  labels?: string[];
  commitHash?: string | null;
}

interface TaskDetailsDialogProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const priorityColors: Record<string, string> = {
  LOW: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  MEDIUM: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  HIGH: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  URGENT: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

const priorityLabels: Record<string, string> = {
  LOW: "Baja",
  MEDIUM: "Media",
  HIGH: "Alta",
  URGENT: "Urgente",
};

const statusLabels: Record<string, string> = {
  TODO: "Por Hacer",
  IN_PROGRESS: "En Progreso",
  IN_REVIEW: "En Revision",
  DONE: "Completada",
  CANCELLED: "Cancelada",
};

const statusColors: Record<string, string> = {
  TODO: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  IN_PROGRESS: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  IN_REVIEW: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  DONE: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

export function TaskDetailsDialog({ task, open, onOpenChange }: TaskDetailsDialogProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Time Tracking State
  const [showTimeDialog, setShowTimeDialog] = useState(false);
  const [isSavingTime, setIsSavingTime] = useState(false);
  const [timeHours, setTimeHours] = useState("1");
  const [timeMinutes, setTimeMinutes] = useState("0");
  const [timeDesc, setTimeDesc] = useState("");

  if (!task) return null;

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "DONE";

  async function handleMarkAsDone() {
    if (!task) return;
    setIsLoading(true);
    try {
      const result = await updateTask(task.id, { status: "DONE" });
      if (result.success) {
        toast.success("Tarea completada");
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Error al completar tarea");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete() {
    if (!task) return;
    setIsLoading(true);
    try {
      const result = await deleteTask(task.id);
      if (result.success) {
        toast.success("Tarea eliminada");
        setShowDeleteDialog(false);
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Error al eliminar tarea");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleStatusChange(newStatus: string) {
    if (!task || newStatus === task.status) return;
    setIsUpdatingStatus(true);
    try {
      const result = await updateTask(task.id, { status: newStatus as "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE" | "CANCELLED" });
      if (result.success) {
        toast.success(`Estado cambiado a ${statusLabels[newStatus]}`);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Error al cambiar estado");
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  async function handleSaveTime() {
    if (!task) return;
    const hours = parseInt(timeHours) || 0;
    const mins = parseInt(timeMinutes) || 0;
    const totalMins = (hours * 60) + mins;

    if (totalMins <= 0) {
      toast.error("El tiempo debe ser mayor a 0");
      return;
    }

    setIsSavingTime(true);
    try {
      const res = await addManualTimeEntry({
        taskId: task.id,
        duration: totalMins,
        description: timeDesc,
        date: new Date()
      });

      if (res.success) {
        toast.success("Tiempo registrado correctamente");
        setShowTimeDialog(false);
        setTimeHours("1");
        setTimeMinutes("0");
        setTimeDesc("");
        router.refresh();
      } else {
        toast.error(res.error || "Error al guardar el tiempo");
      }
    } catch (error) {
      toast.error("Error al registrar tiempo");
    } finally {
      setIsSavingTime(false);
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[95vw] sm:max-w-[600px] max-h-[95vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-xl pr-8">{task.title}</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Status and Priority */}
            <div className="flex flex-wrap gap-2">
              <Badge className={cn("text-sm", statusColors[task.status])}>
                {statusLabels[task.status]}
              </Badge>
              <Badge className={cn("text-sm", priorityColors[task.priority])}>
                Prioridad: {priorityLabels[task.priority]}
              </Badge>
            </div>

            {/* Description */}
            {task.description && (
              <div>
                <h4 className="text-sm font-medium mb-2">Descripcion</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {task.description}
                </p>
              </div>
            )}

            {/* Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Project */}
              {task.project && (
                <div className="flex items-center gap-2">
                  <FolderKanban className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Proyecto</p>
                    <p className="text-sm font-medium">{task.project.name}</p>
                  </div>
                </div>
              )}

              {/* Assignee */}
              {task.assignee && (
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={task.assignee.image || undefined} />
                    <AvatarFallback>
                      {task.assignee.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-xs text-muted-foreground">Asignado a</p>
                    <p className="text-sm font-medium">{task.assignee.name}</p>
                  </div>
                </div>
              )}

              {/* Due Date */}
              {task.dueDate && (
                <div className="flex items-center gap-2">
                  <Calendar className={cn("h-4 w-4", isOverdue ? "text-destructive" : "text-muted-foreground")} />
                  <div>
                    <p className="text-xs text-muted-foreground">Fecha limite</p>
                    <p className={cn("text-sm font-medium", isOverdue && "text-destructive")}>
                      {formatDate(task.dueDate)}
                      {isOverdue && " (Vencida)"}
                    </p>
                  </div>
                </div>
              )}

              {/* Subtasks */}
              {task._count.subtasks > 0 && (
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Subtareas</p>
                    <p className="text-sm font-medium">{task._count.subtasks}</p>
                  </div>
                </div>
              )}
            </div>

            {/* GitHub Integration */}
            {(task.issueUrl || task.prUrl || task.commitHash) && (
              <div>
                <h4 className="text-sm font-medium mb-2">Enlaces GitHub</h4>
                <div className="flex flex-wrap gap-3">
                  {task.issueUrl && (
                    <a
                      href={task.issueUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary"
                    >
                      <GitBranch className="h-4 w-4" />
                      Ver Issue
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  {task.prUrl && (
                    <a
                      href={task.prUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary"
                    >
                      <GitPullRequest className="h-4 w-4" />
                      Ver PR
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  {task.commitHash && (
                    <code className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded font-mono">
                      Commit: {task.commitHash.slice(0, 7)}
                    </code>
                  )}
                </div>
              </div>
            )}

            {/* Labels */}
            {task.labels && task.labels.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Etiquetas</h4>
                <div className="flex flex-wrap gap-2">
                  {task.labels.map((label) => (
                    <Badge
                      key={label}
                      variant={label as "bug" | "feature" | "enhancement" | "documentation" | "refactor" | "hotfix"}
                    >
                      {label}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Status Changer - Mobile */}
            <div className="lg:hidden pt-4 border-t">
              <div className="space-y-2">
                <Label htmlFor="status-select" className="flex items-center gap-2">
                  <ArrowUpDown className="h-4 w-4" />
                  Cambiar Estado
                </Label>
                <Select
                  value={task.status}
                  onValueChange={handleStatusChange}
                  disabled={isUpdatingStatus}
                >
                  <SelectTrigger id="status-select" className="w-full">
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODO">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-gray-500" />
                        Por Hacer
                      </div>
                    </SelectItem>
                    <SelectItem value="IN_PROGRESS">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        En Progreso
                      </div>
                    </SelectItem>
                    <SelectItem value="IN_REVIEW">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-yellow-500" />
                        En Revisión
                      </div>
                    </SelectItem>
                    <SelectItem value="DONE">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        Completada
                      </div>
                    </SelectItem>
                    <SelectItem value="CANCELLED">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                        Cancelada
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                {isUpdatingStatus && (
                  <p className="text-xs text-muted-foreground">Actualizando estado...</p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setShowTimeDialog(true)}
                disabled={isLoading}
                className="w-full sm:w-auto text-blue-600 border-blue-200 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-900 dark:hover:bg-blue-900/50"
              >
                <Clock className="h-4 w-4 sm:mr-0 mr-2" />
                <span className="sm:hidden">Añadir Tiempo</span>
              </Button>

              {task.status !== "DONE" && (
                <Button
                  onClick={handleMarkAsDone}
                  disabled={isLoading}
                  className="flex-1"
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Completar Tarea
                </Button>
              )}
              <Button
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                <Trash2 className="h-4 w-4 sm:mr-0 mr-2" />
                <span className="sm:hidden">Eliminar</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar tarea</AlertDialogTitle>
            <AlertDialogDescription>
              Estas seguro de que quieres eliminar &quot;{task.title}&quot;?
              Esta accion no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Time Tracking Manual Dialog */}
      <Dialog open={showTimeDialog} onOpenChange={setShowTimeDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Registrar Tiempo Manual</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hours">Horas</Label>
                <Input
                  id="hours"
                  type="number"
                  min="0"
                  value={timeHours}
                  onChange={(e) => setTimeHours(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minutes">Minutos</Label>
                <Input
                  id="minutes"
                  type="number"
                  min="0"
                  max="59"
                  value={timeMinutes}
                  onChange={(e) => setTimeMinutes(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descripción (opcional)</Label>
              <Textarea
                id="description"
                placeholder="¿Qué hiciste en este tiempo?"
                value={timeDesc}
                onChange={(e) => setTimeDesc(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowTimeDialog(false)} disabled={isSavingTime}>
              Cancelar
            </Button>
            <Button onClick={handleSaveTime} disabled={isSavingTime}>
              {isSavingTime ? "Guardando..." : "Guardar Tiempo"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
