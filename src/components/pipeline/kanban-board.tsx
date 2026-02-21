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
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { toast } from "sonner";

import { moveDeal } from "@/actions/deals";
import { KanbanColumn } from "./kanban-column";
import { DealCard } from "./deal-card";

interface Deal {
  id: string;
  title: string;
  value: number;
  status: string;
  order: number;
  client: { id: string; name: string };
  expectedCloseDate: Date | null;
}

interface Stage {
  id: string;
  name: string;
  color: string;
  order: number;
  probability: number;
  deals: Deal[];
}

interface KanbanBoardProps {
  initialStages: Stage[];
  clients: { id: string; name: string }[];
}

export function KanbanBoard({ initialStages, clients }: KanbanBoardProps) {
  const [stages, setStages] = useState<Stage[]>(initialStages);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null);

  // Sync stages when initialStages change (e.g., after creating a new deal)
  useEffect(() => {
    setStages(initialStages);
  }, [initialStages]);

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

  const findDealById = useCallback(
    (id: string): { deal: Deal; stageId: string } | null => {
      for (const stage of stages) {
        const deal = stage.deals.find((d) => d.id === id);
        if (deal) {
          return { deal, stageId: stage.id };
        }
      }
      return null;
    },
    [stages]
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { active } = event;
      const id = active.id as string;

      setActiveId(id);
      const found = findDealById(id);
      if (found) {
        setActiveDeal(found.deal);
      }
    },
    [findDealById]
  );

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;

      if (!over) return;

      const activeId = active.id as string;
      const overId = over.id as string;

      // Find the active deal's current stage
      const activeResult = findDealById(activeId);
      if (!activeResult) return;

      const { stageId: activeStageId } = activeResult;

      // Determine target stage
      let overStageId: string;

      // Check if over is a stage or a deal
      const overStage = stages.find((s) => s.id === overId);
      if (overStage) {
        overStageId = overId;
      } else {
        const overResult = findDealById(overId);
        if (overResult) {
          overStageId = overResult.stageId;
        } else {
          return;
        }
      }

      // If same stage, no need to update
      if (activeStageId === overStageId) return;

      // Move deal to new stage (optimistic update)
      setStages((prev) => {
        const newStages = prev.map((stage) => ({
          ...stage,
          deals: [...stage.deals],
        }));

        const sourceStage = newStages.find((s) => s.id === activeStageId);
        const destStage = newStages.find((s) => s.id === overStageId);

        if (!sourceStage || !destStage) return prev;

        const dealIndex = sourceStage.deals.findIndex((d) => d.id === activeId);
        if (dealIndex === -1) return prev;

        const [deal] = sourceStage.deals.splice(dealIndex, 1);
        destStage.deals.push(deal);

        return newStages;
      });
    },
    [findDealById, stages]
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;

      setActiveId(null);
      setActiveDeal(null);

      if (!over) return;

      const activeId = active.id as string;
      const overId = over.id as string;

      // Find where the deal ended up
      const finalResult = findDealById(activeId);
      if (!finalResult) return;

      const { stageId, deal } = finalResult;

      // Calculate new order
      const stage = stages.find((s) => s.id === stageId);
      if (!stage) return;

      const dealIndex = stage.deals.findIndex((d) => d.id === activeId);
      const newOrder = dealIndex;

      // Call server action
      try {
        const result = await moveDeal({
          id: activeId,
          stageId,
          order: newOrder,
        });

        if (!result.success) {
          toast.error(result.error);
          // Revert on error - refetch would be better
          setStages(initialStages);
        }
      } catch (error) {
        toast.error("Error al mover deal");
        setStages(initialStages);
      }
    },
    [findDealById, stages, initialStages]
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex overflow-x-auto gap-4 pb-4 min-h-[600px] snap-x">
        <SortableContext
          items={stages.map((s) => s.id)}
          strategy={horizontalListSortingStrategy}
        >
          {stages.map((stage) => (
            <KanbanColumn
              key={stage.id}
              stage={stage}
              deals={stage.deals}
              clients={clients}
            />
          ))}
        </SortableContext>
      </div>

      <DragOverlay>
        {activeDeal ? (
          <DealCard deal={activeDeal} isDragging clients={clients} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
