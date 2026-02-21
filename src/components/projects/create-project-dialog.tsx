"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Github, ExternalLink, Lock, Globe, Star, GitFork, CircleDot } from "lucide-react";
import { toast } from "sonner";

import { createProject } from "@/actions/projects";
import { checkGitHubConnection, fetchGitHubRepos } from "@/actions/github";
import {
  createProjectSchema,
  type CreateProjectInput,
} from "@/lib/validations/project";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CreateProjectDialogProps {
  children: ReactNode;
  clients: { id: string; name: string }[];
}

export function CreateProjectDialog({
  children,
  clients,
}: CreateProjectDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // GitHub Import States
  const [isGitHubConnected, setIsGitHubConnected] = useState(false);
  const [showReposDialog, setShowReposDialog] = useState(false);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [repos, setRepos] = useState<any[]>([]);

  // Check connection when dialog opens
  async function checkConnection() {
    const result = await checkGitHubConnection();
    if (result.success) {
      setIsGitHubConnected(result.data.connected);
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

  function handleSelectRepo(repo: any) {
    setValue("name", repo.name);
    setValue("description", repo.description || "");
    setValue("repoUrl", repo.html_url);
    if (repo.language) {
      setValue("techStack", [repo.language]);
    }
    setShowReposDialog(false);
    toast.success(`Datos de ${repo.name} pre-cargados`);
  }

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateProjectInput>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      type: "OTHER",
      status: "NOT_STARTED",
      currency: "USD",
      techStack: [],
      labels: [],
    },
  });

  const selectedType = watch("type");
  const selectedStatus = watch("status");
  const selectedClient = watch("clientId");

  async function onSubmit(data: CreateProjectInput) {
    setIsLoading(true);

    try {
      const result = await createProject(data);

      if (result.success) {
        toast.success("Proyecto creado correctamente");
        reset();
        setOpen(false);
        router.push(`/projects/${result.data.id}`);
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Error al crear proyecto");
    } finally {
      setIsLoading(false);
    }
  }

  function handleOpenChange(newOpen: boolean) {
    if (!newOpen) {
      reset();
    } else {
      checkConnection();
    }
    setOpen(newOpen);
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
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuevo Proyecto</DialogTitle>
            <DialogDescription>
              Crea un nuevo proyecto para organizar tus tareas y seguir el
              progreso.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Nombre <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Nombre del proyecto"
                disabled={isLoading}
                {...register("name")}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Descripcion</Label>
              <Textarea
                id="description"
                placeholder="Describe el proyecto..."
                rows={3}
                disabled={isLoading}
                {...register("description")}
              />
            </div>

            {/* Client */}
            <div className="space-y-2">
              <Label htmlFor="clientId">Cliente (opcional)</Label>
              <Select
                value={selectedClient || "_none"}
                onValueChange={(value) =>
                  setValue("clientId", value === "_none" ? undefined : value)
                }
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">Sin cliente</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Project Type */}
            <div className="space-y-2">
              <Label htmlFor="type">Tipo de Proyecto</Label>
              <Select
                value={selectedType}
                onValueChange={(value) =>
                  setValue("type", value as CreateProjectInput["type"])
                }
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OTHER">Otro</SelectItem>
                  <SelectItem value="GITHUB">GitHub</SelectItem>
                  <SelectItem value="WORDPRESS">WordPress</SelectItem>
                  <SelectItem value="VERCEL">Vercel</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* URLs based on type */}
            {selectedType === "GITHUB" && (
              <div className="space-y-4">
                {isGitHubConnected ? (
                  <div className="p-4 border rounded-lg bg-muted/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium flex items-center gap-2">
                          <Github className="h-4 w-4" /> Importar desde GitHub
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          Autocompleta los datos conectando un repositorio existente.
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={handleFetchRepos}
                      >
                        Ver Repositorios
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 border rounded-lg bg-amber-500/10 border-amber-500/20">
                    <p className="text-sm text-amber-600 dark:text-amber-400 mb-2">
                      Conecta tu cuenta de GitHub en Integraciones para importar repositorios.
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="repoUrl">URL del Repositorio (opcional)</Label>
                  <Input
                    id="repoUrl"
                    type="url"
                    placeholder="https://github.com/usuario/repo"
                    disabled={isLoading}
                    {...register("repoUrl")}
                  />
                  {errors.repoUrl && (
                    <p className="text-sm text-destructive">{errors.repoUrl.message}</p>
                  )}
                </div>
              </div>
            )}

            {selectedType === "WORDPRESS" && (
              <div className="space-y-2">
                <Label htmlFor="wpUrl">URL del Sitio WordPress</Label>
                <Input
                  id="wpUrl"
                  type="url"
                  placeholder="https://ejemplo.com"
                  disabled={isLoading}
                  {...register("wpUrl")}
                />
                {errors.wpUrl && (
                  <p className="text-sm text-destructive">{errors.wpUrl.message}</p>
                )}
              </div>
            )}

            {selectedType === "VERCEL" && (
              <div className="space-y-2">
                <Label htmlFor="vercelUrl">URL de Vercel (opcional)</Label>
                <Input
                  id="vercelUrl"
                  type="url"
                  placeholder="https://tu-app.vercel.app"
                  disabled={isLoading}
                  {...register("vercelUrl")}
                />
                {errors.vercelUrl && (
                  <p className="text-sm text-destructive">{errors.vercelUrl.message}</p>
                )}
              </div>
            )}

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <Select
                value={selectedStatus}
                onValueChange={(value) =>
                  setValue("status", value as CreateProjectInput["status"])
                }
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NOT_STARTED">No Iniciado</SelectItem>
                  <SelectItem value="IN_PROGRESS">En Progreso</SelectItem>
                  <SelectItem value="ON_HOLD">Pausado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Fecha de inicio</Label>
                <Input
                  id="startDate"
                  type="date"
                  disabled={isLoading}
                  {...register("startDate")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deadline">Fecha limite</Label>
                <Input
                  id="deadline"
                  type="date"
                  disabled={isLoading}
                  {...register("deadline")}
                />
              </div>
            </div>

            {/* Budget */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2 space-y-2">
                <Label htmlFor="budget">Presupuesto (opcional)</Label>
                <Input
                  id="budget"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  disabled={isLoading}
                  {...register("budget", { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Moneda</Label>
                <Select
                  value={watch("currency")}
                  onValueChange={(value) => setValue("currency", value)}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="MXN">MXN</SelectItem>
                    <SelectItem value="ARS">ARS</SelectItem>
                    <SelectItem value="COP">COP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Tech Stack */}
            <div className="space-y-2">
              <Label htmlFor="techStack">Tech Stack (separado por comas)</Label>
              <Input
                id="techStack"
                placeholder="React, Next.js, Prisma"
                disabled={isLoading}
                {...register("techStack")}
                onChange={(e) => {
                  const value = e.target.value;
                  setValue("techStack", value ? value.split(",").map(s => s.trim()) : []);
                }}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Crear Proyecto
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Nested Dialog for Repos */}
      <Dialog open={showReposDialog} onOpenChange={setShowReposDialog}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] z-[100]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Github className="h-5 w-5" />
              Tus Repositorios de GitHub
            </DialogTitle>
            <DialogDescription>
              Selecciona un repositorio para pre-cargar la informacion en tu nuevo proyecto.
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
              {repos.map((repo) => (
                <div
                  key={repo.id}
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
                  onClick={() => handleSelectRepo(repo)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {repo.private ? (
                          <Lock className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Globe className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="font-medium group-hover:text-primary transition-colors">
                          {repo.name}
                        </span>
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
                              className={`h-2.5 w-2.5 rounded-full ${languageColors[repo.language] || "bg-gray-400"
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
                      </div>
                    </div>
                    <Button size="sm" variant="secondary">
                      Seleccionar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
