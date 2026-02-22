"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { createDeal } from "@/actions/deals";
import { createDealSchema, type CreateDealInput } from "@/lib/validations/deal";
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

interface Stage {
  id: string;
  name: string;
  color: string;
}

interface CreateDealDialogProps {
  children: ReactNode;
  stages: Stage[];
  clients: { id: string; name: string }[];
}

export function CreateDealDialog({
  children,
  stages,
  clients,
}: CreateDealDialogProps) {
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
  } = useForm<CreateDealInput>({
    resolver: zodResolver(createDealSchema),
    defaultValues: {
      value: 0,
      currency: "USD",
    },
  });

  const selectedStage = watch("stageId");
  const selectedClient = watch("clientId");

  async function onSubmit(data: CreateDealInput) {
    setIsLoading(true);

    try {
      // Clean up data to handle empty/NaN values
      const cleanData = {
        ...data,
        value: data.value && !isNaN(data.value) ? data.value : 0,
        expectedCloseDate: data.expectedCloseDate && String(data.expectedCloseDate) !== ""
          ? data.expectedCloseDate
          : undefined,
        notes: data.notes && data.notes !== "" ? data.notes : undefined,
      };

      const result = await createDeal(cleanData);

      if (result.success) {
        toast.success("Deal creado correctamente");
        reset();
        setOpen(false);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Error al crear deal");
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nuevo Deal</DialogTitle>
          <DialogDescription>
            Crea una nueva oportunidad de venta en tu pipeline.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Titulo <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              placeholder="Nombre del deal"
              disabled={isLoading}
              {...register("title")}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* Client - Optional */}
          <div className="space-y-2">
            <Label htmlFor="clientId">Cliente (opcional)</Label>
            <Select
              value={selectedClient || ""}
              onValueChange={(value) => setValue("clientId", value === "_none" ? null : value)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sin cliente asignado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">Sin cliente</SelectItem>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.clientId && (
              <p className="text-sm text-destructive">
                {errors.clientId.message}
              </p>
            )}
          </div>

          {/* Value and Currency */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-2">
              <Label htmlFor="value">Valor</Label>
              <Input
                id="value"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                disabled={isLoading}
                {...register("value", { valueAsNumber: true })}
              />
              {errors.value && (
                <p className="text-sm text-destructive">
                  {errors.value.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Moneda</Label>
              <Select
                value={watch("currency")}
                onValueChange={(value) => setValue("currency", value)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="MXN">MXN</SelectItem>
                  <SelectItem value="ARS">ARS</SelectItem>
                  <SelectItem value="COP">COP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Stage */}
          <div className="space-y-2">
            <Label htmlFor="stageId">
              Etapa <span className="text-destructive">*</span>
            </Label>
            <Select
              value={selectedStage}
              onValueChange={(value) => setValue("stageId", value)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una etapa" />
              </SelectTrigger>
              <SelectContent>
                {stages.map((stage) => (
                  <SelectItem key={stage.id} value={stage.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: stage.color }}
                      />
                      {stage.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.stageId && (
              <p className="text-sm text-destructive">
                {errors.stageId.message}
              </p>
            )}
          </div>

          {/* Expected Close Date */}
          <div className="space-y-2">
            <Label htmlFor="expectedCloseDate">Fecha esperada de cierre</Label>
            <Input
              id="expectedCloseDate"
              type="date"
              disabled={isLoading}
              {...register("expectedCloseDate")}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              placeholder="Notas adicionales..."
              rows={3}
              disabled={isLoading}
              {...register("notes")}
            />
          </div>

          <DialogFooter>
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
              Crear Deal
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
