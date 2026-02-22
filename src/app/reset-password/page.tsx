import { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { KeyRound } from "lucide-react";

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
          <form action="/api/auth/reset-password" method="POST" className="space-y-4">
            <input type="hidden" name="token" value={token} />
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nueva Contraseña</Label>
              <Input
                id="newPassword"
                name="newPassword"
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
