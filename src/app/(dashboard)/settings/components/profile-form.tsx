"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { authClient } from "@/lib/auth-client";
import { Loader2, Github } from "lucide-react";

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
import { toast } from "sonner";
import { signIn } from "@/lib/auth-client";

const profileFormSchema = z.object({
    name: z
        .string()
        .min(2, {
            message: "El nombre debe tener al menos 2 caracteres.",
        })
        .max(50, {
            message: "El nombre no debe tener más de 50 caracteres.",
        }),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export function ProfileForm({ user }: { user?: any }) {
    const [isLoading, setIsLoading] = useState(false);
    const [isGitHubLinking, setIsGitHubLinking] = useState(false);
    const [sessionUser, setSessionUser] = useState<any>(user);

    // Intentamos obtener la última sesión si no llegó por props puros
    useEffect(() => {
        if (!user) {
            authClient.getSession().then(({ data }) => setSessionUser(data?.user));
        }
    }, [user]);

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileFormSchema),
        defaultValues: {
            name: sessionUser?.name || "",
        },
        mode: "onChange",
    });

    async function onSubmit(data: ProfileFormValues) {
        if (!sessionUser) return;
        setIsLoading(true);

        try {
            const { error } = await authClient.updateUser({
                name: data.name,
            });

            if (error) {
                toast.error("Ocurrió un error al actualizar los datos.");
            } else {
                toast.success("Perfil actualizado correctamente.");
            }
        } catch (e) {
            toast.error("Error al servidor.");
        } finally {
            setIsLoading(false);
        }
    }

    async function linkGitHub() {
        setIsGitHubLinking(true);
        try {
            const { error } = await signIn.social({
                provider: "github",
                callbackURL: "/settings/profile",
            });
            if (error) {
                toast.error(error.message || "Error al vincular tu cuenta con GitHub");
            }
        } catch (error) {
            toast.error("Hubo un error contactando el servicio.");
        } finally {
            setIsGitHubLinking(false);
        }
    }

    return (
        <div className="space-y-8 max-w-xl">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nombre</FormLabel>
                                <FormControl>
                                    <Input placeholder="Tu nombre" {...field} />
                                </FormControl>
                                <FormDescription>
                                    Este es tu nombre público visible.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="space-y-2">
                        <FormLabel>Correo Electrónico</FormLabel>
                        <Input
                            disabled
                            value={sessionUser?.email || "Cargando..."}
                            title="Tu correo no puede modificarse todavía"
                        />
                        <p className="text-[0.8rem] text-muted-foreground">Tu correo principal que usaste para registrarte.</p>
                    </div>

                    <Button type="submit" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Guardar cambios
                    </Button>
                </form>
            </Form>

            <div className="pt-6 border-t space-y-4">
                <div>
                    <h4 className="text-sm font-medium">Asociación de cuenta Github</h4>
                    <p className="text-sm text-muted-foreground">
                        Conecta tu perfil de GitHub para automatizar el alta de proyectos e importar información de forma fluida.
                    </p>
                </div>

                {!sessionUser?.githubId || !sessionUser?.isVerifiedDev ? (
                    <Button variant="outline" type="button" onClick={linkGitHub} disabled={isGitHubLinking}>
                        {isGitHubLinking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Github className="mr-2 h-4 w-4" />}
                        Vincular cuenta GitHub
                    </Button>
                ) : (
                    <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                        <Github className="h-4 w-4" />
                        Tu cuenta está vinculada a GitHub.
                    </div>
                )}
            </div>
        </div>
    );
}
