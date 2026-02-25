"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Copy, Plus, Trash2, Send, Link2, Unlink, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

import { generateTelegramLinkToken, unlinkTelegram } from "@/actions/telegram";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface TelegramConnection {
  id: string;
  telegramUsername: string | null;
  telegramUserId: bigint;
  linkedAt: Date;
  isActive: boolean;
}

interface TelegramClientPageProps {
  initialConnections: TelegramConnection[];
  canManageTelegram: boolean;
}

export function TelegramClientPage({ initialConnections, canManageTelegram }: TelegramClientPageProps) {
  const [connections, setConnections] = useState(initialConnections);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [tokenExpiry, setTokenExpiry] = useState<Date | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(600); // 10 minutos

  const [unlinkId, setUnlinkId] = useState<string | null>(null);
  const [isUnlinking, setIsUnlinking] = useState(false);

  // Countdown del token
  useState(() => {
    if (generatedToken && tokenExpiry) {
      const interval = setInterval(() => {
        const left = Math.max(0, Math.floor((tokenExpiry.getTime() - Date.now()) / 1000));
        setTimeLeft(left);
        if (left === 0) {
          setGeneratedToken(null);
          setTokenExpiry(null);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  });

  async function handleGenerateToken() {
    setIsGenerating(true);
    try {
      const res = await generateTelegramLinkToken();
      if (res.success && res.data) {
        setGeneratedToken(res.data.token);
        setTokenExpiry(new Date(res.data.expiresAt));
        setTimeLeft(600);
        toast.success("Token generado correctamente");
      } else {
        toast.error(res.error || "Error al generar token");
      }
    } catch (error) {
      toast.error("Error inesperado al generar token");
    } finally {
      setIsGenerating(false);
    }
  }

  async function copyToClipboard(text: string) {
    await navigator.clipboard.writeText(text);
    toast.success("Copiado al portapapeles");
  }

  async function confirmUnlink() {
    if (!unlinkId) return;
    setIsUnlinking(true);
    try {
      const res = await unlinkTelegram(unlinkId);
      if (res.success) {
        setConnections(connections.filter((c) => c.id !== unlinkId));
        toast.success("Desvinculado correctamente");
      } else {
        toast.error(res.error || "Error al desvincular");
      }
    } catch (error) {
      toast.error("Error inesperado al desvincular");
    } finally {
      setIsUnlinking(false);
      setUnlinkId(null);
    }
  }

  function formatTimeLeft(seconds: number) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  if (!canManageTelegram) {
    return (
      <Card>
        <CardContent className="py-8 flex flex-col items-center">
          <AlertTriangle className="h-10 w-10 text-destructive mb-4" />
          <h3 className="font-semibold text-lg">Acceso Denegado</h3>
          <p className="text-muted-foreground mt-2">
            Solo los administradores o propietarios pueden gestionar la integración de Telegram.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Generar Token */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Vincular Telegram
          </CardTitle>
          <CardDescription>
            Genera un código temporal para vincular tu cuenta de Telegram con esta organización.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!generatedToken ? (
            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={handleGenerateToken} disabled={isGenerating}>
                <Plus className="mr-2 h-4 w-4" />
                {isGenerating ? "Generando..." : "Generar Código"}
              </Button>
              <p className="text-sm text-muted-foreground self-center">
                El código expira en 10 minutos
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Alerta */}
              <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg">
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-amber-600 dark:text-amber-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-amber-900 dark:text-amber-200">
                      Código expira en {formatTimeLeft(timeLeft)}
                    </p>
                    <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                      Sigue los pasos de abajo antes de que se agote el tiempo.
                    </p>
                  </div>
                </div>
              </div>

              {/* Token */}
              <div className="flex gap-2 items-center p-4 bg-muted rounded-lg border">
                <code className="text-2xl font-bold tracking-wider flex-1 text-center py-2">
                  {generatedToken}
                </code>
                <Button size="icon" variant="ghost" onClick={() => copyToClipboard(generatedToken)}>
                  <Copy className="h-5 w-5" />
                </Button>
              </div>

              {/* Instrucciones */}
              <div className="space-y-3 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg">
                <p className="font-medium text-blue-900 dark:text-blue-200 flex items-center gap-2">
                  <Link2 className="h-4 w-4" />
                  Pasos para vincular:
                </p>
                <ol className="text-sm text-blue-800 dark:text-blue-300 space-y-2 list-decimal list-inside">
                  <li>Abre Telegram en tu móvil</li>
                  <li>Busca el bot <strong>@lumicaweb_bot</strong></li>
                  <li>Escribe el comando: <code className="bg-white dark:bg-gray-800 px-2 py-0.5 rounded text-xs">/start {generatedToken}</code></li>
                  <li>¡Listo! Tu cuenta estará vinculada</li>
                </ol>
              </div>

              {/* Botón para regenerar */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setGeneratedToken(null);
                  setTokenExpiry(null);
                }}
              >
                Generar nuevo código
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Conexiones Activas */}
      <Card>
        <CardHeader>
          <CardTitle>Conexiones Activas</CardTitle>
          <CardDescription>
            Usuarios de Telegram vinculados a esta organización
          </CardDescription>
        </CardHeader>
        <CardContent>
          {connections.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center text-muted-foreground">
              <Unlink className="h-12 w-12 opacity-20 mb-4" />
              <p>No hay usuarios vinculados todavía.</p>
              <p className="text-sm mt-1">Genera un código arriba para vincular tu cuenta de Telegram.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {connections.map((conn) => (
                <div
                  key={conn.id}
                  className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <Send className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium">
                        @{conn.telegramUsername || "Sin username"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Vinculado el {format(new Date(conn.linkedAt), "dd/MM/yyyy 'a las' HH:mm")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="gap-1">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      Activo
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setUnlinkId(conn.id)}
                    >
                      <Unlink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Información adicional */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">¿Cómo funciona?</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            Una vez vinculado, podrás usar estos comandos desde Telegram:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><code>/tareas</code> - Ver tus tareas pendientes</li>
            <li><code>/proyectos</code> - Ver tus proyectos</li>
            <li><code>/clientes</code> - Ver tus clientes</li>
            <li><code>/help</code> - Ver todos los comandos</li>
          </ul>
          <p className="mt-3">
            Cada organización tiene sus datos completamente aislados. Solo tú puedes ver y gestionar
            la información de tu empresa.
          </p>
        </CardContent>
      </Card>

      {/* Desvincular Modal */}
      <AlertDialog open={!!unlinkId} onOpenChange={(open) => !open && setUnlinkId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desvincular cuenta de Telegram</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que quieres desvincular esta cuenta? Dejará de poder acceder al CRM
              desde Telegram hasta que se vincule nuevamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUnlinking}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={isUnlinking}
              onClick={confirmUnlink}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isUnlinking ? "Desvinculando..." : "Desvincular"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
