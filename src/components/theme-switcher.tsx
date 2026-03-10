"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import {
  Code,
  Briefcase,
  Sun,
  Check,
  ChevronDown,
  Palette,
  Moon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { themes, type Theme, themeClassMap } from "@/lib/themes";

/**
 * ThemeSwitcher Component
 *
 * Permite al usuario cambiar entre los 3 temas disponibles:
 * - Dev (Oscuro técnico)
 * - Business (Profesional corporativo)
 * - Light (Minimalista claro)
 *
 * Características:
 * - Preview visual de cada tema
 * - Persistencia en localStorage
 * - Iconos representativos
 * - Transiciones suaves
 */
export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Evitar hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="outline" size="sm" className="gap-2 pr-3">
        <Palette className="h-4 w-4" />
        <span className="hidden sm:inline">Tema</span>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </Button>
    );
  }

  // Mapear el tema de next-themes a nuestro Theme type
  const currentTheme = Object.entries(themeClassMap).find(
    ([_, className]) => className === theme
  )?.[0] as Theme || "business";

  const handleThemeChange = (newTheme: Theme) => {
    const themeClass = themeClassMap[newTheme];
    setTheme(themeClass);
  };

  const getThemeIcon = (themeKey: Theme) => {
    switch (themeKey) {
      case "dev":
        return <Code className="h-4 w-4" />;
      case "business":
        return <Briefcase className="h-4 w-4" />;
      case "business-dark":
        return <Moon className="h-4 w-4" />;
      case "light":
        return <Sun className="h-4 w-4" />;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 pr-3"
        >
          <Palette className="h-4 w-4" />
          <span className="hidden sm:inline">Tema</span>
          <ChevronDown className="h-4 w-4 opacity-50" />
          <span className="sr-only">Cambiar apariencia del tema</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Palette className="h-4 w-4" />
          <span>Apariencia</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {Object.entries(themes).map(([key, config]) => {
          const themeKey = key as Theme;
          const isActive = currentTheme === themeKey;

          return (
            <DropdownMenuItem
              key={key}
              onClick={() => handleThemeChange(themeKey)}
              className="cursor-pointer gap-3"
            >
              {/* Icono del tema */}
              <div className="flex-shrink-0">
                {getThemeIcon(themeKey)}
              </div>

              {/* Info del tema */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium truncate pr-2">{config.name}</p>
                  {isActive && (
                    <Check className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {config.description}
                </p>
              </div>

              {/* Preview visual */}
              <div className="flex-shrink-0 flex gap-0.5">
                <div
                  className="w-3 h-3 rounded-full border"
                  style={{ backgroundColor: config.preview.primary }}
                  title="Color primario"
                />
                <div
                  className="w-3 h-3 rounded-full border"
                  style={{ backgroundColor: config.preview.background }}
                  title="Fondo"
                />
                <div
                  className="w-3 h-3 rounded-full border"
                  style={{ backgroundColor: config.preview.accent }}
                  title="Acento"
                />
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
