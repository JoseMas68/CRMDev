"use client";

import {
  CheckSquare,
  Clock,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface TaskStatsProps {
  stats: {
    total: number;
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
    overdue: number;
    completedToday: number;
    myTasks: number;
  };
}

export function TaskStats({ stats }: TaskStatsProps) {
  const inProgress = stats.byStatus.IN_PROGRESS || 0;
  const todo = stats.byStatus.TODO || 0;

  const statCards = [
    {
      title: "Pendientes",
      value: todo + inProgress,
      description: `${inProgress} en progreso`,
      icon: CheckSquare,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Completadas Hoy",
      value: stats.completedToday,
      icon: TrendingUp,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Vencidas",
      value: stats.overdue,
      icon: AlertTriangle,
      color: stats.overdue > 0 ? "text-red-500" : "text-muted-foreground",
      bgColor: stats.overdue > 0 ? "bg-red-500/10" : "bg-muted",
    },
    {
      title: "Urgentes",
      value: stats.byPriority.URGENT || 0,
      icon: Clock,
      color:
        (stats.byPriority.URGENT || 0) > 0
          ? "text-orange-500"
          : "text-muted-foreground",
      bgColor:
        (stats.byPriority.URGENT || 0) > 0 ? "bg-orange-500/10" : "bg-muted",
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
                {stat.description && (
                  <p className="text-xs text-muted-foreground">
                    {stat.description}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
