/**
 * Widget Card Component
 * Base wrapper for all dashboard widgets
 */

"use client";

import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface WidgetCardProps {
  title: string;
  icon: LucideIcon;
  size?: "small" | "medium" | "large";
  className?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  loading?: boolean;
  error?: string;
}

export function WidgetCard({
  title,
  icon: Icon,
  size = "medium",
  className,
  children,
  action,
  loading = false,
  error,
}: WidgetCardProps) {
  const sizeClasses = {
    small: "col-span-1",
    medium: "col-span-1 md:col-span-2",
    large: "col-span-1 md:col-span-2 lg:col-span-3",
  };

  return (
    <Card className={cn(sizeClasses[size], "relative", className)}>
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold">{title}</h3>
        </div>
        {action}
      </div>

      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        ) : (
          children
        )}
      </div>
    </Card>
  );
}
