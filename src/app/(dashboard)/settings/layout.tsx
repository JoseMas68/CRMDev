import { Separator } from "@/components/ui/separator";
import { SidebarNav } from "./components/sidebar-nav";
import { KeyRound } from "lucide-react";

const sidebarNavItems = [
    {
        title: "Perfil",
        href: "/settings/profile",
    },
    {
        title: "Contraseña",
        href: "/settings/password",
    },
    {
        title: "Cuenta",
        href: "/settings/account",
    },
    {
        title: "Organizaciones",
        href: "/settings/organizations",
    },
    {
        title: "Notificaciones",
        href: "/settings/notifications",
    },
    {
        title: "API Keys",
        href: "/settings/api-keys",
        icon: KeyRound,
    }
];

interface SettingsLayoutProps {
    children: React.ReactNode;
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
    return (
        <div className="flex min-h-screen flex-col p-4 sm:p-6 md:p-8">
            <div className="flex-1 space-y-4 md:space-y-6">
                <div className="space-y-0.5">
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Configuración</h2>
                    <p className="text-sm sm:text-base text-muted-foreground">
                        Administra los ajustes de tu cuenta
                    </p>
                </div>
                <Separator className="my-4 md:my-6" />
                <div className="flex flex-col space-y-6 lg:flex-row lg:space-x-12 lg:space-y-0">
                    <aside className="lg:w-1/5">
                        <SidebarNav items={sidebarNavItems} />
                    </aside>
                    <div className="flex-1 lg:max-w-2xl">{children}</div>
                </div>
            </div>
        </div>
    );
}
