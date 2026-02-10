"use client";

import { useState, useEffect } from "react";
import {
  Github,
  RefreshCw,
  Star,
  GitFork,
  CircleDot,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Download,
  Lock,
  Globe,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  checkGitHubConnection,
  fetchGitHubRepos,
  importGitHubRepo,
  syncGitHubProfile,
} from "@/actions/github";

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  private: boolean;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  updated_at: string;
}

interface GitHubSyncProps {
  initialConnected?: boolean;
  initialUsername?: string | null;
}

export function GitHubSync({ initialConnected = false, initialUsername = null }: GitHubSyncProps) {
  const [isConnected, setIsConnected] = useState(initialConnected);
  const [username, setUsername] = useState<string | null>(initialUsername);
  const [isLoading, setIsLoading] = useState(false);
  const [showReposDialog, setShowReposDialog] = useState(false);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [importingRepo, setImportingRepo] = useState<number | null>(null);
  const [importedRepos, setImportedRepos] = useState<Set<string>>(new Set());

  useEffect(() => {
    checkConnection();
  }, []);

  async function checkConnection() {
    const result = await checkGitHubConnection();
    if (result.success) {
      setIsConnected(result.data.connected);
      setUsername(result.data.username);
    }
  }

  async function handleSyncProfile() {
    setIsLoading(true);
    try {
      const result = await syncGitHubProfile();
      if (result.success) {
        toast.success("Perfil de GitHub sincronizado");
        await checkConnection();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Error al sincronizar perfil");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleFetchRepos() {
    setShowReposDialog(true);
    setLoadingRepos(true);
    try {
      const result = await fetchGitHubRepos();
      if (result.success) {
        setRepos(result.data);
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Error al obtener repositorios");
    } finally {
      setLoadingRepos(false);
    }
  }

  async function handleImportRepo(repo: GitHubRepo) {
    setImportingRepo(repo.id);
    try {
      const result = await importGitHubRepo({
        id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        description: repo.description,
        html_url: repo.html_url,
        language: repo.language,
      });
      if (result.success) {
        toast.success(`Repositorio "${repo.name}" importado como proyecto`);
        setImportedRepos(prev => new Set([...prev, repo.html_url]));
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Error al importar repositorio");
    } finally {
      setImportingRepo(null);
    }
  }

  const languageColors: Record<string, string> = {
    TypeScript: "bg-blue-500",
    JavaScript: "bg-yellow-400",
    Python: "bg-green-500",
    Rust: "bg-orange-500",
    Go: "bg-cyan-500",
    Java: "bg-red-500",
    "C#": "bg-purple-500",
    PHP: "bg-indigo-400",
    Ruby: "bg-red-600",
    Swift: "bg-orange-400",
    Kotlin: "bg-purple-400",
  };

  return (
    <>
      <Card className="relative">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Github className="h-8 w-8" />
            </div>
            {isConnected ? (
              <Badge variant="default" className="bg-accent-green text-white">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Conectado
              </Badge>
            ) : (
              <Badge variant="secondary">Disponible</Badge>
            )}
          </div>
          <CardTitle className="text-lg mt-4">GitHub</CardTitle>
          <CardDescription>
            {isConnected && username ? (
              <>Conectado como <span className="font-semibold text-primary">@{username}</span></>
            ) : (
              "Sincroniza repositorios, rastrea PRs y vincula issues a tareas automaticamente."
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 mb-4">
            {[
              "Autenticacion OAuth",
              "Sincronizacion de repos",
              "Seguimiento de PRs e Issues",
              "Vinculacion de commits",
            ].map((feature) => (
              <li
                key={feature}
                className="text-sm text-muted-foreground flex items-center gap-2"
              >
                <CheckCircle2 className="h-3 w-3 text-accent-green" />
                {feature}
              </li>
            ))}
          </ul>

          {isConnected ? (
            <div className="space-y-2">
              <Button
                className="w-full"
                onClick={handleFetchRepos}
                disabled={isLoading}
              >
                <Download className="h-4 w-4 mr-2" />
                Importar Repositorios
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={handleSyncProfile}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Sincronizar Perfil
              </Button>
            </div>
          ) : (
            <Button className="w-full" asChild>
              <a href="/api/auth/signin/github">
                <Github className="h-4 w-4 mr-2" />
                Conectar con GitHub
              </a>
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Repos Dialog */}
      <Dialog open={showReposDialog} onOpenChange={setShowReposDialog}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Github className="h-5 w-5" />
              Tus Repositorios de GitHub
            </DialogTitle>
            <DialogDescription>
              Selecciona los repositorios que quieres importar como proyectos en CRMDev.
            </DialogDescription>
          </DialogHeader>

          {loadingRepos ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : repos.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No se encontraron repositorios
            </div>
          ) : (
            <div className="h-[500px] overflow-y-auto pr-4 space-y-3">
              {repos.map((repo) => {
                const isImported = importedRepos.has(repo.html_url);
                const isImporting = importingRepo === repo.id;

                return (
                  <div
                    key={repo.id}
                    className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {repo.private ? (
                            <Lock className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Globe className="h-4 w-4 text-muted-foreground" />
                          )}
                          <a
                            href={repo.html_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium hover:text-primary flex items-center gap-1"
                          >
                            {repo.name}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                        {repo.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                            {repo.description}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          {repo.language && (
                            <span className="flex items-center gap-1">
                              <span
                                className={`h-2.5 w-2.5 rounded-full ${
                                  languageColors[repo.language] || "bg-gray-400"
                                }`}
                              />
                              {repo.language}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Star className="h-3 w-3" />
                            {repo.stargazers_count}
                          </span>
                          <span className="flex items-center gap-1">
                            <GitFork className="h-3 w-3" />
                            {repo.forks_count}
                          </span>
                          <span className="flex items-center gap-1">
                            <CircleDot className="h-3 w-3" />
                            {repo.open_issues_count} issues
                          </span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant={isImported ? "outline" : "default"}
                        disabled={isImported || isImporting}
                        onClick={() => handleImportRepo(repo)}
                      >
                        {isImporting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : isImported ? (
                          <>
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Importado
                          </>
                        ) : (
                          "Importar"
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
