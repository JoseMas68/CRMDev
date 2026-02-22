import { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { KeyRound, CheckCircle } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Restablecer Contraseña",
  description: "Crea una nueva contraseña para tu cuenta de CRMDev",
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const params = await searchParams;
  const token = params.token;

  if (!token) {
    redirect("/login");
  }

  async function handleSubmit(formData: FormData) {
    "use server";

    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (!password || !confirmPassword) {
      return { error: "Todos los campos son requeridos" };
    }

    if (password !== confirmPassword) {
      return { error: "Las contraseñas no coinciden" };
    }

    if (password.length < 8) {
      return { error: "La contraseña debe tener al menos 8 caracteres" };
    }

    try {
      const { error } = await authClient.resetPassword({
        password,
        token,
      });

      if (error) {
        return { error: error.message || "Error al restablecer la contraseña" };
      }

      return { success: true };
    } catch (error: any) {
      return { error: error.message || "Error al restablecer la contraseña" };
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <KeyRound className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Crear Nueva Contraseña</CardTitle>
          <CardDescription>
            Ingresa tu nueva contraseña abajo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nueva Contraseña</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="••••••••"
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>
            <Button type="submit" className="w-full">
              Restablecer Contraseña
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <Link
              href="/login"
              className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors"
            >
              Volver al inicio de sesión
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
