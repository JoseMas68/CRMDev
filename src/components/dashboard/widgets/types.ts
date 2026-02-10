/**
 * Dashboard Widget System Types
 */

import { LucideIcon } from "lucide-react";

export type WidgetType =
  | "stats"
  | "billable"
  | "activity"
  | "tasks-due-soon"
  | "pipeline"
  | "github"
  | "wp-health"
  | "projects-health";

export interface WidgetConfig {
  id: WidgetType;
  title: string;
  icon: LucideIcon;
  size: "small" | "medium" | "large";
  description?: string;
  defaultEnabled?: boolean;
}

export interface WidgetLayout {
  id: WidgetType;
  order: number;
  visible: boolean;
}

export const DEFAULT_WIDGETS: WidgetLayout[] = [
  { id: "stats", order: 0, visible: true },
  { id: "billable", order: 1, visible: true },
  { id: "projects-health", order: 2, visible: true },
  { id: "activity", order: 3, visible: true },
  { id: "tasks-due-soon", order: 4, visible: true },
  { id: "pipeline", order: 5, visible: true },
  { id: "wp-health", order: 6, visible: true },
  { id: "github", order: 7, visible: true },
];
