"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  MoreHorizontal,
  Calendar,
  FolderKanban,
  Trash2,
  CheckCircle2,
  GitBranch,
  GitPullRequest,
  ExternalLink,
  Eye,
} from "lucide-react";
import { toast } from "sonner";

import { cn, formatDate } from "@/lib/utils";
import { updateTask, deleteTask } from "@/actions/tasks";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  priority: string;
  dueDate: Date | null;
  order: number;
  project: { id: string; name: string } | null;
  assignee: { id: string; name: string; image: string | null } | null;
  _count: { subtasks: number };
  // CRMDev GitHub fields
  issueUrl?: string | null;
  prUrl?: string | null;
  labels?: string[];
  commitHash?: string | null;
}

interface TaskCardProps {
  task: Task;
  isDragging?: boolean;
  projects: { id: string; name: string }[];
  members: { id: string; name: string; image: string | null }[];
  onClick?: () => void;
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

export function TaskCard({ task, isDragging, projects, members, onClick }: TaskCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isOverdue =
    task.dueDate && new Date(task.dueDate) < new Date();

  async function handleMarkAsDone() {
    setIsLoading(true);
    try {
      const result = await updateTask(task.id, { status: "DONE" });
      if (result.success) {
        toast.success("Tarea completada");
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
    setIsLoading(true);
    try {
      const result = await deleteTask(task.id);
      if (result.success) {
        toast.success("Tarea eliminada");
        setShowDeleteDialog(false);
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
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className={cn(
          "bg-card border rounded-lg p-3 shadow-sm cursor-grab active:cursor-grabbing group",
          "hover:shadow-md transition-shadow",
          (isDragging || isSortableDragging) && "shadow-lg opacity-50",
          isOverdue && "border-destructive/50"
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h4
            className={cn(
              "font-medium text-sm line-clamp-2",
              onClick && "cursor-pointer hover:text-primary transition-colors"
            )}
            onClick={(e) => {
              if (onClick) {
                e.stopPropagation();
                onClick();
              }
            }}
          >
            {task.title}
          </h4>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onClick && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onClick();
                  }}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Ver Detalles
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  handleMarkAsDone();
                }}
                disabled={isLoading}
              >
                <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                Marcar como Completada
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteDialog(true);
                }}
                disabled={isLoading}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Description preview */}
        {task.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
            {task.description}
          </p>
        )}

        {/* Metadata */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="secondary"
            className={cn("text-xs font-normal", priorityColors[task.priority])}
          >
            {priorityLabels[task.priority]}
          </Badge>

          {task.project && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <FolderKanban className="h-3 w-3" />
              {task.project.name}
            </span>
          )}
        </div>

        {/* GitHub Links - CRMDev */}
        {(task.issueUrl || task.prUrl || task.commitHash) && (
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {task.issueUrl && (
              <a
                href={task.issueUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                <GitBranch className="h-3 w-3" />
                Issue
                <ExternalLink className="h-2 w-2" />
              </a>
            )}
            {task.prUrl && (
              <a
                href={task.prUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                <GitPullRequest className="h-3 w-3" />
                PR
                <ExternalLink className="h-2 w-2" />
              </a>
            )}
            {task.commitHash && (
              <code className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-mono">
                {task.commitHash.slice(0, 7)}
              </code>
            )}
          </div>
        )}

        {/* Dev Labels - CRMDev */}
        {task.labels && task.labels.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {task.labels.map((label) => (
              <Badge
                key={label}
                variant={label as "bug" | "feature" | "enhancement" | "documentation" | "refactor" | "hotfix"}
                className="text-[10px] px-1.5 py-0"
              >
                {label}
              </Badge>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 pt-2 border-t">
          {task.dueDate ? (
            <span
              className={cn(
                "text-xs flex items-center gap-1",
                isOverdue ? "text-destructive" : "text-muted-foreground"
              )}
            >
              <Calendar className="h-3 w-3" />
              {formatDate(task.dueDate)}
            </span>
          ) : (
            <span />
          )}

          {task.assignee && (
            <Avatar className="h-6 w-6">
              <AvatarImage
                src={task.assignee.image || undefined}
                alt={task.assignee.name}
              />
              <AvatarFallback className="text-xs">
                {task.assignee.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
          )}
        </div>

        {/* Subtasks count */}
        {task._count.subtasks > 0 && (
          <div className="mt-2 text-xs text-muted-foreground">
            {task._count.subtasks} subtarea{task._count.subtasks > 1 ? "s" : ""}
          </div>
        )}
      </div>

      {/* Delete dialog */}
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
