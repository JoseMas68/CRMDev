"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Trophy } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { DealCard } from "./deal-card";

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
}

interface KanbanColumnProps {
  stage: Stage;
  deals: Deal[];
  clients: { id: string; name: string }[];
  columnIndex: number;
  totalColumns: number;
}

export function KanbanColumn({ stage, deals, clients, columnIndex, totalColumns }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.id,
  });

  const totalValue = deals.reduce((sum, deal) => sum + deal.value, 0);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col flex-shrink-0 snap-center",
        "min-w-full md:min-w-0 md:w-80",
        "transition-all duration-200",
        "bg-muted/20 rounded-lg p-4",
        isOver && "bg-primary/5 ring-2 ring-primary/30 shadow-inner"
      )}
    >
      {/* Column header - Improved spacing and hierarchy */}
      <div className="mb-4 pb-3 border-b border-border/50">
        <div className="flex items-center gap-2.5 mb-2">
          <div
            className="w-3 h-3 rounded-full ring-2 ring-background"
            style={{ backgroundColor: stage.color }}
          />
          <h3 className="font-semibold text-sm">{stage.name}</h3>
          <span className="ml-auto text-xs font-medium bg-muted px-2 py-0.5 rounded-full">
            {deals.length}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          {formatCurrency(totalValue)} · {stage.probability}% prob.
        </p>
      </div>

      {/* Deals list - Better spacing */}
      <div className="space-y-3 min-h-[200px] flex-1">
        <SortableContext
          items={deals.map((d) => d.id)}
          strategy={verticalListSortingStrategy}
        >
          {deals.map((deal) => (
            <DealCard key={deal.id} deal={deal} clients={clients} />
          ))}
        </SortableContext>

        {deals.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
              <Trophy className="h-6 w-6 text-muted-foreground/50" />
            </div>
            <p className="text-sm text-muted-foreground">
              Arrastra deals aquí
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
