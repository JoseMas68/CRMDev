"use client";

import { useState } from "react";
import { CheckCircle2, Circle, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";

import { cn, formatDate } from "@/lib/utils";
import { updateTask } from "@/actions/tasks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: Date | null;
  assignee: { id: string; name: string; image: string | null } | null;
}

interface ProjectTaskListProps {
  tasks: Task[];
  projectId: string;
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

export function ProjectTaskList({ tasks, projectId }: ProjectTaskListProps) {
  const [loadingTasks, setLoadingTasks] = useState<Set<string>>(new Set());

  async function toggleTaskStatus(task: Task) {
    const newStatus = task.status === "DONE" ? "TODO" : "DONE";

    setLoadingTasks((prev) => new Set(prev).add(task.id));

    try {
      const result = await updateTask(task.id, { status: newStatus });

      if (!result.success) {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Error al actualizar tarea");
    } finally {
      setLoadingTasks((prev) => {
        const next = new Set(prev);
        next.delete(task.id);
        return next;
      });
    }
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No hay tareas en este proyecto. Crea la primera.
      </div>
    );
  }

  // Group tasks by status
  const pendingTasks = tasks.filter((t) => t.status !== "DONE");
  const completedTasks = tasks.filter((t) => t.status === "DONE");

  return (
    <div className="space-y-6">
      {/* Pending tasks */}
      {pendingTasks.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">
            Pendientes ({pendingTasks.length})
          </h4>
          <div className="space-y-2">
            {pendingTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                isLoading={loadingTasks.has(task.id)}
                onToggle={() => toggleTaskStatus(task)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Completed tasks */}
      {completedTasks.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">
            Completadas ({completedTasks.length})
          </h4>
          <div className="space-y-2">
            {completedTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                isLoading={loadingTasks.has(task.id)}
                onToggle={() => toggleTaskStatus(task)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TaskItem({
  task,
  isLoading,
  onToggle,
}: {
  task: Task;
  isLoading: boolean;
  onToggle: () => void;
}) {
  const isDone = task.status === "DONE";
  const isOverdue =
    task.dueDate && new Date(task.dueDate) < new Date() && !isDone;

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border transition-colors",
        isDone && "bg-muted/50",
        isOverdue && "border-destructive/50"
      )}
    >
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 shrink-0"
        onClick={onToggle}
        disabled={isLoading}
      >
        {isDone ? (
          <CheckCircle2 className="h-5 w-5 text-green-500" />
        ) : (
          <Circle className="h-5 w-5 text-muted-foreground" />
        )}
      </Button>

      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-medium", isDone && "line-through text-muted-foreground")}>
          {task.title}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <Badge
            variant="secondary"
            className={cn("text-xs font-normal", priorityColors[task.priority])}
          >
            {priorityLabels[task.priority]}
          </Badge>
          {task.dueDate && (
            <span
              className={cn(
                "text-xs flex items-center gap-1",
                isOverdue ? "text-destructive" : "text-muted-foreground"
              )}
            >
              {isOverdue ? (
                <AlertCircle className="h-3 w-3" />
              ) : (
                <Clock className="h-3 w-3" />
              )}
              {formatDate(task.dueDate)}
            </span>
          )}
        </div>
      </div>

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
  );
}
