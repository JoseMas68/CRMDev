/**
 * Support Ticket Form Component
 * Used in the public client support portal
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Bug, Lightbulb, HelpCircle, LifeBuoy, CreditCard, Zap, Shield, FileText, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { createTicket } from "@/actions/tickets";
import { createTicketSchema, type CreateTicketInput } from "@/lib/validations/ticket";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SupportTicketFormProps {
  projectToken: string;
  projectName: string;
  projectId: string;
  organizationId: string;
  orgName: string;
  orgLogo?: string | null;
  clientName?: string;
  clientEmail?: string;
}

export function SupportTicketForm({
  projectToken,
  projectName,
  projectId,
  organizationId,
  orgName,
  orgLogo,
  clientName,
  clientEmail,
}: SupportTicketFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CreateTicketInput>({
    resolver: zodResolver(createTicketSchema),
    defaultValues: {
      category: "SUPPORT",
      priority: "MEDIUM",
      guestName: clientName || "",
      guestEmail: clientEmail || "",
    },
  });

  async function onSubmit(data: CreateTicketInput) {
    setIsSubmitting(true);

    try {
      // Debug: Log values before sending
      console.log('[SupportTicketForm] Sending ticket with:', {
        projectId,
        organizationId,
        projectName,
        orgName,
      });

      // Don't send empty strings for optional fields
      const guestName = data.guestName?.trim() || clientName || undefined;
      const guestEmail = data.guestEmail?.trim() || clientEmail || undefined;

      // Validate required IDs
      if (!projectId || !organizationId) {
        console.error('[SupportTicketForm] Missing IDs:', { projectId, organizationId });
        toast.error("Error: ID de proyecto u organización no válido");
        setIsSubmitting(false);
        return;
      }

      const result = await createTicket({
        ...data,
        guestName,
        guestEmail,
        projectId: projectId,
        organizationId: organizationId,
      });

      if (result.success) {
        setIsSuccess(true);
        toast.success(`Ticket ${result.data.ticketNumber} creado correctamente`);
        // Reset form after 3 seconds
        setTimeout(() => {
          setIsSuccess(false);
          router.refresh();
        }, 3000);
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Error al crear ticket");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isSuccess) {
    return (
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-accent-green/10 rounded-full mb-4">
          <CheckCircle2 className="w-8 h-8 text-accent-green" />
        </div>
        <h3 className="text-xl font-semibold text-accent-green mb-2">
          ¡Ticket Creado!
        </h3>
        <p className="text-muted-foreground mb-6">
          Hemos recibido tu ticket y te hemos enviado un email de confirmación.
          Nuestro equipo revisará tu solicitud a la brevedad.
        </p>
        <p className="text-sm text-muted-foreground">
          Puedes cerrar esta página.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Organization Info */}
      <div className="flex items-center gap-3 pb-4 border-b">
        {orgLogo ? (
          <div className="bg-white dark:bg-slate-800 p-2 rounded-lg shadow-sm">
            <img
              src={orgLogo}
              alt={`${orgName} logo`}
              className="h-10 w-10 object-contain"
            />
          </div>
        ) : (
          <div className="bg-primary/10 p-2 rounded-lg">
            <LifeBuoy className="h-6 w-6 text-primary" />
          </div>
        )}
        <div>
          <p className="text-sm text-muted-foreground">Soporte para</p>
          <p className="font-semibold text-lg">{projectName}</p>
          <p className="text-xs text-muted-foreground">{orgName}</p>
        </div>
      </div>

      {/* Guest Info (only if not pre-filled) */}
      {!clientName && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="guestName">
              Tu Nombre <span className="text-destructive">*</span>
            </Label>
            <Input
              id="guestName"
              placeholder="Juan Pérez"
              disabled={isSubmitting}
              {...register("guestName")}
            />
            {errors.guestName && (
              <p className="text-sm text-destructive">{errors.guestName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="guestEmail">
              Tu Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="guestEmail"
              type="email"
              placeholder="juan@ejemplo.com"
              disabled={isSubmitting}
              {...register("guestEmail")}
            />
            {errors.guestEmail && (
              <p className="text-sm text-destructive">{errors.guestEmail.message}</p>
            )}
          </div>
        </div>
      )}

      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">
          Título <span className="text-destructive">*</span>
        </Label>
        <Input
          id="title"
          placeholder="Breve descripción del problema (ej: Error al iniciar sesión)"
          disabled={isSubmitting}
          {...register("title")}
        />
        {errors.title && (
          <p className="text-sm text-destructive">{errors.title.message}</p>
        )}
      </div>

      {/* Category & Priority */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category">Categoría</Label>
          <Select
            defaultValue="SUPPORT"
            onValueChange={(value) => setValue("category", value as any)}
          >
            <SelectTrigger disabled={isSubmitting}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BUG">
                <div className="flex items-center gap-2">
                  <Bug className="h-4 w-4 text-destructive" />
                  <span>Bug / Error</span>
                </div>
              </SelectItem>
              <SelectItem value="FEATURE_REQUEST">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-amber-500" />
                  <span>Sugerencia</span>
                </div>
              </SelectItem>
              <SelectItem value="QUESTION">
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-accent-blue" />
                  <span>Pregunta</span>
                </div>
              </SelectItem>
              <SelectItem value="SUPPORT">
                <div className="flex items-center gap-2">
                  <LifeBuoy className="h-4 w-4 text-accent-purple" />
                  <span>Soporte Técnico</span>
                </div>
              </SelectItem>
              <SelectItem value="BILLING">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-emerald-500" />
                  <span>Facturación</span>
                </div>
              </SelectItem>
              <SelectItem value="PERFORMANCE">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-accent-orange" />
                  <span>Rendimiento</span>
                </div>
              </SelectItem>
              <SelectItem value="SECURITY">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-red-500" />
                  <span>Seguridad</span>
                </div>
              </SelectItem>
              <SelectItem value="OTHER">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span>Otro</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="priority">Prioridad</Label>
          <Select
            defaultValue="MEDIUM"
            onValueChange={(value) => setValue("priority", value as any)}
          >
            <SelectTrigger disabled={isSubmitting}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="LOW">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-accent-green" />
                  <span>Baja</span>
                </div>
              </SelectItem>
              <SelectItem value="MEDIUM">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-accent-orange" />
                  <span>Media</span>
                </div>
              </SelectItem>
              <SelectItem value="HIGH">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-accent-blue" />
                  <span>Alta</span>
                </div>
              </SelectItem>
              <SelectItem value="URGENT">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <span>Urgente</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">
          Descripción Detallada <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="description"
          placeholder="Describe el problema con el mayor detalle posible..."
          rows={6}
          disabled={isSubmitting}
          {...register("description")}
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        )}
      </div>

      {/* Submit */}
      <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
        {isSubmitting ? "Procesando..." : "Crear Ticket"}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        Al crear este ticket, recibirás un email de confirmación con los detalles.
        Nuestra IA analizará tu solicitud para asignarle la categoría y prioridad adecuadas.
      </p>
    </form>
  );
}
