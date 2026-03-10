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
  SidebarOpen,
  SidebarClose,
  Bot,
  Sparkles,
  Shield,
} from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import { useSidebarStore } from "@/store/sidebar-store";
import {
  useActiveOrganization,
  useListOrganizations,
  organization,
  signOut,
  useSession,
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
  {
    name: "AI Chat",
    href: "/chat",
    icon: Bot,
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

// Admin navigation (only for superadmins)
const adminNavigation = [
  {
    name: "Admin Panel",
    href: "/admin",
    icon: Shield,
  },
];

export function DashboardSidebar({ user, activeOrgId }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isCollapsed, toggleCollapse } = useSidebarStore();
  const { data: session } = useSession();

  // Fetch organizations
  const { data: activeOrg } = useActiveOrganization();
  const { data: organizations } = useListOrganizations();

  // Check if user is superadmin
  const isSuperAdmin = (session?.user as any)?.isSuperAdmin || false;

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
      <div
        className={cn(
          "hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:flex-col transition-all duration-300 ease-in-out border-r bg-card",
          isCollapsed ? "lg:w-20" : "lg:w-72"
        )}
      >
        <div className="flex grow flex-col gap-y-5 overflow-y-auto px-4 pb-4 overflow-x-hidden">
          {/* Header area with Logo and Toggle */}
          <div className="flex items-center justify-between h-16 shrink-0 mt-2">
            {!isCollapsed && (
              <Link href="/dashboard" className="flex items-center gap-2 group overflow-hidden pl-2">
                <span className="font-mono text-xl font-semibold text-neon-violet tech-glow-text tracking-tight shrink-0">
                  {"{ √ }"}
                </span>
                <span className="font-mono text-xl font-semibold text-gradient tech-glow-text whitespace-nowrap">
                  CRMDev
                </span>
              </Link>
            )}
            {isCollapsed && (
              <Link href="/dashboard" className="flex items-center justify-center w-full group overflow-hidden">
                <span className="font-mono text-xl font-semibold text-neon-violet tech-glow-text tracking-tight shrink-0">
                  {"{ √ }"}
                </span>
              </Link>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleCollapse}
              className={cn("shrink-0", isCollapsed && "mx-auto mt-4")}
              title={isCollapsed ? "Expandir" : "Contraer"}
            >
              {isCollapsed ? <SidebarOpen className="h-5 w-5" /> : <SidebarClose className="h-5 w-5" />}
            </Button>
          </div>

          {/* Organization Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className={cn("w-full justify-between h-auto py-3", isCollapsed && "px-0 justify-center border-none shadow-none")}
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
                  {!isCollapsed && (
                    <div className="text-left min-w-0">
                      <p className="text-sm font-medium truncate">
                        {activeOrg?.name || "Cargando..."}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {activeOrg?.slug}
                      </p>
                    </div>
                  )}
                </div>
                {!isCollapsed && <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64" align={isCollapsed ? "start" : "end"} side={isCollapsed ? "right" : "bottom"}>
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
                <Link href="/select-org" className="cursor-pointer flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  <span>Nueva organización</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Navigation */}
          <nav className="flex flex-1 flex-col mt-2">
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
                            isActive && "sidebar-link-active",
                            isCollapsed && "justify-center px-0"
                          )}
                          title={isCollapsed ? item.name : undefined}
                        >
                          <item.icon className={cn("h-5 w-5 shrink-0", isCollapsed ? "mx-auto" : "")} />
                          {!isCollapsed && <span>{item.name}</span>}
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
                            isActive && "sidebar-link-active",
                            isCollapsed && "justify-center px-0"
                          )}
                          title={isCollapsed ? item.name : undefined}
                        >
                          <item.icon className={cn("h-5 w-5 shrink-0", isCollapsed ? "mx-auto" : "")} />
                          {!isCollapsed && <span>{item.name}</span>}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </li>

              {/* Admin Navigation - Solo para superadmins */}
              {isSuperAdmin && (
                <li className="mt-2">
                  <ul role="list" className="-mx-2 space-y-1">
                    {adminNavigation.map((item) => {
                      const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                      return (
                        <li key={item.name}>
                          <Link
                            href={item.href}
                            className={cn(
                              "sidebar-link bg-red-500/10 text-red-500 hover:bg-red-500/20",
                              isActive && "sidebar-link-active bg-red-500/20",
                              isCollapsed && "justify-center px-0"
                            )}
                            title={isCollapsed ? item.name : undefined}
                          >
                            <item.icon className={cn("h-5 w-5 shrink-0", isCollapsed ? "mx-auto" : "")} />
                            {!isCollapsed && <span>{item.name}</span>}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              )}
            </ul>
          </nav>

          {/* User section - Oculto en desktop (ya está en el header) */}
          <div className="lg:hidden -mx-2 mt-auto border-t border-border pt-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start h-auto py-2 hover:bg-muted/50"
                >
                  <UserBadge user={user} size="md" className="mr-3" showName />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" side="bottom">
                <DropdownMenuLabel>
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings/profile" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    <span>Configuración</span>
                  </Link>
                </DropdownMenuItem>
                {isSuperAdmin && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="flex items-center gap-2 text-red-500">
                        <Shield className="h-4 w-4" />
                        <span>Admin Panel</span>
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
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

          {/* Desktop only - Cerrar sesión simple */}
          {isCollapsed && (
            <div className="hidden lg:flex -mx-2 mt-auto border-t border-border pt-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSignOut}
                className="w-full"
                title="Cerrar Sesión"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
