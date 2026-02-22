import { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Shield, CreditCard, Globe } from "lucide-react";

import { auth } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Cuenta",
  description: "Configuración de cuenta de CRMDev",
};

export default async function AccountPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Cuenta</h1>
        <p className="text-muted-foreground mt-2">
          Gestiona la configuración de tu cuenta y preferencias.
        </p>
      </div>

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Información de Cuenta
          </CardTitle>
          <CardDescription>
            Detalles de tu cuenta y estado de verificación
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2 border-b">
            <div>
              <p className="font-medium">Email</p>
              <p className="text-sm text-muted-foreground">{session.user.email}</p>
            </div>
            {session.user.emailVerified && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Verificado
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <p className="font-medium">ID de Usuario</p>
              <p className="text-sm text-muted-foreground font-mono">{session.user.id}</p>
            </div>
          </div>

          {session.user.isVerifiedDev && (
            <div className="flex items-center justify-between py-2 border-t">
              <div>
                <p className="font-medium">Desarrollador Verificado</p>
                <p className="text-sm text-muted-foreground">Tu cuenta de GitHub está vinculada</p>
              </div>
              <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                ✓ Verificado
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Subscription */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Suscripción
          </CardTitle>
          <CardDescription>
            Plan actual y opciones de facturación
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="font-medium">Plan Actual</p>
              <p className="text-sm text-muted-foreground">Plan Gratuito</p>
            </div>
            <Badge variant="outline">Gratis</Badge>
          </div>

          <div className="flex items-center justify-between py-2 border-t">
            <div>
              <p className="font-medium">Organizaciones</p>
              <p className="text-sm text-muted-foreground">Puedes crear hasta 5 organizaciones</p>
            </div>
          </div>

          <div className="flex items-center justify-between py-2 border-t">
            <div>
              <p className="font-medium">Miembros por organización</p>
              <p className="text-sm text-muted-foreground">Hasta 10 miembros</p>
            </div>
          </div>

          <Button className="mt-4">
            Ver Planes de Pago
          </Button>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Preferencias
          </CardTitle>
          <CardDescription>
            Configura tus preferencias de idioma y región
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="font-medium">Idioma</p>
              <p className="text-sm text-muted-foreground">Español (España)</p>
            </div>
            <Button variant="outline" size="sm">
              Cambiar
            </Button>
          </div>

          <div className="flex items-center justify-between py-2 border-t">
            <div>
              <p className="font-medium">Zona Horaria</p>
              <p className="text-sm text-muted-foreground">Europe/Madrid</p>
            </div>
            <Button variant="outline" size="sm">
              Cambiar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
