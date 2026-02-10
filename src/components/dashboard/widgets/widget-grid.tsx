/**
 * Widget Grid Component
 * Displays widgets in a responsive grid
 */

"use client";

import { StatsWidget } from "./stats-widget";
import { ProjectsHealthWidget } from "./projects-health-widget";
import { getWidgetLayout } from "./widget-storage";
import { WidgetType } from "./types";

const WIDGET_COMPONENTS: Record<WidgetType, React.ComponentType> = {
  stats: StatsWidget,
  billable: () => null, // TODO
  activity: () => null, // TODO
  "tasks-due-soon": () => null, // TODO
  pipeline: () => null, // TODO
  github: () => null, // TODO
  "wp-health": () => null, // TODO
  "projects-health": ProjectsHealthWidget,
};

export function WidgetGrid() {
  const layout = getWidgetLayout();
  const visibleWidgets = layout.filter((w) => w.visible).sort((a, b) => a.order - b.order);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {visibleWidgets.map((widget) => {
        const WidgetComponent = WIDGET_COMPONENTS[widget.id];
        if (!WidgetComponent) return null;
        return <WidgetComponent key={widget.id} />;
      })}
    </div>
  );
}
