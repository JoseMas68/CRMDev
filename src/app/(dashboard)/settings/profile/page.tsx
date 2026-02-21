import { Separator } from "@/components/ui/separator";
import { ProfileForm } from "../components/profile-form";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function SettingsProfilePage() {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Perfil Público</h3>
                <p className="text-sm text-muted-foreground">
                    Esta información se mostrará públicamente a los miembros del CRM y las organizaciones.
                </p>
            </div>
            <Separator />
            <ProfileForm user={session?.user} />
        </div>
    );
}
