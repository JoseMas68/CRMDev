import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/header";
import { BottomNav } from "@/components/mobile/bottom-nav";

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
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <DashboardSidebar
        user={{
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
          image: session.user.image ?? null,
        }}
        activeOrgId={session.session.activeOrganizationId!}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:pl-72">
        <DashboardHeader
          user={{
            id: session.user.id,
            name: session.user.name,
            email: session.user.email,
            image: session.user.image ?? null,
          }}
        />

        <main className="flex-1 p-4 lg:p-6 pb-20 lg:pb-6">{children}</main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
