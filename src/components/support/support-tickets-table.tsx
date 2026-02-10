/**
 * Support Tickets Table Component
 * Displays tickets with filtering and actions
 */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Eye,
  AlertCircle,
  CheckCircle2,
  Clock,
  Bug,
  Lightbulb,
  HelpCircle,
  Wrench,
  CreditCard,
  Zap,
  Shield,
} from "lucide-react";
import { getTickets } from "@/actions/tickets";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const categoryIcons: Record<string, React.ReactNode> = {
  BUG: <Bug className="h-4 w-4" />,
  FEATURE_REQUEST: <Lightbulb className="h-4 w-4" />,
  QUESTION: <HelpCircle className="h-4 w-4" />,
  SUPPORT: <Wrench className="h-4 w-4" />,
  BILLING: <CreditCard className="h-4 w-4" />,
  PERFORMANCE: <Zap className="h-4 w-4" />,
  SECURITY: <Shield className="h-4 w-4" />,
  OTHER: <AlertCircle className="h-4 w-4" />,
};

const statusConfig: Record<string, { label: string; className: string }> = {
  OPEN: { label: "Abierto", className: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200" },
  IN_PROGRESS: { label: "En Progreso", className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  WAITING_CLIENT: { label: "Esperando Cliente", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
  RESOLVED: { label: "Resuelto", className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  CLOSED: { label: "Cerrado", className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200" },
};

const priorityConfig: Record<string, { label: string; className: string }> = {
  LOW: { label: "Baja", className: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200" },
  MEDIUM: { label: "Media", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
  HIGH: { label: "Alta", className: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200" },
  URGENT: { label: "Urgente", className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
};

export function SupportTicketsTable() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    status: undefined as string | undefined,
    priority: undefined as string | undefined,
    search: "",
  });

  useEffect(() => {
    loadTickets();
  }, [filter]);

  async function loadTickets() {
    try {
      setLoading(true);
      // Build filter object, only including defined values
      const filterParams: any = {};
      if (filter.status) filterParams.status = filter.status;
      if (filter.priority) filterParams.priority = filter.priority;
      if (filter.search) filterParams.search = filter.search;

      const result = await getTickets(filterParams);
      if (result.success) {
        setTickets(result.data.tickets);
      }
    } catch (error) {
      console.error("[SUPPORT] Error loading tickets:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 border-b">
        <Input
          placeholder="Buscar tickets..."
          value={filter.search}
          onChange={(e) => setFilter({ ...filter, search: e.target.value })}
          className="max-w-xs"
        />

        <Select
          value={filter.status || ""}
          onValueChange={(value) => setFilter({ ...filter, status: value || undefined })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos los estados</SelectItem>
            <SelectItem value="OPEN">Abierto</SelectItem>
            <SelectItem value="IN_PROGRESS">En Progreso</SelectItem>
            <SelectItem value="WAITING_CLIENT">Esperando Cliente</SelectItem>
            <SelectItem value="RESOLVED">Resuelto</SelectItem>
            <SelectItem value="CLOSED">Cerrado</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filter.priority || ""}
          onValueChange={(value) => setFilter({ ...filter, priority: value || undefined })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Prioridad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todas las prioridades</SelectItem>
            <SelectItem value="LOW">Baja</SelectItem>
            <SelectItem value="MEDIUM">Media</SelectItem>
            <SelectItem value="HIGH">Alta</SelectItem>
            <SelectItem value="URGENT">Urgente</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="relative">
        {loading ? (
          <div className="text-center py-12">
            <Clock className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Cargando tickets...</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-12">
            <Ticket className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">No hay tickets aún</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="text-left p-4 font-medium text-sm">Ticket</th>
                  <th className="text-left p-4 font-medium text-sm">Cliente</th>
                  <th className="text-left p-4 font-medium text-sm">Categoría</th>
                  <th className="text-left p-4 font-medium text-sm">Prioridad</th>
                  <th className="text-left p-4 font-medium text-sm">Estado</th>
                  <th className="text-left p-4 font-medium text-sm">Creado</th>
                  <th className="text-right p-4 font-medium text-sm">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr key={ticket.id} className="border-b hover:bg-muted/50">
                    <td className="p-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{ticket.ticketNumber}</span>
                          {categoryIcons[ticket.category] && (
                            <span className="text-muted-foreground">
                              {categoryIcons[ticket.category]}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {ticket.title}
                        </p>
                      </div>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="text-sm font-medium">{ticket.guestName}</p>
                        <p className="text-xs text-muted-foreground">{ticket.guestEmail}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge variant="outline" className="text-xs">
                        {ticket.category}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <Badge
                        variant="outline"
                        className={cn("text-xs", priorityConfig[ticket.priority]?.className)}
                      >
                        {priorityConfig[ticket.priority]?.label}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <Badge
                        variant="outline"
                        className={cn("text-xs", statusConfig[ticket.status]?.className)}
                      >
                        {statusConfig[ticket.status]?.label}
                      </Badge>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right">
                      <Link href={`/support/tickets/${ticket.id}`}>
                        <Button size="sm" variant="ghost">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Ticket(_props: any) {
  return <div />;
}
