import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Verificar superadmin en server component
  const session = await auth();

  if (!session?.user?.isSuperAdmin) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar del admin */}
      <AdminSidebar />

      {/* Contenido principal */}
      <div className="flex-1">
        <main className="min-h-screen bg-muted/20 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
