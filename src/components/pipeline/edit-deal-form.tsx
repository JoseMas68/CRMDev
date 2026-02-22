"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { updateDeal } from "@/actions/deals";
import { updateDealSchema, type UpdateDealInput } from "@/lib/validations/deal";
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

interface Stage {
    id: string;
    name: string;
    color: string;
}

interface Deal {
    id: string;
    title: string;
    value: number;
    currency: string;
    status: string;
    stageId: string;
    notes: string | null;
    expectedCloseDate: Date | null;
    client: { id: string; name: string } | null;
}

interface EditDealFormProps {
    deal: Deal;
    stages: Stage[];
    clients: { id: string; name: string }[];
}

export function EditDealForm({ deal, stages, clients }: EditDealFormProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const formatDateForInput = (date: Date | null) => {
        if (!date) return "";
        return new Date(date).toISOString().split("T")[0];
    };

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<UpdateDealInput>({
        resolver: zodResolver(updateDealSchema),
        defaultValues: {
            title: deal.title,
            value: deal.value,
            currency: deal.currency,
            stageId: deal.stageId,
            clientId: deal.client?.id || undefined,
            expectedCloseDate: formatDateForInput(deal.expectedCloseDate) as unknown as Date,
            notes: deal.notes || undefined,
            status: deal.status as UpdateDealInput["status"],
        },
    });

    const selectedStage = watch("stageId");
    const selectedClient = watch("clientId");
    const selectedStatus = watch("status");

    async function onSubmit(data: UpdateDealInput) {
        setIsLoading(true);

        try {
            const cleanData = {
                ...data,
                value: data.value && !isNaN(data.value) ? data.value : 0,
                expectedCloseDate: data.expectedCloseDate && String(data.expectedCloseDate) !== ""
                    ? new Date(data.expectedCloseDate)
                    : undefined,
                notes: data.notes && data.notes !== "" ? data.notes : undefined,
                clientId: data.clientId === "_none" ? null : data.clientId,
            };

            const result = await updateDeal(deal.id, cleanData);

            if (result.success) {
                toast.success("Deal actualizado correctamente");
                router.push(`/pipeline/${deal.id}`);
                router.refresh();
            } else {
                toast.error(result.error);
            }
        } catch (error) {
            toast.error("Error al actualizar deal");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Información General</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
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

                    {/* Client Optional */}
                    <div className="space-y-2">
                        <Label htmlFor="clientId">Cliente (opcional)</Label>
                        <Select
                            value={selectedClient || "_none"}
                            onValueChange={(value) =>
                                setValue("clientId", value === "_none" ? null : value)
                            }
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
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Estado y Seguimiento</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Status */}
                    <div className="space-y-2">
                        <Label htmlFor="status">Estado</Label>
                        <Select
                            value={selectedStatus}
                            onValueChange={(value) =>
                                setValue("status", value as UpdateDealInput["status"])
                            }
                            disabled={isLoading}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="OPEN">Abierto</SelectItem>
                                <SelectItem value="WON">Ganado</SelectItem>
                                <SelectItem value="LOST">Perdido</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.status && (
                            <p className="text-sm text-destructive">{errors.status.message}</p>
                        )}
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
                </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-4">
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
    );
}
