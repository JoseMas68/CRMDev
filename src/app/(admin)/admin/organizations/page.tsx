"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAllOrganizations, deleteOrganization } from "@/actions/admin/organizations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Building2, Users, Briefcase, CheckSquare, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
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
import { Loader2 } from "lucide-react";

interface Organization {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  plan: string;
  createdAt: Date;
  updatedAt: Date;
  owner: {
    name: string;
    email: string;
  } | null;
  members: number;
  clients: number;
  projects: number;
  tasks: number;
}

export default function OrganizationsPage() {
  const router = useRouter();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState<string>("all");

  useEffect(() => {
    loadOrganizations();
  }, [search, planFilter]);

  async function loadOrganizations() {
    setLoading(true);
    const result = await getAllOrganizations({
      search: search || undefined,
      plan: planFilter === "all" ? undefined : planFilter,
    });

    if (result.success) {
      setOrganizations(result.data);
    } else {
      toast.error(result.error);
    }
    setLoading(false);
  }

  async function handleDelete(id: string, name: string) {
    setDeletingId(id);
    const result = await deleteOrganization(id);

    if (result.success) {
      toast.success(`Organización "${name}" eliminada`);
      loadOrganizations();
    } else {
      toast.error(result.error);
    }
    setDeletingId(null);
  }

  function getPlanBadgeColor(plan: string) {
    switch (plan) {
      case "FREE":
        return "bg-gray-100 text-gray-800 hover:bg-gray-200";
      case "PRO":
        return "bg-blue-100 text-blue-800 hover:bg-blue-200";
      case "ENTERPRISE":
        return "bg-purple-100 text-purple-800 hover:bg-purple-200";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }

  function isActive(updatedAt: Date) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return new Date(updatedAt) > thirtyDaysAgo;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Organizaciones</h1>
        <p className="text-muted-foreground">
          Gestiona todas las organizaciones del SaaS
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre o slug..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="all">Todos los planes</option>
              <option value="FREE">Free</option>
              <option value="PRO">Pro</option>
              <option value="ENTERPRISE">Enterprise</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {organizations.length} Organizaciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Cargando...
            </div>
          ) : organizations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No se encontraron organizaciones
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organización</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Miembros</TableHead>
                  <TableHead>Entidades</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Creado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {organizations.map((org) => (
                  <TableRow key={org.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">{org.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {org.slug}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p className="font-medium">{org.owner?.name}</p>
                        <p className="text-muted-foreground">
                          {org.owner?.email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPlanBadgeColor(org.plan)}>
                        {org.plan}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        {org.members}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm space-y-1">
                        <div className="flex items-center gap-1">
                          <Briefcase className="h-3 w-3 text-muted-foreground" />
                          {org.clients} clients
                        </div>
                        <div className="flex items-center gap-1">
                          <CheckSquare className="h-3 w-3 text-muted-foreground" />
                          {org.projects} projects
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={isActive(org.updatedAt) ? "default" : "secondary"}
                      >
                        {isActive(org.updatedAt) ? "Activa" : "Inactiva"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(org.createdAt).toLocaleDateString("es-ES")}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() =>
                              router.push(`/admin/organizations/${org.id}`)
                            }
                          >
                            Ver detalles
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">
                            Suspender
                          </DropdownMenuItem>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem
                                className="text-destructive"
                                onSelect={(e) => e.preventDefault()}
                              >
                                Eliminar
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  ¿Eliminar organización?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción eliminará permanentemente la
                                  organización <strong>{org.name}</strong> y todos
                                  sus datos (clientes, proyectos, tareas, etc.).
                                  Esta acción no se puede deshacer.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(org.id, org.name)}
                                  disabled={deletingId === org.id}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  {deletingId === org.id ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Eliminando...
                                    </>
                                  ) : (
                                    "Eliminar"
                                  )}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
