import { Metadata } from "next";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { WidgetGrid } from "@/components/dashboard/widgets/widget-grid";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Panel de control de CRMDev",
};

/**
 * Dashboard Page
 *
 * Security Notes:
 * - Session validated server-side
 * - All data filtered by activeOrganizationId via Prisma middleware
 * - No cross-tenant data leakage possible
 */
export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.session.activeOrganizationId) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Welcome section */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          Hola, {session.user.name?.split(" ")[0] ?? "Developer"}
        </h2>
        <p className="text-muted-foreground">
          Este es el resumen de tu CRM para hoy
        </p>
      </div>

      {/* Widget Grid */}
      <WidgetGrid />
    </div>
  );
}
