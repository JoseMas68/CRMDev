/**
 * Sistema de Temas CRMPro
 *
 * Define 4 temas principales para el CRM:
 * - dev: Tema oscuro técnico para desarrolladores (tema original)
 * - business: Tema profesional claro corporativo
 * - business-dark: Tema profesional oscuro corporativo
 * - light: Tema claro minimalista
 */

export type Theme = "dev" | "business" | "business-dark" | "light";

export interface ThemeConfig {
  name: string;
  description: string;
  class: string;
  icon: string;
  preview: {
    primary: string;
    background: string;
    accent: string;
  };
}

/**
 * Configuración de los 4 temas disponibles
 */
export const themes: Record<Theme, ThemeConfig> = {
  dev: {
    name: "Desarrollador",
    description: "Oscuro técnico con neón violeta",
    class: "dark",
    icon: "code",
    preview: {
      primary: "#a78bfa",
      background: "#0e0e10",
      accent: "#22c55e",
    },
  },
  business: {
    name: "Profesional Claro",
    description: "Corporativo limpio y aireado",
    class: "theme-business",
    icon: "briefcase",
    preview: {
      primary: "#0066CC",
      background: "#ffffff",
      accent: "#ff6b35",
    },
  },
  "business-dark": {
    name: "Profesional Oscuro",
    description: "Corporativo elegante en oscuro",
    class: "theme-business-dark",
    icon: "briefcase",
    preview: {
      primary: "#3b82f6",
      background: "#0f172a",
      accent: "#f97316",
    },
  },
  light: {
    name: "Minimalista",
    description: "Claro simple y clean",
    class: "theme-light",
    icon: "sun",
    preview: {
      primary: "#475569",
      background: "#ffffff",
      accent: "#10b981",
    },
  },
};

/**
 * Tema por defecto para nuevos usuarios
 */
export const DEFAULT_THEME: Theme = "business";

/**
 * Obtener el tema actual desde localStorage
 */
export function getStoredTheme(): Theme | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem("crm-theme");
  if (stored && stored in themes) {
    return stored as Theme;
  }
  return null;
}

/**
 * Guardar el tema en localStorage
 */
export function storeTheme(theme: Theme): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("crm-theme", theme);
}

/**
 * Obtener lista de temas para el selector
 */
export function getThemeList(): Array<{ key: Theme; config: ThemeConfig }> {
  return Object.entries(themes).map(([key, config]) => ({
    key: key as Theme,
    config,
  }));
}

/**
 * Mapeo de temas a clases CSS para next-themes
 */
export const themeClassMap: Record<Theme, string> = {
  dev: "dark",
  business: "theme-business",
  "business-dark": "theme-business-dark",
  light: "theme-light",
};
