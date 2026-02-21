import { Separator } from "@/components/ui/separator";
import { SidebarNav } from "./components/sidebar-nav";

const sidebarNavItems = [
    {
        title: "Perfil",
        href: "/settings/profile",
    },
    {
        title: "Cuenta",
        href: "/settings/account",
    },
    {
        title: "Notificaciones",
        href: "/settings/notifications",
    }
];

interface SettingsLayoutProps {
    children: React.ReactNode;
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
    return (
        <div className="flex min-h-screen flex-col">
            {/* Opcional si el dashboard layout actual ya muestra un header */}
            <div className="flex-1 space-y-4 p-8 pt-6">
                <div className="space-y-0.5">
                    <h2 className="text-2xl font-bold tracking-tight">Configuración</h2>
                    <p className="text-muted-foreground">
                        Administra los ajustes de tu cuenta y establece tus preferencias para el CRM.
                    </p>
                </div>
                <Separator className="my-6" />
                <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
                    <aside className="-mx-4 lg:w-1/5">
                        <SidebarNav items={sidebarNavItems} />
                    </aside>
                    <div className="flex-1 lg:max-w-2xl">{children}</div>
                </div>
            </div>
        </div>
    );
}
