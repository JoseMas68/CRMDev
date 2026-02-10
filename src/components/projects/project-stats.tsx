"use client";

import {
  FolderKanban,
  PlayCircle,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface ProjectStatsProps {
  stats: {
    total: number;
    byStatus: Record<string, number>;
    overdue: number;
    completedThisMonth: number;
  };
}

export function ProjectStats({ stats }: ProjectStatsProps) {
  const statCards = [
    {
      title: "Total Proyectos",
      value: stats.total,
      icon: FolderKanban,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "En Progreso",
      value: stats.byStatus.IN_PROGRESS || 0,
      icon: PlayCircle,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
    },
    {
      title: "Completados (mes)",
      value: stats.completedThisMonth,
      icon: CheckCircle2,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Vencidos",
      value: stats.overdue,
      icon: AlertTriangle,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat) => (
        <Card key={stat.title}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
