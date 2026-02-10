"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

import { updateClient } from "@/actions/clients";
import { updateClientSchema, type UpdateClientInput } from "@/lib/validations/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  position: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postalCode: string | null;
  status: string;
  source: string | null;
  tags: string[];
  notes: string | null;
}

interface EditClientFormProps {
  client: Client;
}

export function EditClientForm({ client }: EditClientFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UpdateClientInput>({
    resolver: zodResolver(updateClientSchema),
    defaultValues: {
      name: client.name,
      email: client.email || "",
      phone: client.phone || "",
      company: client.company || "",
      position: client.position || "",
      website: client.website || "",
      address: client.address || "",
      city: client.city || "",
      state: client.state || "",
      country: client.country || "",
      postalCode: client.postalCode || "",
      status: client.status as UpdateClientInput["status"],
      source: client.source || "",
      tags: client.tags || [],
      notes: client.notes || "",
    },
  });

  const status = watch("status");
  const source = watch("source");

  async function onSubmit(data: UpdateClientInput) {
    setIsLoading(true);

    try {
      const result = await updateClient(client.id, data);

      if (result.success) {
        toast.success("Cliente actualizado correctamente");
        router.push(`/clients/${client.id}`);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Error al actualizar cliente");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Link
          href={`/clients/${client.id}`}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a detalles
        </Link>

        <div>
          <h1 className="text-2xl font-bold tracking-tight">Editar Cliente</h1>
          <p className="text-muted-foreground">
            Actualiza la informacion de {client.name}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Informacion Basica</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Nombre <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="Nombre completo"
                  disabled={isLoading}
                  {...register("name")}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Estado</Label>
                <Select
                  value={status}
                  onValueChange={(value) =>
                    setValue("status", value as UpdateClientInput["status"])
                  }
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LEAD">Lead</SelectItem>
                    <SelectItem value="PROSPECT">Prospecto</SelectItem>
                    <SelectItem value="CUSTOMER">Cliente</SelectItem>
                    <SelectItem value="INACTIVE">Inactivo</SelectItem>
                    <SelectItem value="CHURNED">Perdido</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@ejemplo.com"
                  disabled={isLoading}
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefono</Label>
                <Input
                  id="phone"
                  placeholder="+1 234 567 8900"
                  disabled={isLoading}
                  {...register("phone")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">Empresa</Label>
                <Input
                  id="company"
                  placeholder="Nombre de la empresa"
                  disabled={isLoading}
                  {...register("company")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="position">Cargo</Label>
                <Input
                  id="position"
                  placeholder="CEO, Gerente, etc."
                  disabled={isLoading}
                  {...register("position")}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Info */}
        <Card>
          <CardHeader>
            <CardTitle>Informacion de Contacto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="website">Sitio web</Label>
              <Input
                id="website"
                type="url"
                placeholder="https://ejemplo.com"
                disabled={isLoading}
                {...register("website")}
              />
              {errors.website && (
                <p className="text-sm text-destructive">
                  {errors.website.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Direccion</Label>
              <Input
                id="address"
                placeholder="Calle, numero"
                disabled={isLoading}
                {...register("address")}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">Ciudad</Label>
                <Input
                  id="city"
                  placeholder="Ciudad"
                  disabled={isLoading}
                  {...register("city")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">Estado/Provincia</Label>
                <Input
                  id="state"
                  placeholder="Estado"
                  disabled={isLoading}
                  {...register("state")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Pais</Label>
                <Input
                  id="country"
                  placeholder="Pais"
                  disabled={isLoading}
                  {...register("country")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="postalCode">Codigo postal</Label>
                <Input
                  id="postalCode"
                  placeholder="12345"
                  disabled={isLoading}
                  {...register("postalCode")}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Details */}
        <Card>
          <CardHeader>
            <CardTitle>Detalles Adicionales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="source">Origen</Label>
              <Select
                value={source || ""}
                onValueChange={(value) => setValue("source", value)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Como llego este cliente?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="website">Sitio web</SelectItem>
                  <SelectItem value="referral">Referido</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                  <SelectItem value="cold_call">Llamada fria</SelectItem>
                  <SelectItem value="event">Evento</SelectItem>
                  <SelectItem value="advertising">Publicidad</SelectItem>
                  <SelectItem value="other">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                placeholder="Notas adicionales sobre el cliente..."
                rows={4}
                disabled={isLoading}
                {...register("notes")}
              />
              {errors.notes && (
                <p className="text-sm text-destructive">
                  {errors.notes.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar Cambios
          </Button>
        </div>
      </form>
    </div>
  );
}
