"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { cn, formatCurrency } from "@/lib/utils";
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
}

interface KanbanColumnProps {
  stage: Stage;
  deals: Deal[];
  clients: { id: string; name: string }[];
}

export function KanbanColumn({ stage, deals, clients }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.id,
  });

  const totalValue = deals.reduce((sum, deal) => sum + deal.value, 0);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "kanban-column flex-shrink-0 w-80 transition-colors",
        isOver && "bg-muted/50 ring-2 ring-primary/20"
      )}
    >
      {/* Column header */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: stage.color }}
          />
          <h3 className="font-semibold text-sm">{stage.name}</h3>
          <span className="text-xs text-muted-foreground ml-auto">
            {deals.length}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          {formatCurrency(totalValue)} ({stage.probability}% prob.)
        </p>
      </div>

      {/* Deals list */}
      <div className="space-y-3 min-h-[200px]">
        <SortableContext
          items={deals.map((d) => d.id)}
          strategy={verticalListSortingStrategy}
        >
          {deals.map((deal) => (
            <DealCard key={deal.id} deal={deal} clients={clients} />
          ))}
        </SortableContext>

        {deals.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Arrastra deals aqui
          </div>
        )}
      </div>
    </div>
  );
}
