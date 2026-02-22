"use client";

import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import {
  LayoutDashboard,
  CheckSquare,
  FolderKanban,
  Users,
  Kanban,
  Clock,
  UserPlus,
  Ticket,
  Link2,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// TODAS las páginas del sidebar desktop
const navItems = [
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
    name: "Tiempo",
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

export function BottomNav() {
  const pathname = usePathname();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Don't show on auth pages
  if (pathname?.startsWith("/login") || pathname?.startsWith("/signup")) {
    return null;
  }

  // Update active index and scroll into view
  useEffect(() => {
    const index = navItems.findIndex((item) => pathname === item.href || pathname?.startsWith(item.href + "/"));

    // Scroll active item into view
    if (index >= 0 && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const activeElement = container.children[index + 1] as HTMLElement; // +1 for left button
      if (activeElement) {
        const scrollPosition = activeElement.offsetLeft - container.offsetWidth / 2 + activeElement.offsetWidth / 2;
        container.scrollTo({ left: scrollPosition, behavior: "smooth" });
      }
    }
  }, [pathname]);

  // Check scroll position
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setCanScrollLeft(container.scrollLeft > 0);
      setCanScrollRight(container.scrollLeft < container.scrollWidth - container.offsetWidth);
    };

    container.addEventListener("scroll", handleScroll);
    handleScroll(); // Initial check

    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  const scroll = (direction: "left" | "right") => {
    if (!scrollContainerRef.current) return;

    const scrollAmount = 250;
    const newScrollLeft =
      direction === "left"
        ? scrollContainerRef.current.scrollLeft - scrollAmount
        : scrollContainerRef.current.scrollLeft + scrollAmount;

    scrollContainerRef.current.scrollTo({
      left: newScrollLeft,
      behavior: "smooth",
    });
  };

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 400 }}
      className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-background border-t-4 border-primary shadow-lg"
    >
      {/* Scroll buttons */}
      <div className="flex items-center h-16">
        {/* Left scroll button */}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "flex-shrink-0 h-full w-12 rounded-none border-r border-border/50",
            !canScrollLeft && "opacity-30 cursor-not-allowed"
          )}
          onClick={() => scroll("left")}
          disabled={!canScrollLeft}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>

        {/* Scrollable container */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-x-auto overflow-y-hidden scrollbar-hide"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          <div className="flex items-center h-full" style={{ minWidth: "max-content" }}>
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex flex-col items-center justify-center px-5 h-full relative group flex-shrink-0 min-w-[80px]"
                >
                  <motion.div
                    className="flex flex-col items-center justify-center"
                    whileTap={{ scale: 0.9 }}
                  >
                    <div className="relative">
                      <Icon
                        className={cn(
                          "h-6 w-6 transition-colors",
                          isActive
                            ? "text-primary"
                            : "text-muted-foreground group-hover:text-foreground"
                        )}
                      />
                      {isActive && (
                        <motion.div
                          layoutId="activeTab"
                          className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-10 h-1 bg-primary rounded-full"
                          transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        />
                      )}
                    </div>
                    <span
                      className={cn(
                        "text-[10px] mt-1 font-semibold transition-colors whitespace-nowrap",
                        isActive
                          ? "text-primary"
                          : "text-muted-foreground group-hover:text-foreground"
                      )}
                    >
                      {item.name}
                    </span>
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Right scroll button */}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "flex-shrink-0 h-full w-12 rounded-none border-l border-border/50",
            !canScrollRight && "opacity-30 cursor-not-allowed"
          )}
          onClick={() => scroll("right")}
          disabled={!canScrollRight}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Safe area for iOS */}
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </motion.nav>
  );
}
