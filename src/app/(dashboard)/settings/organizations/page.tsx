import { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { Separator } from "@/components/ui/separator";
import { OrganizationsClient } from "./client-page";

export const metadata: Metadata = {
    title: "Organizaciones",
    description: "Gestiona tus organizaciones y espacios de trabajo",
};

export default async function OrganizationsPage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        redirect("/login");
    }

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Tus Organizaciones</h3>
                <p className="text-sm text-muted-foreground">
                    Administra los espacios de trabajo a los que perteneces o crea uno nuevo.
                </p>
            </div>
            <Separator />

            {/* Client Component for interactive Better-Auth list */}
            <OrganizationsClient />
        </div>
    );
}
