"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, GitBranch, Download } from "lucide-react";
import { toast } from "sonner";

import { importGitHubIssues } from "@/actions/github";
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

interface ImportIssuesButtonProps {
  projectId: string;
  repoUrl: string;
}

export function ImportIssuesButton({ projectId, repoUrl }: ImportIssuesButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);

  // Extract repo name for display
  const repoName = repoUrl.replace("https://github.com/", "").replace(".git", "");

  async function handleImport() {
    setIsLoading(true);

    try {
      const result = await importGitHubIssues(projectId);

      if (result.success) {
        const { imported, skipped } = result.data;
        if (imported > 0) {
          toast.success(
            `${imported} issue${imported > 1 ? "s" : ""} importado${imported > 1 ? "s" : ""} como tareas`,
            {
              description: skipped > 0 ? `${skipped} ya existian` : undefined,
            }
          );
        } else if (skipped > 0) {
          toast.info("Todos los issues ya estaban importados");
        } else {
          toast.info("No hay issues abiertos para importar");
        }
        setOpen(false);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Error al importar issues");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm">
          <GitBranch className="mr-2 h-4 w-4" />
          Importar Issues
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Importar Issues de GitHub
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Se importaran todos los issues abiertos de{" "}
              <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">
                {repoName}
              </code>{" "}
              como tareas en este proyecto.
            </p>
            <p className="text-sm">
              Los issues ya importados seran ignorados. Las prioridades se asignaran
              automaticamente segun los labels del issue.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleImport} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importando...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Importar Issues
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
