"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  Search,
  Bell,
  Settings,
  LogOut,
  User,
  Building2,
  LayoutDashboard,
  Users,
  Kanban,
  FolderKanban,
  CheckSquare,
  Github,
  RefreshCw,
  Clock,
  Link2,
  UserPlus,
} from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import { signOut, useActiveOrganization } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { toast } from "sonner";

interface HeaderProps {
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
}

const navigation = [
  { name: "Panel", href: "/dashboard", icon: LayoutDashboard },
  { name: "Clientes", href: "/clients", icon: Users },
  { name: "Pipeline", href: "/pipeline", icon: Kanban },
  { name: "Proyectos", href: "/projects", icon: FolderKanban },
  { name: "Tareas", href: "/tasks", icon: CheckSquare },
  { name: "Control de Tiempo", href: "/time", icon: Clock },
  { name: "Equipo", href: "/members", icon: UserPlus },
  { name: "Integraciones", href: "/integrations", icon: Link2 },
  { name: "Configuración", href: "/settings", icon: Settings },
];

export function DashboardHeader({ user }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { data: activeOrg } = useActiveOrganization();

  // Get page title from pathname
  const pageTitle = navigation.find(
    (item) => pathname === item.href || pathname.startsWith(item.href + "/")
  )?.name || "Panel";

  async function handleSignOut() {
    try {
      await signOut();
      router.push("/login");
      router.refresh();
    } catch (error) {
      toast.error("Error al cerrar sesión");
    }
  }

  function handleGitHubSync() {
    toast.info("Sincronización con GitHub próximamente!");
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center gap-4 px-6">
        {/* Mobile menu button */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Abrir menú</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <SheetHeader className="p-6 border-b">
              <SheetTitle className="flex items-center gap-2">
                <span className="font-mono text-xl font-semibold text-neon-violet tech-glow-text tracking-tight">
                  {"{ √ }"}
                </span>
                <span className="font-mono text-xl font-semibold text-gradient tech-glow-text">
                  CRMDev
                </span>
                <span className="font-mono text-xl font-semibold text-neon-violet terminal-cursor">|</span>
              </SheetTitle>
            </SheetHeader>

            {/* Organization info */}
            <div className="p-4 border-b">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  {activeOrg?.logo ? (
                    <img
                      src={activeOrg.logo}
                      alt={activeOrg.name}
                      className="h-10 w-10 rounded-lg object-cover"
                    />
                  ) : (
                    <Building2 className="h-5 w-5 text-primary" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-medium truncate">
                    {activeOrg?.name || "Cargando..."}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    {activeOrg?.slug}
                  </p>
                </div>
              </div>
            </div>

            {/* Mobile navigation */}
            <nav className="p-4">
              <ul className="space-y-1">
                {navigation.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:text-primary",
                          isActive && "bg-primary/10 text-primary"
                        )}
                      >
                        <item.icon className="h-5 w-5" />
                        {item.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* Mobile user section */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.image || undefined} alt={user.name} />
                  <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{user.name}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {user.email}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={handleSignOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar Sesión
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        {/* Page title */}
        <h1 className="text-xl font-semibold hidden sm:block">{pageTitle}</h1>

        {/* Search (desktop) */}
        <div className="hidden md:flex flex-1 max-w-md mx-auto">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar tareas, PRs o devs..."
              className="pl-9"
            />
          </div>
        </div>

        {/* GitHub Sync Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleGitHubSync}
          className="hidden md:flex items-center gap-2 border-accent-green/30 bg-accent-green/10 text-accent-green hover:bg-accent-green/20 sync-pulse"
        >
          <Github className="h-4 w-4" />
          Sincronizar
          <RefreshCw className="h-3 w-3" />
        </Button>

        {/* Right side actions */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Search (mobile) */}
          <Button variant="ghost" size="icon" className="md:hidden">
            <Search className="h-5 w-5" />
            <span className="sr-only">Buscar</span>
          </Button>

          {/* Notifications */}
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
            <span className="sr-only">Notificaciones</span>
          </Button>

          {/* User menu (desktop) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="hidden lg:flex items-center gap-2 h-auto py-1.5"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.image || undefined} alt={user.name} />
                  <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings">
                  <User className="mr-2 h-4 w-4" />
                  Mi Perfil
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings">
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
    </header>
  );
}
