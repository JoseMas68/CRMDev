/**
 * Projects Health Widget
 * Shows all projects with their health status (healthy, warning, critical)
 */

"use client";

import { useEffect, useState } from "react";
import { Globe, GitBranch, Server, AlertCircle, CheckCircle2, Clock, FolderOpen } from "lucide-react";
import { WidgetCard } from "./widget-card";
import { getProjects } from "@/actions/projects";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type ProjectType = "GITHUB" | "WORDPRESS" | "VERCEL" | "OTHER";
type HealthStatus = "healthy" | "warning" | "critical" | null;

interface ProjectHealth {
  id: string;
  name: string;
  type: ProjectType;
  status: string;
  healthStatus: HealthStatus;
  progress: number;
}

export function ProjectsHealthWidget() {
  const [projects, setProjects] = useState<ProjectHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProjects() {
      try {
        setLoading(true);
        setError(null);

        const result = await getProjects({ limit: 10 });
        if (!result.success) throw new Error(result.error);

        // Cast the type to match our ProjectHealth interface
        setProjects(result.data.projects as ProjectHealth[]);
      } catch (err) {
        console.error("[PROJECTS_HEALTH] Error:", err);
        setError("Error al cargar proyectos");
      } finally {
        setLoading(false);
      }
    }

    loadProjects();
  }, []);

  function getProjectIcon(type: ProjectType) {
    switch (type) {
      case "GITHUB":
        return GitBranch;
      case "WORDPRESS":
        return Globe;
      case "VERCEL":
        return Server;
      default:
        return FolderOpen;
    }
  }

  function getHealthStatus(healthStatus: HealthStatus) {
    if (!healthStatus) return null;

    const statusConfig = {
      healthy: { icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50 dark:bg-green-950", label: "Saludable" },
      warning: { icon: AlertCircle, color: "text-yellow-600", bg: "bg-yellow-50 dark:bg-yellow-950", label: "Atención" },
      critical: { icon: AlertCircle, color: "text-red-600", bg: "bg-red-50 dark:bg-red-950", label: "Crítico" },
    };

    return statusConfig[healthStatus];
  }

  if (loading) {
    return (
      <WidgetCard title="Proyectos" icon={FolderOpen} size="large" loading>
        <div />
      </WidgetCard>
    );
  }

  return (
    <WidgetCard
      title="Salud de Proyectos"
      icon={FolderOpen}
      size="large"
      error={error ?? undefined}
      action={
        projects.length > 0 && (
          <Badge variant="secondary" className="text-xs">
            {projects.length} proyectos
          </Badge>
        )
      }
    >
      {projects.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No hay proyectos aún
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => {
            const Icon = getProjectIcon(project.type);
            const health = getHealthStatus(project.healthStatus);
            const HealthIcon = health?.icon;

            return (
              <div
                key={project.id}
                className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-sm">{project.name}</span>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn("text-xs", health?.color, health?.bg)}
                  >
                    {project.type}
                  </Badge>
                </div>

                <div className="space-y-2">
                  {/* Health status */}
                  {HealthIcon && health && (
                    <div className={cn("flex items-center gap-1 text-xs", health.color)}>
                      <HealthIcon className="h-3 w-3" />
                      <span>{health.label}</span>
                    </div>
                  )}

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Progreso</span>
                      <span>{project.progress}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Status badge */}
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span className="capitalize">{project.status.toLowerCase().replace("_", " ")}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </WidgetCard>
  );
}
