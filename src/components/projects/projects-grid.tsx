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
  FolderKanban,
  Users,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

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
  NOT_STARTED: "bg-gray-500 text-white",
  IN_PROGRESS: "bg-blue-500 text-white",
  ON_HOLD: "bg-yellow-500 text-white",
  COMPLETED: "bg-green-500 text-white",
  CANCELLED: "bg-red-500 text-white",
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
      <div className="flex flex-col gap-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
            <Input
              placeholder="Buscar proyectos..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="pl-9 sm:pl-12 h-10 sm:h-14 text-sm sm:text-lg"
            />
          </div>
          <Button type="submit" className="h-10 sm:h-14 px-4 sm:px-6">
            Buscar
          </Button>
        </form>

        <div className="flex gap-2 overflow-x-auto pb-2">
          <Select
            value={currentStatus || "all"}
            onValueChange={handleStatusChange}
          >
            <SelectTrigger className="w-full h-10 sm:h-14">
              <Filter className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
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
            <Button variant="outline" onClick={clearFilters} className="flex-shrink-0 h-10 sm:h-14">
              <X className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              Limpiar
            </Button>
          )}
        </div>
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <FolderKanban className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">
            {hasFilters
              ? "No se encontraron proyectos con estos filtros"
              : "No hay proyectos aun. Crea el primero."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project, index) => (
            <ProjectCard
              key={project.id}
              project={project}
              index={index}
              onDelete={() => {
                setProjectToDelete(project);
                setDeleteDialogOpen(true);
              }}
            />
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

// Mobile-first Project Card
function ProjectCard({
  project,
  index,
  onDelete,
}: {
  project: Project;
  index: number;
  onDelete: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      {/* MOBILE: Full card design */}
      <Link href={`/projects/${project.id}`} className="block md:hidden">
        <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-5 shadow-lg border border-gray-200 dark:border-gray-700 active:scale-[0.98] transition-transform">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-1">
                {project.name}
              </h3>
              {project.client && (
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {project.client.name}
                </p>
              )}
            </div>
            <ChevronRight className="h-6 w-6 text-gray-400 flex-shrink-0" />
          </div>

          {/* Status badge */}
          <div className="mb-4">
            <Badge
              className={cn(
                "text-sm font-bold px-4 py-2 rounded-full shadow-sm",
                statusColors[project.status]
              )}
            >
              {statusLabels[project.status]}
            </Badge>
          </div>

          {/* Progress */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-600 dark:text-gray-400">Progreso</span>
              <span className="font-bold text-lg text-gray-900 dark:text-white">
                {project.progress}%
              </span>
            </div>
            <Progress value={project.progress} className="h-3" />
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-gray-100 dark:bg-gray-700 rounded-xl p-3">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
                <CheckSquare className="h-4 w-4" />
                <span className="text-xs">Tareas</span>
              </div>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {project._count.tasks}
              </p>
            </div>

            {project.deadline && (
              <div className="bg-gray-100 dark:bg-gray-700 rounded-xl p-3">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
                  <Calendar className="h-4 w-4" />
                  <span className="text-xs">Fecha límite</span>
                </div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  {formatDate(project.deadline)}
                </p>
              </div>
            )}
          </div>

          {/* Team members */}
          {project.projectMembers && project.projectMembers.length > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <div className="flex -space-x-3">
                {project.projectMembers.slice(0, 3).map((pm) => (
                  <Avatar key={pm.user.id} className="h-10 w-10 border-2 border-background">
                    <AvatarImage src={pm.user.image || undefined} />
                    <AvatarFallback className="text-sm font-semibold">
                      {getInitials(pm.user.name)}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {project.projectMembers.length > 3 && (
                  <div className="h-10 w-10 rounded-full border-2 border-background bg-primary flex items-center justify-center text-sm font-bold text-primary-foreground">
                    +{project.projectMembers.length - 3}
                  </div>
                )}
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                {project.projectMembers.length === 1
                  ? "1 miembro"
                  : `${project.projectMembers.length} miembros`}
              </span>
            </div>
          )}

          {/* Tech stack */}
          {project.techStack && project.techStack.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {project.techStack.slice(0, 3).map((tech) => (
                <span
                  key={tech}
                  className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-xs font-semibold"
                >
                  {tech}
                </span>
              ))}
              {project.techStack.length > 3 && (
                <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-xs font-semibold">
                  +{project.techStack.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </Link>

      {/* DESKTOP: Original card design */}
      <div className="hidden md:block">
        <Card className="dashboard-card group hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start justify-between w-full">
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
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
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
                      onClick={onDelete}
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
      </div>
    </motion.div>
  );
}
