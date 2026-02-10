"use client";

import { useState, useCallback, useEffect } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { moveTask } from "@/actions/tasks";
import { TaskCard } from "./task-card";
import { TaskDetailsDialog } from "./task-details-dialog";

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

interface Column {
  id: string;
  title: string;
  tasks: Task[];
}

interface TasksKanbanProps {
  initialColumns: Column[];
  projects: { id: string; name: string }[];
  members: { id: string; name: string; image: string | null }[];
  currentProjectId?: string;
}

export function TasksKanban({
  initialColumns,
  projects,
  members,
  currentProjectId,
}: TasksKanbanProps) {
  const [columns, setColumns] = useState<Column[]>(initialColumns);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Sync columns when initialColumns change (e.g., after creating a new task)
  useEffect(() => {
    setColumns(initialColumns);
  }, [initialColumns]);

  const handleTaskClick = useCallback((task: Task, columnId: string) => {
    // Add status to task for the dialog
    setSelectedTask({ ...task, status: columnId });
    setDetailsOpen(true);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const findTaskById = useCallback(
    (id: string): { task: Task; columnId: string } | null => {
      for (const column of columns) {
        const task = column.tasks.find((t) => t.id === id);
        if (task) {
          return { task, columnId: column.id };
        }
      }
      return null;
    },
    [columns]
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { active } = event;
      const id = active.id as string;

      setActiveId(id);
      const found = findTaskById(id);
      if (found) {
        setActiveTask(found.task);
      }
    },
    [findTaskById]
  );

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;

      if (!over) return;

      const activeId = active.id as string;
      const overId = over.id as string;

      const activeResult = findTaskById(activeId);
      if (!activeResult) return;

      const { columnId: activeColumnId } = activeResult;

      // Determine target column
      let overColumnId: string;
      const overColumn = columns.find((c) => c.id === overId);
      if (overColumn) {
        overColumnId = overId;
      } else {
        const overResult = findTaskById(overId);
        if (overResult) {
          overColumnId = overResult.columnId;
        } else {
          return;
        }
      }

      if (activeColumnId === overColumnId) return;

      // Optimistic update
      setColumns((prev) => {
        const newColumns = prev.map((col) => ({
          ...col,
          tasks: [...col.tasks],
        }));

        const sourceCol = newColumns.find((c) => c.id === activeColumnId);
        const destCol = newColumns.find((c) => c.id === overColumnId);

        if (!sourceCol || !destCol) return prev;

        const taskIndex = sourceCol.tasks.findIndex((t) => t.id === activeId);
        if (taskIndex === -1) return prev;

        const [task] = sourceCol.tasks.splice(taskIndex, 1);
        destCol.tasks.push(task);

        return newColumns;
      });
    },
    [findTaskById, columns]
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;

      setActiveId(null);
      setActiveTask(null);

      if (!over) return;

      const activeId = active.id as string;

      const finalResult = findTaskById(activeId);
      if (!finalResult) return;

      const { columnId } = finalResult;

      const column = columns.find((c) => c.id === columnId);
      if (!column) return;

      const taskIndex = column.tasks.findIndex((t) => t.id === activeId);
      const newOrder = taskIndex;

      try {
        const result = await moveTask({
          id: activeId,
          status: columnId as any,
          order: newOrder,
        });

        if (!result.success) {
          toast.error(result.error);
          setColumns(initialColumns);
        }
      } catch (error) {
        toast.error("Error al mover tarea");
        setColumns(initialColumns);
      }
    },
    [findTaskById, columns, initialColumns]
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 min-h-[500px]">
        {columns.map((column) => (
          <TaskColumn
            key={column.id}
            column={column}
            projects={projects}
            members={members}
            onTaskClick={handleTaskClick}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask ? (
          <TaskCard
            task={activeTask}
            isDragging
            projects={projects}
            members={members}
          />
        ) : null}
      </DragOverlay>

      <TaskDetailsDialog
        task={selectedTask}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />
    </DndContext>
  );
}

function TaskColumn({
  column,
  projects,
  members,
  onTaskClick,
}: {
  column: Column;
  projects: { id: string; name: string }[];
  members: { id: string; name: string; image: string | null }[];
  onTaskClick: (task: Task, columnId: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  const columnColors: Record<string, string> = {
    TODO: "border-t-gray-400",
    IN_PROGRESS: "border-t-blue-400",
    IN_REVIEW: "border-t-yellow-400",
    DONE: "border-t-green-400",
  };

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex-shrink-0 w-80 bg-muted/30 rounded-lg p-4 border-t-4 transition-colors",
        columnColors[column.id] || "border-t-gray-400",
        isOver && "bg-muted/50 ring-2 ring-primary/20"
      )}
    >
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">{column.title}</h3>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {column.tasks.length}
          </span>
        </div>
      </div>

      {/* Tasks */}
      <div className="space-y-3 min-h-[200px]">
        <SortableContext
          items={column.tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {column.tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              projects={projects}
              members={members}
              onClick={() => onTaskClick(task, column.id)}
            />
          ))}
        </SortableContext>

        {column.tasks.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Sin tareas
          </div>
        )}
      </div>
    </div>
  );
}
