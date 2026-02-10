/**
 * WordPress API Key Dialog
 * Allows users to save/update the WordPress Application Password
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Key, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { saveWordPressApiKey } from "@/actions/wordpress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface WpApiKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  hasExistingKey: boolean;
}

export function WpApiKeyDialog({
  open,
  onOpenChange,
  projectId,
  hasExistingKey,
}: WpApiKeyDialogProps) {
  const router = useRouter();
  const [apiKey, setApiKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!apiKey.trim()) {
      toast.error("La API key es requerida");
      return;
    }

    setIsLoading(true);

    try {
      const result = await saveWordPressApiKey(projectId, apiKey.trim());

      if (result.success) {
        toast.success("API key guardada correctamente");
        setApiKey("");
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Error al guardar API key");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Configurar Integración WordPress</DialogTitle>
          <DialogDescription>
            {hasExistingKey
              ? "Actualiza la Application Password de WordPress para este proyecto."
              : "Guarda la Application Password de WordPress para habilitar el monitoreo."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey">
              Application Password <span className="text-destructive">*</span>
            </Label>
            <Input
              id="apiKey"
              type="text"
              placeholder="abcd 1234 efgh 5678"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              disabled={isLoading}
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              Pega aquí la Application Password generada en WordPress
            </p>
          </div>

          <div className="rounded-lg bg-muted p-3 text-sm">
            <p className="font-medium mb-1">¿Cómo obtener la Application Password?</p>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>Ve al panel de WordPress del cliente</li>
              <li>Navega a <strong>Usuarios → Tu perfil</strong></li>
              <li>Desplaza hasta <strong>Application Passwords</strong></li>
              <li>Crea una nueva (ej: "CRMDev")</li>
              <li>Copia y pega el código generado</li>
            </ol>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || !apiKey.trim()}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Key className="mr-2 h-4 w-4" />
              {hasExistingKey ? "Actualizar" : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
