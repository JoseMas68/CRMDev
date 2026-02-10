/**
 * WordPress Monitoring Card
 * Displays WordPress site health status and monitoring data
 */

"use client";

import { useEffect, useState } from "react";
import {
  Globe,
  Plug2,
  Palette,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Key,
  Clock,
  Zap,
  Shield,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getWordPressMonitoring, checkWordPressHealth } from "@/actions/wordpress";
import { WpApiKeyDialog } from "./wp-api-key-dialog";
import { cn } from "@/lib/utils";

interface WpMonitoringCardProps {
  projectId: string;
  wpUrl: string | null;
}

export function WpMonitoringCard({ projectId, wpUrl }: WpMonitoringCardProps) {
  const [monitoring, setMonitoring] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);

  useEffect(() => {
    loadMonitoring();
  }, [projectId]);

  async function loadMonitoring() {
    try {
      setLoading(true);
      const result = await getWordPressMonitoring(projectId);
      if (result.success) {
        setMonitoring(result.data);
        setHasApiKey(!!result.data.lastCheck || !!result.data.lastError);
      }
    } catch (error) {
      console.error("[WP_MONITOR] Error:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCheckNow() {
    setChecking(true);
    try {
      const result = await checkWordPressHealth(projectId);
      if (result.success) {
        toast.success("Verificación completada");
        await loadMonitoring();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Error al verificar WordPress");
    } finally {
      setChecking(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <div className="p-6 flex items-center justify-center">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </Card>
    );
  }

  if (!wpUrl) {
    return null;
  }

  const hasMonitoringData = monitoring?.lastCheck;
  const isHealthy = monitoring?.uptimeStatus === "up";

  return (
    <>
      <Card>
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-muted-foreground" />
                <h3 className="text-lg font-semibold">Monitoreo WordPress</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                <a
                  href={wpUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  {wpUrl}
                </a>
              </p>
            </div>

            <div className="flex items-center gap-2">
              {!hasApiKey ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowApiKeyDialog(true)}
                >
                  <Key className="mr-2 h-4 w-4" />
                  Configurar
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCheckNow}
                  disabled={checking}
                >
                  <RefreshCw className={cn("mr-2 h-4 w-4", checking && "animate-spin")} />
                  Verificar
                </Button>
              )}
            </div>
          </div>

          {!hasMonitoringData ? (
            /* No data yet */
            <div className="text-center py-8 border rounded-lg bg-muted/20">
              <Shield className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-sm text-muted-foreground mb-4">
                {!hasApiKey
                  ? "Configura la Application Password para comenzar el monitoreo"
                  : "Verifica la salud del sitio para ver los datos"}
              </p>
              {!hasApiKey && (
                <Button size="sm" onClick={() => setShowApiKeyDialog(true)}>
                  <Key className="mr-2 h-4 w-4" />
                  Configurar API Key
                </Button>
              )}
            </div>
          ) : (
            /* Monitoring data */
            <div className="space-y-4">
              {/* Status banner */}
              <div
                className={cn(
                  "flex items-center gap-3 p-4 rounded-lg border",
                  isHealthy
                    ? "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-900"
                    : "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-900"
                )}
              >
                {isHealthy ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                )}
                <div>
                  <p className="font-medium">
                    {isHealthy ? "Sitio en línea" : "Sitio no disponible"}
                  </p>
                  {monitoring.lastError && (
                    <p className="text-sm text-muted-foreground">{monitoring.lastError}</p>
                  )}
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Plugins */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Plug2 className="h-4 w-4" />
                    <span>Plugins</span>
                  </div>
                  <p className="text-2xl font-bold">
                    {monitoring.totalPlugins ?? 0}
                  </p>
                  {monitoring.pluginUpdates > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {monitoring.pluginUpdates} actualizaciones
                    </Badge>
                  )}
                </div>

                {/* Themes */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Palette className="h-4 w-4" />
                    <span>Temas</span>
                  </div>
                  <p className="text-2xl font-bold">
                    {monitoring.totalThemes ?? 0}
                  </p>
                  {monitoring.themeUpdates > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {monitoring.themeUpdates} actualizaciones
                    </Badge>
                  )}
                </div>

                {/* Response time */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Zap className="h-4 w-4" />
                    <span>Tiempo</span>
                  </div>
                  <p className="text-2xl font-bold">
                    {monitoring.responseTime ?? 0}ms
                  </p>
                </div>

                {/* SSL */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Shield className="h-4 w-4" />
                    <span>SSL</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {monitoring.sslValid ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                </div>
              </div>

              {/* Version info */}
              {(monitoring.wpVersion || monitoring.phpVersion) && (
                <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-muted/50">
                  {monitoring.wpVersion && (
                    <div>
                      <p className="text-xs text-muted-foreground">WordPress</p>
                      <p className="font-medium">{monitoring.wpVersion}</p>
                    </div>
                  )}
                  {monitoring.phpVersion && (
                    <div>
                      <p className="text-xs text-muted-foreground">PHP</p>
                      <p className="font-medium">{monitoring.phpVersion}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Last check */}
              {monitoring.lastCheck && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>
                    Última verificación:{" "}
                    {new Date(monitoring.lastCheck).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      <WpApiKeyDialog
        open={showApiKeyDialog}
        onOpenChange={setShowApiKeyDialog}
        projectId={projectId}
        hasExistingKey={hasApiKey}
      />
    </>
  );
}
