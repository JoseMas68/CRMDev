"use client";

import { useState, useEffect, useCallback } from "react";
import { Github, GitCommit, ExternalLink, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface Commit {
  sha: string;
  message: string;
  author: string;
  date: string;
  url: string;
}

interface GitHubCommitsCanvasProps {
  repoUrl: string;
  projectName: string;
}

export function GitHubCommitsCanvas({ repoUrl, projectName }: GitHubCommitsCanvasProps) {
  const [commits, setCommits] = useState<Commit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Extract owner and repo from URL
  const extractRepoInfo = (url: string) => {
    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (match) {
      return { owner: match[1], repo: match[2].replace(".git", "") };
    }
    return null;
  };

  const fetchCommits = useCallback(async () => {
    const repoInfo = extractRepoInfo(repoUrl);
    if (!repoInfo) {
      setError("URL de repositorio no valida");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Use GitHub API to fetch recent commits (public repos don't need auth for basic info)
      const response = await fetch(
        `https://api.github.com/repos/${repoInfo.owner}/${repoInfo.repo}/commits?per_page=10`,
        {
          headers: {
            Accept: "application/vnd.github.v3+json",
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          setError("Repositorio no encontrado o privado");
        } else if (response.status === 403) {
          setError("Limite de API alcanzado. Intenta mas tarde.");
        } else {
          setError("Error al obtener commits");
        }
        setIsLoading(false);
        return;
      }

      const data = await response.json();
      const formattedCommits: Commit[] = data.map((item: any) => ({
        sha: item.sha.substring(0, 7),
        message: item.commit.message.split("\n")[0], // First line only
        author: item.commit.author?.name || item.author?.login || "Unknown",
        date: item.commit.author?.date || new Date().toISOString(),
        url: item.html_url,
      }));

      setCommits(formattedCommits);
    } catch (err) {
      setError("Error de conexion");
    } finally {
      setIsLoading(false);
    }
  }, [repoUrl]);

  useEffect(() => {
    fetchCommits();
  }, [fetchCommits]);

  const repoInfo = extractRepoInfo(repoUrl);

  return (
    <div className="commits-canvas rounded-lg border border-charcoal-light bg-charcoal-dark/50 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Github className="h-5 w-5 text-neon-violet tech-glow-icon" />
          <span className="font-mono text-sm font-medium">
            {repoInfo ? `${repoInfo.owner}/${repoInfo.repo}` : projectName}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchCommits}
            disabled={isLoading}
            className="h-8 px-2"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
          <a
            href={repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            Ver en GitHub
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* Commits list */}
      <div className="space-y-2">
        {isLoading && commits.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchCommits}
              className="mt-4"
            >
              Reintentar
            </Button>
          </div>
        ) : commits.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">
              No se encontraron commits
            </p>
          </div>
        ) : (
          commits.map((commit) => (
            <a
              key={commit.sha}
              href={commit.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-3 p-2 rounded-md hover:bg-charcoal-light/50 transition-colors group"
            >
              <GitCommit className="h-4 w-4 mt-0.5 text-accent-green shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                  {commit.message}
                </p>
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  <code className="font-mono bg-charcoal-light px-1.5 py-0.5 rounded text-neon-violet">
                    {commit.sha}
                  </code>
                  <span>{commit.author}</span>
                  <span>•</span>
                  <span>
                    {formatDistanceToNow(new Date(commit.date), {
                      addSuffix: true,
                      locale: es,
                    })}
                  </span>
                </div>
              </div>
            </a>
          ))
        )}
      </div>

      {/* Activity bar - visual representation */}
      {commits.length > 0 && (
        <div className="mt-4 pt-4 border-t border-charcoal-light">
          <p className="text-xs text-muted-foreground mb-2">Actividad reciente</p>
          <div className="flex gap-1">
            {Array.from({ length: 30 }).map((_, i) => {
              // Generate varying intensities based on commit count
              const hasCommit = i < commits.length * 3;
              const intensity = hasCommit
                ? Math.random() > 0.5
                  ? "bg-accent-green"
                  : "bg-accent-green/50"
                : "bg-charcoal-light";
              return (
                <div
                  key={i}
                  className={`h-3 w-3 rounded-sm ${intensity} transition-colors`}
                  title={hasCommit ? "Actividad" : "Sin actividad"}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
