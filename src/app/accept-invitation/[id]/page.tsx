"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { organization, useSession } from "@/lib/auth-client";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Link from "next/link";

export default function AcceptInvitationPage() {
    const params = useParams();
    const router = useRouter();
    const { data: session, isPending } = useSession();
    const [status, setStatus] = useState<"loading" | "success" | "error" | "unauthorized">("loading");
    const invitationId = params.id as string;

    useEffect(() => {
        if (!invitationId || isPending) return;

        if (!session) {
            setStatus("unauthorized");
            // Optionally redirect to login with callback URL
            return;
        }

        async function accept() {
            try {
                const result = await organization.acceptInvitation({
                    invitationId,
                });

                if (result.error) {
                    setStatus("error");
                    toast.error(result.error.message || "Error al aceptar la invitación");
                } else {
                    setStatus("success");
                    toast.success("Invitación aceptada con éxito");
                    setTimeout(() => {
                        router.push("/dashboard");
                    }, 2000);
                }
            } catch (err) {
                setStatus("error");
                toast.error("Ocurrió un error inesperado al aceptar la invitación");
            }
        }

        accept();
    }, [invitationId, session, isPending, router]);

    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-background p-4">
            <div className="w-full max-w-md p-8 bg-card border rounded-lg shadow-sm text-center space-y-4">
                <h1 className="text-2xl font-bold tracking-tight">Procesando Invitación</h1>

                {status === "loading" && (
                    <div className="flex flex-col items-center justify-center space-y-4 py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-muted-foreground">Uniendo a la organización...</p>
                    </div>
                )}

                {status === "success" && (
                    <div className="flex flex-col items-center justify-center space-y-4 py-8">
                        <CheckCircle2 className="h-12 w-12 text-green-500" />
                        <p className="text-muted-foreground">¡Te has unido correctamente! Redirigiendo al dashboard...</p>
                    </div>
                )}

                {status === "unauthorized" && (
                    <div className="flex flex-col items-center justify-center space-y-4 py-8">
                        <XCircle className="h-12 w-12 text-orange-500" />
                        <p className="text-muted-foreground">Necesitas iniciar sesión para aceptar esta invitación.</p>
                        <div className="mt-4 flex gap-4 w-full">
                            <Link href={`/login?callbackUrl=/accept-invitation/${invitationId}`} className="flex-1">
                                <Button className="w-full">Iniciar Sesión</Button>
                            </Link>
                            <Link href={`/signup?callbackUrl=/accept-invitation/${invitationId}`} className="flex-1">
                                <Button variant="outline" className="w-full">Registrarse</Button>
                            </Link>
                        </div>
                    </div>
                )}

                {status === "error" && (
                    <div className="flex flex-col items-center justify-center space-y-4 py-8">
                        <XCircle className="h-12 w-12 text-destructive" />
                        <p className="text-muted-foreground">El enlace de invitación es inválido o ha expirado.</p>
                        <Link href="/dashboard" className="w-full mt-4 block">
                            <Button variant="outline" className="w-full">
                                Volver al inicio
                            </Button>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
