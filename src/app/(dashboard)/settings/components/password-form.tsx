"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { authClient } from "@/lib/auth-client";
import { Loader2, KeyRound } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const passwordFormSchema = z
    .object({
        currentPassword: z
            .string()
            .min(1, "La contraseña actual es requerida"),
        newPassword: z
            .string()
            .min(8, "La nueva contraseña debe tener al menos 8 caracteres")
            .max(128, "La contraseña no debe tener más de 128 caracteres"),
        confirmPassword: z
            .string()
            .min(1, "Confirma tu nueva contraseña"),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
        message: "Las contraseñas no coinciden",
        path: ["confirmPassword"],
    });

type PasswordFormValues = z.infer<typeof passwordFormSchema>;

export function PasswordForm() {
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<PasswordFormValues>({
        resolver: zodResolver(passwordFormSchema),
        defaultValues: {
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
        },
        mode: "onChange",
    });

    async function onSubmit(data: PasswordFormValues) {
        setIsLoading(true);

        try {
            // First sign in with current password to verify it's correct
            const { data: sessionData } = await authClient.getSession();

            if (!sessionData?.user?.email) {
                toast.error("No se pudo obtener tu sesión");
                return;
            }

            // Use better-auth's changePassword method
            const { error } = await authClient.changePassword({
                currentPassword: data.currentPassword,
                newPassword: data.newPassword,
                revokeOtherSessions: true, // Sign out from all other devices
            });

            if (error) {
                if (error.message?.includes("incorrect")) {
                    toast.error("La contraseña actual es incorrecta");
                } else {
                    toast.error(error.message || "Error al cambiar la contraseña");
                }
            } else {
                toast.success("Contraseña cambiada correctamente. Por favor inicia sesión de nuevo.");
                form.reset();
                // Sign out and redirect to login
                setTimeout(async () => {
                    await authClient.signOut();
                    window.location.href = "/login";
                }, 1500);
            }
        } catch (e: any) {
            console.error("Password change error:", e);
            toast.error(e.message || "Error al cambiar la contraseña");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <KeyRound className="h-5 w-5" />
                    Cambiar Contraseña
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="currentPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Contraseña Actual</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="password"
                                            placeholder="Tu contraseña actual"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Ingresa tu contraseña actual para verificar tu identidad.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="newPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nueva Contraseña</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="password"
                                            placeholder="Nueva contraseña"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        La contraseña debe tener al menos 8 caracteres.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="confirmPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Confirmar Nueva Contraseña</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="password"
                                            placeholder="Confirma tu nueva contraseña"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Cambiar Contraseña
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
