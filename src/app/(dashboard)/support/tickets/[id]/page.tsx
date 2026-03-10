"use client";

import { useEffect, useState, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Bot,
  Clock,
  Mail,
  MessageSquare,
  Send,
  Tag,
  User,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  getTicket,
  updateTicket,
  createTicketComment,
} from "@/actions/tickets";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

// ─── Status helpers ────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  OPEN: "Abierto",
  IN_PROGRESS: "En Progreso",
  WAITING_CLIENT: "Esperando Cliente",
  RESOLVED: "Resuelto",
  CLOSED: "Cerrado",
};

const STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  IN_PROGRESS: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  WAITING_CLIENT: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  RESOLVED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  CLOSED: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

const PRIORITY_LABELS: Record<string, string> = {
  LOW: "Baja",
  MEDIUM: "Media",
  HIGH: "Alta",
  URGENT: "Urgente",
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  MEDIUM: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  HIGH: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  URGENT: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

const CATEGORY_LABELS: Record<string, string> = {
  TECHNICAL: "Técnico",
  BILLING: "Facturación",
  GENERAL: "General",
  FEATURE_REQUEST: "Solicitud de Función",
  BUG: "Bug",
  OTHER: "Otro",
};

const ALL_STATUSES = ["OPEN", "IN_PROGRESS", "WAITING_CLIENT", "RESOLVED", "CLOSED"] as const;

// ─── Component ─────────────────────────────────────────────────────────────────

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = params.id as string;

  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [isInternal, setIsInternal] = useState(true);
  const [isPending, startTransition] = useTransition();

  const fetchTicket = async () => {
    const result = await getTicket(ticketId);
    if (result.success) {
      setTicket(result.data);
    } else {
      toast.error(result.error);
      router.push("/support");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTicket();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId]);

  const handleStatusChange = (newStatus: string) => {
    startTransition(async () => {
      const result = await updateTicket(ticketId, { status: newStatus as any });
      if (result.success) {
        toast.success(`Estado cambiado a ${STATUS_LABELS[newStatus]}`);
        await fetchTicket();
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleAddComment = () => {
    if (!comment.trim()) return;
    startTransition(async () => {
      const result = await createTicketComment(ticketId, {
        content: comment,
        isInternal,
      });
      if (result.success) {
        toast.success("Comentario añadido");
        setComment("");
        await fetchTicket();
      } else {
        toast.error(result.error);
      }
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!ticket) return null;

  return (
    <div className="space-y-6 p-6 max-w-5xl mx-auto">
      {/* Back + Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/support">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Tag className="h-3.5 w-3.5" />
            <span>{ticket.ticketNumber}</span>
          </div>
          <h1 className="text-2xl font-bold truncate">{ticket.title}</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Descripción</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {ticket.description}
              </p>
            </CardContent>
          </Card>

          {/* AI Analysis */}
          {(ticket.aiSummary || ticket.aiSuggestedFix) && (
            <Card className="border-violet-200 dark:border-violet-800">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2 text-violet-700 dark:text-violet-300">
                  <Bot className="h-4 w-4" />
                  Análisis de IA
                  {ticket.confidence && (
                    <span className="ml-auto text-xs font-normal text-muted-foreground">
                      Confianza: {Math.round(ticket.confidence * 100)}%
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {ticket.aiSummary && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                      Resumen
                    </p>
                    <p className="text-sm">{ticket.aiSummary}</p>
                  </div>
                )}
                {ticket.aiSuggestedFix && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                      Solución sugerida
                    </p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {ticket.aiSuggestedFix}
                    </p>
                  </div>
                )}
                {(ticket.aiCategory || ticket.aiPriority) && (
                  <div className="flex gap-2 pt-1">
                    {ticket.aiCategory && (
                      <Badge variant="outline" className="text-xs">
                        <Zap className="h-3 w-3 mr-1" />
                        {CATEGORY_LABELS[ticket.aiCategory] || ticket.aiCategory}
                      </Badge>
                    )}
                    {ticket.aiPriority && (
                      <Badge variant="outline" className="text-xs">
                        Prioridad IA: {PRIORITY_LABELS[ticket.aiPriority] || ticket.aiPriority}
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Comments */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Comentarios ({ticket.comments?.length ?? 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {ticket.comments?.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Sin comentarios aún.
                </p>
              )}
              {ticket.comments?.map((c: any) => (
                <div key={c.id} className="flex gap-3">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage src={c.author?.image || ""} />
                    <AvatarFallback>
                      {(c.author?.name || c.guestName || "?")[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">
                        {c.author?.name || c.guestName || "Anónimo"}
                      </span>
                      {c.isInternal && (
                        <Badge variant="secondary" className="text-xs">
                          Interno
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground ml-auto">
                        {formatDate(c.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {c.content}
                    </p>
                  </div>
                </div>
              ))}

              <Separator />

              {/* Add comment form */}
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={isInternal ? "default" : "outline"}
                    size="sm"
                    onClick={() => setIsInternal(true)}
                  >
                    Nota interna
                  </Button>
                  <Button
                    type="button"
                    variant={!isInternal ? "default" : "outline"}
                    size="sm"
                    onClick={() => setIsInternal(false)}
                  >
                    Respuesta al cliente
                  </Button>
                </div>
                <Textarea
                  placeholder={
                    isInternal
                      ? "Añade una nota interna..."
                      : "Escribe una respuesta para el cliente..."
                  }
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                />
                <div className="flex justify-end">
                  <Button
                    onClick={handleAddComment}
                    disabled={!comment.trim() || isPending}
                    size="sm"
                  >
                    <Send className="h-3.5 w-3.5 mr-2" />
                    Enviar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Status actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Cambiar estado</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {ALL_STATUSES.map((s) => (
                <Button
                  key={s}
                  variant={ticket.status === s ? "default" : "outline"}
                  size="sm"
                  className="justify-start"
                  disabled={ticket.status === s || isPending}
                  onClick={() => handleStatusChange(s)}
                >
                  {STATUS_LABELS[s]}
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Detalles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Estado</span>
                <Badge className={STATUS_COLORS[ticket.status]}>
                  {STATUS_LABELS[ticket.status] || ticket.status}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Prioridad</span>
                <Badge className={PRIORITY_COLORS[ticket.priority]}>
                  {PRIORITY_LABELS[ticket.priority] || ticket.priority}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Categoría</span>
                <span className="font-medium">
                  {CATEGORY_LABELS[ticket.category] || ticket.category}
                </span>
              </div>
              {ticket.project && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Proyecto</span>
                  <Link
                    href={`/projects/${ticket.project.id}`}
                    className="font-medium hover:underline text-primary"
                  >
                    {ticket.project.name}
                  </Link>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Creado</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDate(ticket.createdAt)}
                </span>
              </div>
              {ticket.resolvedAt && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Resuelto</span>
                  <span>{formatDate(ticket.resolvedAt)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Client info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{ticket.guestName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                <a
                  href={`mailto:${ticket.guestEmail}`}
                  className="text-primary hover:underline truncate"
                >
                  {ticket.guestEmail}
                </a>
              </div>
              {ticket.client && (
                <div className="pt-1">
                  <Link
                    href={`/clients/${ticket.client.id}`}
                    className="text-xs text-muted-foreground hover:underline"
                  >
                    Ver perfil de cliente →
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
