/**
 * Stats Widget
 * Shows overview statistics: Total clients, pipeline value, active projects, tasks
 */

"use client";

import { useEffect, useState } from "react";
import { BarChart3, DollarSign, FolderOpen, CheckCircle, TrendingUp, Users } from "lucide-react";
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
      icon: Users,
      color: "text-white",
      bgColor: "bg-gradient-to-br from-green-500 to-green-600",
    },
    {
      label: "Pipeline",
      value: `$${((data?.pipelineValue ?? 0) / 1000).toFixed(0)}k`,
      icon: DollarSign,
      color: "text-white",
      bgColor: "bg-gradient-to-br from-blue-500 to-blue-600",
    },
    {
      label: "Proyectos",
      value: data?.activeProjects ?? 0,
      icon: FolderOpen,
      color: "text-white",
      bgColor: "bg-gradient-to-br from-purple-500 to-purple-600",
    },
    {
      label: "Tareas",
      value: data?.openTasks ?? 0,
      icon: BarChart3,
      color: "text-white",
      bgColor: "bg-gradient-to-br from-orange-500 to-orange-600",
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
      {/* Mobile: Grid de 2 columnas con cards grandes */}
      <div className="grid grid-cols-2 gap-3 md:hidden">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`${stat.bgColor} rounded-2xl p-4 shadow-lg`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="bg-white/20 p-2 rounded-xl">
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <TrendingUp className="h-4 w-4 text-white/60" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {stat.value}
            </div>
            <div className="text-xs text-white/80 font-medium">
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: Grid original */}
      <div className="hidden md:grid grid-cols-4 gap-4">
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
