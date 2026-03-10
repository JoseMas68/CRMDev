"use client";

import { useState } from "react";
import { Copy, Check, RefreshCw, ShieldOff, Link2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { generateClientSupportToken, revokeClientSupportToken } from "@/actions/clients";

interface SupportTokenCardProps {
  clientId: string;
  supportToken: string | null;
  supportTokenActive: boolean;
}

export function SupportTokenCard({
  clientId,
  supportToken: initialToken,
  supportTokenActive: initialActive,
}: SupportTokenCardProps) {
  const [token, setToken] = useState<string | null>(initialToken);
  const [isActive, setIsActive] = useState(initialActive);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const portalUrl = token ? `https://crmdev.tech/support/t/${token}` : null;

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const result = await generateClientSupportToken(clientId);
      if (result.success && result.data) {
        setToken(result.data.token);
        setIsActive(true);
        toast.success("Enlace de soporte generado correctamente");
      } else {
        toast.error(result.error ?? "Error al generar el enlace");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async () => {
    setLoading(true);
    try {
      const result = await revokeClientSupportToken(clientId);
      if (result.success) {
        setIsActive(false);
        toast.success("Enlace de soporte revocado");
      } else {
        toast.error(result.error ?? "Error al revocar el enlace");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!portalUrl) return;
    await navigator.clipboard.writeText(portalUrl);
    setCopied(true);
    toast.success("URL copiada al portapapeles");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Link2 className="h-5 w-5" />
          Portal de Soporte del Cliente
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!token && (
          <div className="text-center py-4 space-y-3">
            <p className="text-sm text-muted-foreground">
              Genera un enlace único y secreto para que este cliente pueda enviar tickets de soporte.
            </p>
            <Button onClick={handleGenerate} disabled={loading}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Link2 className="mr-2 h-4 w-4" />
              )}
              Generar enlace de soporte
            </Button>
          </div>
        )}

        {token && isActive && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Enlace activo. Compártelo con el cliente para que pueda crear tickets.
            </p>
            <div className="flex items-center gap-2 bg-muted rounded-md px-3 py-2">
              <span className="text-sm font-mono flex-1 truncate">{portalUrl}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={handleCopy}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>

            <div className="flex gap-2 flex-wrap">
              {/* Regenerate */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" disabled={loading}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Regenerar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Regenerar enlace de soporte?</AlertDialogTitle>
                    <AlertDialogDescription>
                      ¿Seguro? El enlace anterior dejará de funcionar y el cliente necesitará el nuevo enlace para acceder al portal.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleGenerate}>
                      Sí, regenerar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              {/* Revoke */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" disabled={loading}>
                    <ShieldOff className="mr-2 h-4 w-4" />
                    Revocar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Revocar acceso al portal?</AlertDialogTitle>
                    <AlertDialogDescription>
                      El cliente no podrá acceder al portal de soporte hasta que regeneres el enlace.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleRevoke}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Sí, revocar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        )}

        {token && !isActive && (
          <div className="space-y-3">
            <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 rounded-md p-3">
              <p className="text-sm text-red-800 dark:text-red-200 flex items-center gap-2">
                <ShieldOff className="h-4 w-4" />
                El enlace de soporte está revocado. El cliente no puede acceder al portal.
              </p>
            </div>
            <Button onClick={handleGenerate} disabled={loading}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Reactivar / Regenerar enlace
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
