"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Search,
  Bell,
  Settings,
  LogOut,
  User,
  Github,
  RefreshCw,
} from "lucide-react";
import { getInitials } from "@/lib/utils";
import { signOut } from "@/lib/auth-client";
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
import { MobileSidebar } from "@/components/dashboard/mobile-sidebar";
import { toast } from "sonner";

interface HeaderProps {
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
}

export function DashboardHeader({ user }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Get page title from pathname
  const getPageTitle = () => {
    const pathMap: Record<string, string> = {
      "/dashboard": "Panel",
      "/clients": "Clientes",
      "/pipeline": "Pipeline",
      "/projects": "Proyectos",
      "/tasks": "Tareas",
      "/time": "Control de Tiempo",
      "/members": "Equipo",
      "/integrations": "Integraciones",
      "/settings": "Configuración",
      "/support": "Soporte",
    };

    // Try exact match first
    if (pathMap[pathname]) {
      return pathMap[pathname];
    }

    // Try prefix match
    for (const [path, title] of Object.entries(pathMap)) {
      if (pathname.startsWith(path + "/")) {
        return title;
      }
    }

    return "Panel";
  };

  const pageTitle = getPageTitle();

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
      <div className="flex h-16 items-center gap-2 md:gap-4 px-4 md:px-6">
        {/* Mobile menu button */}
        <MobileSidebar
          user={{
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
          }}
        />

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
