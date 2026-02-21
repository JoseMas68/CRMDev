"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Loader2, Github, Trash2, User } from "lucide-react";
import { toast } from "sonner";
import { signIn } from "@/lib/auth-client";

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
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isGitHubLinking, setIsGitHubLinking] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
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

    async function handleDeleteAccount() {
        setIsDeleting(true);
        try {
            const response = await fetch("/api/user/delete", {
                method: "DELETE",
            });

            const result = await response.json();

            if (!result.success) {
                toast.error(result.error || "Error al eliminar cuenta");
                return;
            }

            toast.success("Cuenta eliminada correctamente");

            // Sign out and redirect to home
            await authClient.signOut();
            router.push("/");
        } catch (error) {
            toast.error("Error al eliminar cuenta");
        } finally {
            setIsDeleting(false);
            setShowDeleteDialog(false);
        }
    }

    return (
        <div className="space-y-6">
            {/* Profile Information */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Información del Perfil
                    </CardTitle>
                </CardHeader>
                <CardContent>
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
                                <p className="text-[0.8rem] text-muted-foreground">
                                    Tu correo principal que usaste para registrarte.
                                </p>
                            </div>

                            <Button type="submit" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Guardar cambios
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>

            {/* GitHub Association */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Github className="h-5 w-5" />
                        Asociación de cuenta GitHub
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                        Conecta tu perfil de GitHub para automatizar el alta de proyectos
                        e importar información de forma fluida.
                    </p>

                    {!sessionUser?.githubId || !sessionUser?.isVerifiedDev ? (
                        <Button variant="outline" type="button" onClick={linkGitHub} disabled={isGitHubLinking}>
                            {isGitHubLinking ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Github className="mr-2 h-4 w-4" />
                            )}
                            Vincular cuenta GitHub
                        </Button>
                    ) : (
                        <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                            <Github className="h-4 w-4" />
                            Tu cuenta está vinculada a GitHub.
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-destructive/50">
                <CardHeader>
                    <CardTitle className="text-destructive flex items-center gap-2">
                        <Trash2 className="h-5 w-5" />
                        Zona de Peligro
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                        Una vez que elimines tu cuenta, no hay forma de recuperarla.
                        Todos tus datos serán eliminados permanentemente.
                    </p>
                    <Button
                        variant="destructive"
                        onClick={() => setShowDeleteDialog(true)}
                    >
                        Eliminar mi cuenta
                    </Button>
                </CardContent>
            </Card>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción <strong>no se puede deshacer</strong>. Esto eliminará
                            permanentemente tu cuenta y todos los datos asociados:
                            <ul className="list-disc list-inside mt-2 text-sm">
                                <li>Tu perfil y configuración</li>
                                <li>Tus organizaciones (si eres el único miembro)</li>
                                <li>Todos tus proyectos y tareas</li>
                                <li>Todos tus clientes y datos de CRM</li>
                            </ul>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteAccount}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting ? "Eliminando..." : "Sí, eliminar mi cuenta"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
