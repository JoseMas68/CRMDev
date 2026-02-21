"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Kanban,
  FolderKanban,
  CheckSquare,
  Settings,
  ChevronsUpDown,
  LogOut,
  Plus,
  Building2,
  Terminal,
  Clock,
  Link2,
  UserPlus,
  Ticket,
} from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import {
  useActiveOrganization,
  useListOrganizations,
  organization,
  signOut,
} from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserBadge } from "@/components/ui/user-badge";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface SidebarProps {
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
    avatarUrl?: string | null;
    isVerifiedDev?: boolean;
    githubUsername?: string | null;
  };
  activeOrgId: string;
}

const navigation = [
  {
    name: "Panel",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Clientes",
    href: "/clients",
    icon: Users,
  },
  {
    name: "Pipeline",
    href: "/pipeline",
    icon: Kanban,
  },
  {
    name: "Proyectos",
    href: "/projects",
    icon: FolderKanban,
  },
  {
    name: "Tareas",
    href: "/tasks",
    icon: CheckSquare,
  },
  {
    name: "Control de Tiempo",
    href: "/time",
    icon: Clock,
  },
  {
    name: "Equipo",
    href: "/members",
    icon: UserPlus,
  },
  {
    name: "Soporte",
    href: "/support",
    icon: Ticket,
  },
];

const secondaryNavigation = [
  {
    name: "Integraciones",
    href: "/integrations",
    icon: Link2,
  },
  {
    name: "Configuración",
    href: "/settings/profile",
    icon: Settings,
  },
];

export function DashboardSidebar({ user, activeOrgId }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Fetch organizations
  const { data: activeOrg } = useActiveOrganization();
  const { data: organizations } = useListOrganizations();

  async function handleSwitchOrg(orgId: string) {
    try {
      await organization.setActive({ organizationId: orgId });
      toast.success("Organización cambiada");
      router.refresh();
    } catch (error) {
      toast.error("Error al cambiar de organización");
    }
  }

  async function handleSignOut() {
    try {
      await signOut();
      router.push("/login");
      router.refresh();
    } catch (error) {
      toast.error("Error al cerrar sesión");
    }
  }

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r bg-card px-6 pb-4">
          {/* Logo - CRMDev */}
          <div className="flex h-16 shrink-0 items-center">
            <Link href="/dashboard" className="flex items-center gap-2 group">
              <span className="font-mono text-xl font-semibold text-neon-violet tech-glow-text tracking-tight">
                {"{ √ }"}
              </span>
              <span className="font-mono text-xl font-semibold text-gradient tech-glow-text">
                CRMDev
              </span>
              <span className="font-mono text-xl font-semibold text-neon-violet terminal-cursor">|</span>
            </Link>
          </div>

          {/* Organization Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-between h-auto py-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    {activeOrg?.logo ? (
                      <img
                        src={activeOrg.logo}
                        alt={activeOrg.name}
                        className="h-8 w-8 rounded-lg object-cover"
                      />
                    ) : (
                      <Building2 className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <div className="text-left min-w-0">
                    <p className="text-sm font-medium truncate">
                      {activeOrg?.name || "Cargando..."}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {activeOrg?.slug}
                    </p>
                  </div>
                </div>
                <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64" align="start">
              <DropdownMenuLabel>Organizaciones</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {organizations?.map((org) => (
                <DropdownMenuItem
                  key={org.id}
                  onClick={() => handleSwitchOrg(org.id)}
                  className={cn(
                    "cursor-pointer",
                    org.id === activeOrgId && "bg-accent"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-6 w-6 rounded bg-primary/10 flex items-center justify-center">
                      {org.logo ? (
                        <img
                          src={org.logo}
                          alt={org.name}
                          className="h-6 w-6 rounded object-cover"
                        />
                      ) : (
                        <Building2 className="h-3 w-3 text-primary" />
                      )}
                    </div>
                    <span className="truncate">{org.name}</span>
                  </div>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/select-org" className="cursor-pointer">
                  <Plus className="mr-2 h-4 w-4" />
                  Nueva organización
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Navigation */}
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                    return (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          className={cn(
                            "sidebar-link",
                            isActive && "sidebar-link-active"
                          )}
                        >
                          <item.icon className="h-5 w-5 shrink-0" />
                          {item.name}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </li>

              <li className="mt-auto">
                <ul role="list" className="-mx-2 space-y-1">
                  {secondaryNavigation.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          className={cn(
                            "sidebar-link",
                            isActive && "sidebar-link-active"
                          )}
                        >
                          <item.icon className="h-5 w-5 shrink-0" />
                          {item.name}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </li>
            </ul>
          </nav>

          {/* User section */}
          <div className="-mx-2 mt-auto border-t border-border pt-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start h-auto py-2 hover:bg-muted/50"
                >
                  <UserBadge user={user} size="md" className="mr-3" />
                  <div className="text-left min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user.isVerifiedDev ? "Dev Profesional" : user.email}
                    </p>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings/profile">
                    <Settings className="mr-2 h-4 w-4" />
                    Configuración
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="text-destructive focus:text-destructive cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Cerrar Sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </>
  );
}
