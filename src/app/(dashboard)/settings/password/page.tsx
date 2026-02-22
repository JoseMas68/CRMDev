import { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { PasswordForm } from "../components/password-form";

export const metadata: Metadata = {
  title: "Contraseña",
  description: "Cambia tu contraseña de CRMDev",
};

export default async function PasswordPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Cambiar Contraseña</h1>
        <p className="text-muted-foreground mt-2">
          Actualiza tu contraseña para mantener tu cuenta segura.
        </p>
      </div>
      <PasswordForm />
    </div>
  );
}
