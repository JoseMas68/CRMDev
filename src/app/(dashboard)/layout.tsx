import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/header";
import { BottomNav } from "@/components/mobile/bottom-nav";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

/**
 * Dashboard Layout
 *
 * Security Notes:
 * - Validates session server-side before rendering
 * - Requires active organization to access dashboard
 * - Redirects to login if no session
 * - Redirects to org selection if no active org
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Validate session server-side
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // No session - redirect to login
  if (!session) {
    redirect("/login");
  }

  // No active organization - redirect to org selection
  if (!session.session.activeOrganizationId) {
    redirect("/select-org");
  }

  return (
    <DashboardShell
      sidebar={
        <DashboardSidebar
          user={{
            id: session.user.id,
            name: session.user.name,
            email: session.user.email,
            image: session.user.image ?? null,
          }}
          activeOrgId={session.session.activeOrganizationId!}
        />
      }
      header={
        <DashboardHeader
          user={{
            id: session.user.id,
            name: session.user.name,
            email: session.user.email,
            image: session.user.image ?? null,
          }}
        />
      }
      bottomNav={<BottomNav />}
    >
      {children}
    </DashboardShell>
  );
}
