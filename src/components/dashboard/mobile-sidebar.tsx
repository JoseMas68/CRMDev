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
  LogOut,
  Terminal,
  Clock,
  Link2,
  UserPlus,
  Ticket,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { signOut } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { UserBadge } from "@/components/ui/user-badge";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useState } from "react";

interface MobileSidebarProps {
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
    avatarUrl?: string | null;
    isVerifiedDev?: boolean;
    githubUsername?: string | null;
  };
  children?: React.ReactNode;
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

export function MobileSidebar({ user, children }: MobileSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function handleSignOut() {
    try {
      await signOut();
      toast.success("Sesión cerrada correctamente");
      router.push("/login");
    } catch (error) {
      toast.error("Error al cerrar sesión");
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {children || (
          <Button variant="ghost" size="icon" className="lg:hidden">
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
            <span className="sr-only">Abrir menú</span>
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="left" className="w-80 p-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user.avatarUrl || user.image || undefined} />
                <AvatarFallback className="text-sm font-medium bg-primary text-primary-foreground">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="font-medium text-sm">{user.name}</span>
                <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                  {user.email}
                </span>
              </div>
            </div>
            <UserBadge
              user={{
                name: user.name,
                image: user.image,
                avatarUrl: user.avatarUrl,
                isVerifiedDev: user.isVerifiedDev,
                githubUsername: user.githubUsername,
              }}
            />
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto py-4">
            {/* Main Navigation */}
            <div className="px-4 mb-6">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-3">
                Navegación
              </h3>
              <nav className="space-y-1">
                <AnimatePresence>
                  {navigation.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className="relative group"
                      >
                        <motion.div
                          className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                            isActive
                              ? "bg-primary text-primary-foreground"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          )}
                          whileHover={{ x: 2 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          <span>{item.name}</span>
                          {isActive && (
                            <motion.div
                              layoutId="activeMobileNav"
                              className="absolute inset-0 bg-primary rounded-lg"
                              transition={{ type: "spring", stiffness: 300, damping: 30 }}
                              style={{ zIndex: -1 }}
                            />
                          )}
                        </motion.div>
                      </Link>
                    );
                  })}
                </AnimatePresence>
              </nav>
            </div>

            {/* Secondary Navigation */}
            <div className="px-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-3">
                Configuración
              </h3>
              <nav className="space-y-1">
                {secondaryNavigation.map((item) => {
                  const isActive = pathname?.startsWith(item.href);
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="relative group"
                    >
                      <motion.div
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                        whileHover={{ x: 2 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span>{item.name}</span>
                        {isActive && (
                          <motion.div
                            layoutId="activeMobileNavSecondary"
                            className="absolute inset-0 bg-primary rounded-lg"
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            style={{ zIndex: -1 }}
                          />
                        )}
                      </motion.div>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t">
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:text-destructive"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4 mr-3" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
