"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/actions/clients";
import { createClientSchema, type CreateClientInput } from "@/lib/validations/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CreateClientDialogProps {
  children: ReactNode;
}

export function CreateClientDialog({ children }: CreateClientDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateClientInput>({
    resolver: zodResolver(createClientSchema),
    defaultValues: {
      status: "LEAD",
      tags: [],
    },
  });

  const status = watch("status");

  async function onSubmit(data: CreateClientInput) {
    setIsLoading(true);

    try {
      const result = await createClient(data);

      if (result.success) {
        toast.success("Cliente creado correctamente");
        reset();
        setOpen(false);
        router.push(`/clients/${result.data.id}`);
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Error al crear cliente");
    } finally {
      setIsLoading(false);
    }
  }

  function handleOpenChange(newOpen: boolean) {
    if (!newOpen) {
      reset();
    }
    setOpen(newOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuevo Cliente</DialogTitle>
          <DialogDescription>
            Agrega un nuevo cliente a tu CRM. Completa la informacion basica y
            opcional.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basico</TabsTrigger>
              <TabsTrigger value="contact">Contacto</TabsTrigger>
              <TabsTrigger value="details">Detalles</TabsTrigger>
            </TabsList>

            {/* Basic Info */}
            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
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
                  {errors.phone && (
                    <p className="text-sm text-destructive">
                      {errors.phone.message}
                    </p>
                  )}
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

                <div className="col-span-2 space-y-2">
                  <Label htmlFor="status">Estado</Label>
                  <Select
                    value={status}
                    onValueChange={(value) =>
                      setValue("status", value as CreateClientInput["status"])
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
              </div>
            </TabsContent>

            {/* Contact Info */}
            <TabsContent value="contact" className="space-y-4 mt-4">
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

              <div className="grid grid-cols-2 gap-4">
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
            </TabsContent>

            {/* Details */}
            <TabsContent value="details" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="source">Origen</Label>
                <Select
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
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear Cliente
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
