/**
 * Widget Layout Storage Utility
 * Persists widget layout to localStorage
 */

import { WidgetLayout, DEFAULT_WIDGETS } from "./types";

const WIDGET_LAYOUT_KEY = "dashboard-widget-layout";

export function getWidgetLayout(): WidgetLayout[] {
  if (typeof window === "undefined") return DEFAULT_WIDGETS;

  try {
    const stored = localStorage.getItem(WIDGET_LAYOUT_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Validate and merge with defaults to handle new widgets
      return mergeWithDefaults(parsed);
    }
  } catch (error) {
    console.error("[WIDGETS] Error loading layout:", error);
  }

  return DEFAULT_WIDGETS;
}

export function saveWidgetLayout(layout: WidgetLayout[]): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(WIDGET_LAYOUT_KEY, JSON.stringify(layout));
  } catch (error) {
    console.error("[WIDGETS] Error saving layout:", error);
  }
}

export function resetWidgetLayout(): void {
  if (typeof window === "undefined") return;

  localStorage.removeItem(WIDGET_LAYOUT_KEY);
}

/**
 * Merge stored layout with defaults to handle new widgets
 */
function mergeWithDefaults(stored: WidgetLayout[]): WidgetLayout[] {
  const storedMap = new Map(stored.map((w) => [w.id, w]));
  const result: WidgetLayout[] = [];

  // Add all widgets from defaults, using stored values where available
  for (const widget of DEFAULT_WIDGETS) {
    const storedWidget = storedMap.get(widget.id);
    result.push(storedWidget ?? widget);
  }

  // Add any new widgets from storage that aren't in defaults (forward compatibility)
  for (const [id, widget] of storedMap) {
    if (!result.find((w) => w.id === id)) {
      result.push(widget);
    }
  }

  return result;
}
