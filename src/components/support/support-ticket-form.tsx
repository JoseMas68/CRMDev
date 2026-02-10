/**
 * Support Ticket Form Component
 * Used in the public client support portal
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
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
  orgSlug: string;
  projects: Array<{ id: string; name: string }>;
}

export function SupportTicketForm({ orgSlug, projects }: SupportTicketFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateTicketInput>({
    resolver: zodResolver(createTicketSchema),
    defaultValues: {
      category: "SUPPORT",
      priority: "MEDIUM",
    },
  });

  async function onSubmit(data: CreateTicketInput) {
    setIsSubmitting(true);

    try {
      const result = await createTicket(orgSlug, data);

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
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full mb-4">
          <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-green-900 dark:text-green-100 mb-2">
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
      {/* Guest Info */}
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
            onValueChange={(value) =>
              register("category").onChange({ target: { value } })
            }
          >
            <SelectTrigger disabled={isSubmitting}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BUG">🐛 Bug / Error</SelectItem>
              <SelectItem value="FEATURE_REQUEST">💡 Sugerencia</SelectItem>
              <SelectItem value="QUESTION">❓ Pregunta</SelectItem>
              <SelectItem value="SUPPORT">🛠️ Soporte Técnico</SelectItem>
              <SelectItem value="BILLING">💳 Facturación</SelectItem>
              <SelectItem value="PERFORMANCE">⚡ Rendimiento</SelectItem>
              <SelectItem value="SECURITY">🔒 Seguridad</SelectItem>
              <SelectItem value="OTHER">📋 Otro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="priority">Prioridad</Label>
          <Select
            defaultValue="MEDIUM"
            onValueChange={(value) =>
              register("priority").onChange({ target: { value } })
            }
          >
            <SelectTrigger disabled={isSubmitting}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="LOW">🟢 Baja</SelectItem>
              <SelectItem value="MEDIUM">🟡 Media</SelectItem>
              <SelectItem value="HIGH">🟠 Alta</SelectItem>
              <SelectItem value="URGENT">🔴 Urgente</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Project (optional) */}
      {projects.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="projectId">Proyecto (opcional)</Label>
          <Select
            onValueChange={(value) =>
              register("projectId").onChange({ target: { value } })
            }
          >
            <SelectTrigger disabled={isSubmitting}>
              <SelectValue placeholder="Selecciona un proyecto si aplica" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Sin proyecto</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

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
