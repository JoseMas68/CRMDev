"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
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
import { ChevronRight, DollarSign } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { moveDeal } from "@/actions/deals";
import { KanbanColumn } from "./kanban-column";
import { DealCard } from "./deal-card";
import { cn } from "@/lib/utils";

interface Deal {
  id: string;
  title: string;
  value: number;
  status: string;
  order: number;
  client: { id: string; name: string } | null;
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
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);

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

  // Calcular valor total por stage
  const getStageValue = (deals: Deal[]) => {
    return deals.reduce((total, deal) => total + deal.value, 0);
  };

  return (
    <>
      {/* MOBILE VIEW - List style with accordion */}
      <div className="lg:hidden">
        <AnimatePresence mode="popLayout">
          {stages.map((stage) => (
            <MobileStageColumn
              key={stage.id}
              stage={stage}
              clients={clients}
              isExpanded={selectedStageId === stage.id}
              onToggle={() => setSelectedStageId(selectedStageId === stage.id ? null : stage.id)}
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
          <div className="flex overflow-x-auto gap-6 min-h-[600px]">
            <SortableContext
              items={stages.map((s) => s.id)}
              strategy={horizontalListSortingStrategy}
            >
              {stages.map((stage, index) => (
                <KanbanColumn
                  key={stage.id}
                  stage={stage}
                  deals={stage.deals}
                  clients={clients}
                  columnIndex={index}
                  totalColumns={stages.length}
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
      </div>
    </>
  );
}

// Mobile Stage Column - Accordion style
function MobileStageColumn({
  stage,
  clients,
  isExpanded,
  onToggle,
}: {
  stage: Stage;
  clients: { id: string; name: string }[];
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const stageValue = getStageValue(stage.deals);
  const stageColors: Record<string, string> = {
    LEAD: "from-purple-500 to-purple-600",
    QUALIFIED: "from-blue-500 to-blue-600",
    PROPOSAL: "from-yellow-500 to-yellow-600",
    NEGOTIATION: "from-orange-500 to-orange-600",
    WON: "from-green-500 to-green-600",
    LOST: "from-red-500 to-red-600",
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
        className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-lg overflow-hidden cursor-pointer active:scale-[0.99] transition-transform border border-gray-200 dark:border-gray-700"
      >
        {/* Header siempre visible */}
        <div className="bg-gradient-to-r p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("w-14 h-14 rounded-xl flex flex-col items-center justify-center text-white shadow-lg", stageColors[stage.id]?.split(" ")[0].replace("from-", "bg-") || "bg-gray-500")}>
              <span className="text-xl font-bold">{stage.deals.length}</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">{stage.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-white/80 text-sm">{stage.probability}% prob.</span>
                {stageValue > 0 && (
                  <span className="flex items-center gap-1 text-white/90 text-sm font-semibold">
                    <DollarSign className="h-3 w-3" />
                    {stageValue.toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          </div>
          <motion.div
            animate={{ rotate: isExpanded ? 90 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronRight className="h-8 w-8 text-gray-500 dark:text-gray-400" />
          </motion.div>
        </div>

        {/* Deals - expandible */}
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
                {stage.deals.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <p className="text-base">Sin deals</p>
                  </div>
                ) : (
                  stage.deals.map((deal, index) => (
                    <motion.div
                      key={deal.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Link href={`/pipeline/${deal.id}`} className="block">
                        <div className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow active:scale-[0.98]">
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex-1">
                              <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-1">
                                {deal.title}
                              </h4>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {deal.client?.name || "Sin cliente"}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center justify-end gap-1 text-green-600 dark:text-green-400 font-bold">
                                <DollarSign className="h-4 w-4" />
                                <span className="text-lg">{deal.value.toLocaleString()}</span>
                              </div>
                            </div>
                          </div>

                          {deal.expectedCloseDate && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Cierre: {new Date(deal.expectedCloseDate).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </Link>
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

function getStageValue(deals: Deal[]) {
  return deals.reduce((total, deal) => total + deal.value, 0);
}
