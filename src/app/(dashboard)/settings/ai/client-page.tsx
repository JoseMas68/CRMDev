"use client";

import { useState } from "react";
import { Bot, KeyRound, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

import { saveOpenAIApiKey, deleteOpenAIApiKey } from "@/actions/ai";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

interface AiClientPageProps {
  canManageAI: boolean;
  hasApiKey: boolean;
  preview: string | null;
}

export function AiClientPage({ canManageAI, hasApiKey, preview }: AiClientPageProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!apiKey.trim()) return;

    setIsSaving(true);
    try {
      const res = await saveOpenAIApiKey(apiKey.trim());
      if (res.success) {
        toast.success("API Key guardada correctamente");
        setApiKey("");
        // Recargar página para actualizar estado
        setTimeout(() => window.location.reload(), 500);
      } else {
        toast.error(res.error || "Error al guardar API Key");
      }
    } catch (error) {
      toast.error("Error inesperado al guardar");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    setIsDeleting(true);
    try {
      const res = await deleteOpenAIApiKey();
      if (res.success) {
        toast.success("API Key eliminada");
        setTimeout(() => window.location.reload(), 500);
      } else {
        toast.error(res.error || "Error al eliminar");
      }
    } catch (error) {
      toast.error("Error inesperado al eliminar");
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  }

  if (!canManageAI) {
    return (
      <Card>
        <CardContent className="py-8 flex flex-col items-center">
          <AlertTriangle className="h-10 w-10 text-destructive mb-4" />
          <h3 className="font-semibold text-lg">Acceso Denegado</h3>
          <p className="text-muted-foreground mt-2">
            Solo los administradores o propietarios pueden gestionar la configuración de IA.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Configurar API Key */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            API Key de OpenAI
          </CardTitle>
          <CardDescription>
            Tu API Key se usa solo para tu organización. Nunca se comparte con otros.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {hasApiKey ? (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-lg">
                <p className="font-medium text-green-900 dark:text-green-200">
                  ✓ API Key configurada
                </p>
                <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                  Termina en: {preview}
                </p>
              </div>

              <Button
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar API Key
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key de OpenAI</Label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="sk-proj-..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  autoComplete="off"
                />
                <p className="text-xs text-muted-foreground">
                  Empieza por <code>sk-</code>. Consíguela en{" "}
                  <a
                    href="https://platform.openai.com/api-keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    platform.openai.com
                  </a>
                </p>
              </div>

              <Button type="submit" disabled={isSaving || !apiKey.trim()}>
                {isSaving ? "Guardando..." : "Guardar API Key"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Información del asistente */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Cómo funciona el asistente
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-3">
          <p>
            Una vez configurada la API Key, podrás usar el asistente de IA en{" "}
            <a href="/chat" className="text-blue-600 hover:underline">
              /chat
            </a>
            {" "}para:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Crear tareas: <code>"Crea una tarea urgente para llamar a Juan"</code></li>
            <li>Ver tareas: <code>"¿Qué tareas tengo pendientes?"</code></li>
            <li>Crear proyectos: <code>"Crea un proyecto para la web del cliente"</code></li>
            <li>Ver clientes: <code>"Listar clientes activos"</code></li>
          </ul>
          <p className="text-xs mt-4">
            El asistente usa function calling de OpenAI para ejecutar acciones reales en tu CRM.
            Solo tiene acceso a los datos de tu organización.
          </p>
        </CardContent>
      </Card>

      {/* Diálogo de eliminación */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar API Key</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que quieres eliminar la API Key? El asistente de IA dejará de funcionar
              hasta que se configure una nueva.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
