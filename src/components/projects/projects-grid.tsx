"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  Search,
  Filter,
  X,
  Calendar,
  CheckSquare,
  Github,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

import { cn, formatDate, formatCurrency, getInitials } from "@/lib/utils";
import { deleteProject } from "@/actions/projects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  progress: number;
  startDate: Date | null;
  deadline: Date | null;
  budget: number | null;
  spent: number;
  currency: string;
  repoUrl: string | null;
  techStack: string[];
  client: { id: string; name: string } | null;
  projectMembers?: Array<{
    user: { id: string; name: string; image: string | null };
  }>;
  _count: { tasks: number };
  createdAt: Date;
}

interface ProjectsGridProps {
  projects: Project[];
  total: number;
  page: number;
  pageSize: number;
  currentStatus?: string;
  currentSearch?: string;
}

const statusColors: Record<string, string> = {
  NOT_STARTED: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  IN_PROGRESS: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  ON_HOLD: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  COMPLETED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

const statusLabels: Record<string, string> = {
  NOT_STARTED: "No Iniciado",
  IN_PROGRESS: "En Progreso",
  ON_HOLD: "Pausado",
  COMPLETED: "Completado",
  CANCELLED: "Cancelado",
};

export function ProjectsGrid({
  projects,
  total,
  page,
  pageSize,
  currentStatus,
  currentSearch,
}: ProjectsGridProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(currentSearch || "");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const totalPages = Math.ceil(total / pageSize);

  function updateSearchParams(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());

    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    if (key !== "page") {
      params.delete("page");
    }

    router.push(`/projects?${params.toString()}`);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    updateSearchParams("search", searchValue || null);
  }

  function handleStatusChange(value: string) {
    updateSearchParams("status", value === "all" ? null : value);
  }

  function clearFilters() {
    setSearchValue("");
    router.push("/projects");
  }

  async function handleDelete() {
    if (!projectToDelete) return;

    setIsDeleting(true);

    try {
      const result = await deleteProject(projectToDelete.id);

      if (result.success) {
        toast.success("Proyecto eliminado correctamente");
        setDeleteDialogOpen(false);
        setProjectToDelete(null);
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Error al eliminar proyecto");
    } finally {
      setIsDeleting(false);
    }
  }

  const hasFilters = currentStatus || currentSearch;

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar proyectos..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button type="submit" variant="secondary">
            Buscar
          </Button>
        </form>

        <div className="flex gap-2">
          <Select
            value={currentStatus || "all"}
            onValueChange={handleStatusChange}
          >
            <SelectTrigger className="w-[160px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="NOT_STARTED">No Iniciado</SelectItem>
              <SelectItem value="IN_PROGRESS">En Progreso</SelectItem>
              <SelectItem value="ON_HOLD">Pausado</SelectItem>
              <SelectItem value="COMPLETED">Completado</SelectItem>
              <SelectItem value="CANCELLED">Cancelado</SelectItem>
            </SelectContent>
          </Select>

          {hasFilters && (
            <Button variant="ghost" onClick={clearFilters}>
              <X className="mr-2 h-4 w-4" />
              Limpiar
            </Button>
          )}
        </div>
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {hasFilters
            ? "No se encontraron proyectos con estos filtros"
            : "No hay proyectos aun. Crea el primero."}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card key={project.id} className="dashboard-card group lg:hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-3 lg:gap-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1 min-w-0">
                      <Link
                        href={`/projects/${project.id}`}
                        className="font-semibold hover:underline line-clamp-1"
                      >
                        {project.name}
                      </Link>
                      {project.client && (
                        <p className="text-sm text-muted-foreground truncate">
                          {project.client.name}
                        </p>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/projects/${project.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            Ver detalles
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/projects/${project.id}/edit`}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => {
                            setProjectToDelete(project);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Status and GitHub badges */}
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="secondary"
                    className={cn("font-normal", statusColors[project.status])}
                  >
                    {statusLabels[project.status]}
                  </Badge>
                  {project.repoUrl && (
                    <a
                      href={project.repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Github className="h-3 w-3" />
                      GitHub
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  )}
                  {project.techStack?.length > 0 && (
                    <Badge variant="outline" className="text-xs font-normal">
                      {project.techStack[0]}
                    </Badge>
                  )}
                </div>

                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progreso</span>
                    <span className="font-medium">{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} className="h-2" />
                </div>

                {/* Metadata */}
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  {project.deadline && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(project.deadline)}
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <CheckSquare className="h-3.5 w-3.5" />
                    {project._count.tasks} tareas
                  </div>
                </div>

                {/* Project Members Avatars */}
                {project.projectMembers && project.projectMembers.length > 0 && (
                  <div className="flex items-center gap-2">
                    <TooltipProvider>
                      <div className="flex -space-x-2">
                        {project.projectMembers.slice(0, 3).map((pm) => (
                          <Tooltip key={pm.user.id}>
                            <TooltipTrigger asChild>
                              <Avatar className="h-7 w-7 border-2 border-background">
                                <AvatarImage src={pm.user.image || undefined} />
                                <AvatarFallback className="text-xs">
                                  {getInitials(pm.user.name)}
                                </AvatarFallback>
                              </Avatar>
                            </TooltipTrigger>
                            <TooltipContent>{pm.user.name}</TooltipContent>
                          </Tooltip>
                        ))}
                        {project.projectMembers.length > 3 && (
                          <div className="h-7 w-7 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
                            +{project.projectMembers.length - 3}
                          </div>
                        )}
                      </div>
                    </TooltipProvider>
                  </div>
                )}

                {/* Budget (if exists) */}
                {project.budget && (
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Presupuesto</span>
                      <span className="font-medium">
                        {formatCurrency(project.spent, project.currency)} /{" "}
                        {formatCurrency(project.budget, project.currency)}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando {(page - 1) * pageSize + 1} -{" "}
            {Math.min(page * pageSize, total)} de {total} proyectos
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => updateSearchParams("page", String(page - 1))}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => updateSearchParams("page", String(page + 1))}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar proyecto</AlertDialogTitle>
            <AlertDialogDescription>
              Estas seguro de que quieres eliminar{" "}
              <strong>{projectToDelete?.name}</strong>? Esta accion eliminara
              todas las tareas asociadas y no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
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
