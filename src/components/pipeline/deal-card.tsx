"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  MoreHorizontal,
  Trophy,
  X,
  Calendar,
  User,
  Trash2,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { markDealAsWon, markDealAsLost, deleteDeal } from "@/actions/deals";
import { Button } from "@/components/ui/button";
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

interface Deal {
  id: string;
  title: string;
  value: number;
  status: string;
  order: number;
  client: { id: string; name: string } | null;
  expectedCloseDate: Date | null;
}

interface DealCardProps {
  deal: Deal;
  isDragging?: boolean;
  clients: { id: string; name: string }[];
}

export function DealCard({ deal, isDragging, clients }: DealCardProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showLostDialog, setShowLostDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: deal.id });

  const handleCardClick = () => {
    // Solo navegar si no estamos arrastrando
    if (!isDragging && !isSortableDragging) {
      router.push(`/pipeline/${deal.id}`);
    }
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  async function handleMarkAsWon() {
    setIsLoading(true);
    try {
      const result = await markDealAsWon(deal.id);
      if (result.success) {
        toast.success("Deal marcado como ganado");
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Error al marcar deal");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleMarkAsLost() {
    setIsLoading(true);
    try {
      const result = await markDealAsLost(deal.id);
      if (result.success) {
        toast.success("Deal marcado como perdido");
        setShowLostDialog(false);
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Error al marcar deal");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete() {
    setIsLoading(true);
    try {
      const result = await deleteDeal(deal.id);
      if (result.success) {
        toast.success("Deal eliminado");
        setShowDeleteDialog(false);
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Error al eliminar deal");
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
        onClick={handleCardClick}
        className={cn(
          "kanban-card group p-0 overflow-hidden cursor-pointer",
          "hover:shadow-lg transition-all duration-200 hover:-translate-y-1",
          (isDragging || isSortableDragging) && "kanban-card-dragging scale-105"
        )}
      >
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="p-4 h-full flex flex-col gap-3"
        >
          {/* Header with title and menu - Improved layout */}
          <div className="flex items-start gap-3 pr-10">
            <Link
              href={`/pipeline/${deal.id}`}
              className="font-semibold text-sm line-clamp-2 flex-1 hover:text-primary hover:underline leading-snug"
              onClick={(e: React.MouseEvent) => {
                if (isDragging || isSortableDragging) {
                  e.preventDefault();
                }
              }}
            >
              {deal.title}
            </Link>

            {/* Action menu - Better positioned */}
            <div className="absolute top-3 right-3 flex items-center gap-1">
              {/* Botón de ver detalle - visible en móvil */}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 sm:hidden opacity-100 hover:bg-muted"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/pipeline/${deal.id}`);
                }}
                aria-label="Ver detalles"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>

              {/* Menú dropdown - visible en desktop con hover */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hidden sm:flex opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted"
                    onClick={(e) => e.stopPropagation()}
                    aria-label="Más opciones"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/pipeline/${deal.id}`);
                    }}
                  >
                    <ChevronRight className="mr-2 h-4 w-4" />
                    Ver Detalles
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkAsWon();
                    }}
                    disabled={isLoading}
                  >
                    <Trophy className="mr-2 h-4 w-4 text-green-500" />
                    Marcar como Ganado
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowLostDialog(true);
                    }}
                    disabled={isLoading}
                  >
                    <X className="mr-2 h-4 w-4 text-red-500" />
                    Marcar como Perdido
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
          </div>

          {/* Value - Better emphasized */}
          <div className="text-lg font-bold text-primary">
            {formatCurrency(deal.value)}
          </div>

          {/* Client - Improved spacing */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{deal.client?.name || "Sin cliente"}</span>
          </div>

          {/* Expected close date - Better spacing */}
          {deal.expectedCloseDate && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4 flex-shrink-0" />
              <span>{formatDate(deal.expectedCloseDate)}</span>
            </div>
          )}
        </motion.div>
      </div>

      {/* Lost confirmation dialog */}
      <AlertDialog open={showLostDialog} onOpenChange={setShowLostDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Marcar como perdido</AlertDialogTitle>
            <AlertDialogDescription>
              Estas seguro de que quieres marcar &quot;{deal.title}&quot; como
              perdido? Esta accion movera el deal fuera del pipeline activo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleMarkAsLost}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? "Marcando..." : "Marcar como Perdido"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar deal</AlertDialogTitle>
            <AlertDialogDescription>
              Estas seguro de que quieres eliminar &quot;{deal.title}&quot;?
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
