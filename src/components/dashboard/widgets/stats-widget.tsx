/**
 * Stats Widget
 * Shows overview statistics: Total clients, pipeline value, active projects, tasks
 */

"use client";

import { useEffect, useState } from "react";
import { BarChart3, DollarSign, FolderOpen, CheckCircle } from "lucide-react";
import { WidgetCard } from "./widget-card";
import { getProjectStats } from "@/actions/projects";
import { getClients } from "@/actions/clients";
import { getTasks } from "@/actions/tasks";
import { getDealsForKanban } from "@/actions/deals";

interface StatsData {
  totalClients: number;
  pipelineValue: number;
  activeProjects: number;
  openTasks: number;
}

export function StatsWidget() {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadStats() {
      try {
        setLoading(true);
        setError(null);

        const [projectsResult, clientsResult, tasksResult, dealsResult] =
          await Promise.all([
            getProjectStats(),
            getClients({ limit: 1 }),
            getTasks({ limit: 1 }),
            getDealsForKanban(),
          ]);

        if (
          !projectsResult.success ||
          !clientsResult.success ||
          !tasksResult.success ||
          !dealsResult.success
        ) {
          throw new Error("Error loading stats");
        }

        // Calculate pipeline value and total open deals from kanban data
        let totalDeals = 0;
        let pipelineValue = 0;
        for (const stage of dealsResult.data.stages) {
          for (const deal of stage.deals) {
            if (deal.status === "OPEN") {
              totalDeals++;
              pipelineValue += deal.value;
            }
          }
        }

        setData({
          totalClients: clientsResult.data.total,
          pipelineValue,
          activeProjects:
            projectsResult.data.byStatus.IN_PROGRESS +
            projectsResult.data.byStatus.NOT_STARTED,
          openTasks: tasksResult.data.total,
        });
      } catch (err) {
        console.error("[STATS_WIDGET] Error:", err);
        setError("Error al cargar estadísticas");
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  const stats = [
    {
      label: "Clientes",
      value: data?.totalClients ?? 0,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950",
    },
    {
      label: "Pipeline",
      value: `$${((data?.pipelineValue ?? 0) / 1000).toFixed(0)}k`,
      icon: DollarSign,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950",
    },
    {
      label: "Proyectos",
      value: data?.activeProjects ?? 0,
      icon: FolderOpen,
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950",
    },
    {
      label: "Tareas",
      value: data?.openTasks ?? 0,
      icon: BarChart3,
      color: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-950",
    },
  ];

  return (
    <WidgetCard
      title="Resumen General"
      icon={BarChart3}
      size="medium"
      loading={loading}
      error={error ?? undefined}
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col items-center justify-center p-4 rounded-lg border bg-card"
          >
            <div className={`${stat.bgColor} p-2 rounded-full mb-2`}>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="text-xs text-muted-foreground">{stat.label}</div>
          </div>
        ))}
      </div>
    </WidgetCard>
  );
}
