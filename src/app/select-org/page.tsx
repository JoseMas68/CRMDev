import { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { OrgSelector } from "@/components/auth/org-selector";

export const metadata: Metadata = {
  title: "Seleccionar organizacion",
  description: "Selecciona o crea una organizacion para continuar",
};

export default async function SelectOrgPage() {
  // Get session
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // If not authenticated, redirect to login
  if (!session) {
    redirect("/login");
  }

  // If already has active organization, redirect to dashboard
  if (session.session.activeOrganizationId) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 rounded-lg bg-primary items-center justify-center mb-4">
            <span className="text-primary-foreground font-bold text-xl">C</span>
          </div>
          <h1 className="text-2xl font-bold">Bienvenido a CRMDev</h1>
          <p className="text-muted-foreground mt-2">
            Selecciona una organizacion existente o crea una nueva para comenzar
          </p>
        </div>

        <OrgSelector userId={session.user.id} userName={session.user.name} />
      </div>
    </div>
  );
}
