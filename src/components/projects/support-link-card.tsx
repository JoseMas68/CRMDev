/**
 * Support Link Card Component
 * Displays the project's support portal token and link for clients
 */

"use client";

import { useState } from "react";
import { LifeBuoy, Copy, Check, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface SupportLinkCardProps {
  supportToken: string | null;
  projectName: string;
}

export function SupportLinkCard({ supportToken, projectName }: SupportLinkCardProps) {
  const [copied, setCopied] = useState(false);

  if (!supportToken) {
    return null;
  }

  // Use public URL in production, localhost in development
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
  const supportUrl = `${baseUrl}/support/${supportToken}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(supportUrl);
      setCopied(true);
      toast.success("Enlace copiado al portapapeles");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Error al copiar el enlace");
    }
  };

  const handleCopyToken = async () => {
    try {
      await navigator.clipboard.writeText(supportToken);
      toast.success("Token copiado al portapapeles");
    } catch (error) {
      toast.error("Error al copiar el token");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <LifeBuoy className="h-5 w-5 text-primary" />
          Portal de Soporte
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Comparte este enlace con tu cliente para que pueda crear tickets de soporte para el proyecto <strong>{projectName}</strong>.
        </p>

        {/* Support URL */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Enlace del Portal</label>
          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-muted rounded-md text-sm">
              <LinkIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="truncate">{supportUrl}</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopyLink}
              className="shrink-0"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Token */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Token del Proyecto</label>
          <div className="flex gap-2">
            <code className="flex-1 px-3 py-2 bg-muted rounded-md text-sm font-mono truncate">
              {supportToken}
            </code>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopyToken}
              className="shrink-0"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="pt-2 border-t">
          <a
            href={supportUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            Abrir portal de soporte
            <LinkIcon className="h-3 w-3" />
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
