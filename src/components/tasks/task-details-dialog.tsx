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
} from "lucide-react";
import { toast } from "sonner";

import { cn, formatDate } from "@/lib/utils";
import { updateTask, deleteTask } from "@/actions/tasks";
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

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
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
    </>
  );
}
