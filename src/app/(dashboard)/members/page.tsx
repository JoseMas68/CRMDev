import { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { MembersPage } from "@/components/members/members-page";

export const metadata: Metadata = {
  title: "Equipo",
  description: "Gestiona los miembros de tu organización",
};

export default async function MembersRoute() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.session.activeOrganizationId) {
    redirect("/select-org");
  }

  return <MembersPage />;
}
