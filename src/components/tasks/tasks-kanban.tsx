"use client";

import { useState, useCallback, useEffect } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
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
import { ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
  const [selectedColumnId, setSelectedColumnId] = useState<string | null>(null);

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
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
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
    <>
      {/* MOBILE VIEW - List style with accordion */}
      <div className="lg:hidden">
        <AnimatePresence mode="popLayout">
          {columns.map((column) => (
            <MobileTaskColumn
              key={column.id}
              column={column}
              projects={projects}
              members={members}
              onTaskClick={handleTaskClick}
              isExpanded={selectedColumnId === column.id}
              onToggle={() => setSelectedColumnId(selectedColumnId === column.id ? null : column.id)}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* DESKTOP VIEW - Traditional Kanban */}
      <div className="hidden lg:block">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex overflow-x-auto gap-6 min-h-[500px]">
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
                useDragHandle={true}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      <TaskDetailsDialog
        task={selectedTask}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />
    </>
  );
}

// Mobile Column - Accordion style
function MobileTaskColumn({
  column,
  projects,
  members,
  onTaskClick,
  isExpanded,
  onToggle,
}: {
  column: Column;
  projects: { id: string; name: string }[];
  members: { id: string; name: string; image: string | null }[];
  onTaskClick: (task: Task, columnId: string) => void;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const columnColors: Record<string, string> = {
    TODO: "from-gray-500 to-gray-600",
    IN_PROGRESS: "from-blue-500 to-blue-600",
    IN_REVIEW: "from-yellow-500 to-yellow-600",
    DONE: "from-green-500 to-green-600",
  };

  return (
    <motion.div
      initial={false}
      animate={{ height: isExpanded ? "auto" : 80 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="mb-3 overflow-hidden"
    >
      <div
        onClick={onToggle}
        className="bg-gradient-to-r dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-lg overflow-hidden cursor-pointer active:scale-[0.99] transition-transform"
      >
        {/* Header siempre visible */}
        <div className="bg-gradient-to-r p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-lg", columnColors[column.id]?.split(" ")[0].replace("from-", "bg-") || "bg-gray-500")}>
              {column.tasks.length}
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">{column.title}</h3>
              <p className="text-white/80 text-sm">{column.tasks.length} {column.tasks.length === 1 ? 'tarea' : 'tareas'}</p>
            </div>
          </div>
          <motion.div
            animate={{ rotate: isExpanded ? 90 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronRight className="h-8 w-8 text-white" />
          </motion.div>
        </div>

        {/* Tasks - expandible */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white dark:bg-gray-900"
            >
              <div className="p-4 space-y-3">
                {column.tasks.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <p className="text-base">Sin tareas</p>
                  </div>
                ) : (
                  column.tasks.map((task, index) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <div
                        onClick={() => onTaskClick(task, column.id)}
                        className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 active:scale-95 transition-transform cursor-pointer shadow-sm hover:shadow-md"
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h4 className="font-semibold text-base flex-1 text-gray-900 dark:text-white">
                            {task.title}
                          </h4>
                          <span className={cn("text-xs font-bold px-2 py-1 rounded-full", task.priority === "HIGH" ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" : task.priority === "MEDIUM" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300" : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300")}>
                            {task.priority === "HIGH" ? "Alta" : task.priority === "MEDIUM" ? "Media" : "Baja"}
                          </span>
                        </div>

                        {task.description && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">
                            {task.description}
                          </p>
                        )}

                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                          {task.assignee && (
                            <span className="flex items-center gap-1">
                              <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
                                {task.assignee.name.charAt(0)}
                              </span>
                              {task.assignee.name}
                            </span>
                          )}
                          {task._count.subtasks > 0 && (
                            <span className="ml-auto">
                              {task._count.subtasks} {task._count.subtasks === 1 ? 'subtarea' : 'subtareas'}
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// Desktop Column - Traditional
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
        "bg-muted/30 rounded-lg p-4 border-t-4 transition-colors flex-shrink-0",
        "w-80",
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
              useDragHandle={true}
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
