"use client";

import { useEffect, useState } from "react";
import { getAllUsers, toggleSuperAdmin, deleteUser } from "@/actions/admin/users";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, ShieldCheck, Building2, MoreHorizontal } from "lucide-react";
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

interface User {
  id: string;
  name: string;
  email: string;
  image: string | null;
  isSuperAdmin: boolean;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    members: number;
  };
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingUserId, setTogglingUserId] = useState<string | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [superAdminFilter, setSuperAdminFilter] = useState<string>("all");

  useEffect(() => {
    loadUsers();
  }, [search, superAdminFilter]);

  async function loadUsers() {
    setLoading(true);
    const result = await getAllUsers({
      search: search || undefined,
      isSuperAdmin:
        superAdminFilter === "all"
          ? undefined
          : superAdminFilter === "true",
    });

    if (result.success && "data" in result && result.data) {
      setUsers(result.data);
    } else {
      toast.error("error" in result ? result.error : "Error desconocido");
    }
    setLoading(false);
  }

  async function handleToggleSuperAdmin(userId: string, currentStatus: boolean) {
    setTogglingUserId(userId);
    const result = await toggleSuperAdmin(userId);

    if (result.success && "data" in result && result.data) {
      toast.success(result.data.message);
      loadUsers();
    } else {
      toast.error("error" in result ? result.error : "Error desconocido");
    }
    setTogglingUserId(null);
  }

  async function handleDelete(id: string, name: string) {
    setDeletingUserId(id);
    const result = await deleteUser(id);

    if (result.success) {
      toast.success(result.data?.message || "Usuario eliminado");
      loadUsers();
    } else {
      toast.error(result.error);
    }
    setDeletingUserId(null);
  }

  function getInitials(name: string) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Usuarios</h1>
        <p className="text-muted-foreground">
          Gestiona todos los usuarios del SaaS
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
                  placeholder="Buscar por nombre o email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <select
              value={superAdminFilter}
              onChange={(e) => setSuperAdminFilter(e.target.value)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="all">Todos los usuarios</option>
              <option value="true">Solo superadmins</option>
              <option value="false">Excluir superadmins</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>{users.length} Usuarios</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Cargando...
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No se encontraron usuarios
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Superadmin</TableHead>
                  <TableHead>Organizaciones</TableHead>
                  <TableHead>Verificado</TableHead>
                  <TableHead>Registrado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          {user.image ? (
                            <AvatarImage src={user.image} alt={user.name} />
                          ) : (
                            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                          )}
                        </Avatar>
                        <span className="font-medium">{user.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.email}
                    </TableCell>
                    <TableCell>
                      {user.isSuperAdmin && (
                        <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200">
                          <ShieldCheck className="h-3 w-3 mr-1" />
                          Superadmin
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        {user._count.members}
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.emailVerified ? (
                        <Badge className="bg-green-100 text-green-800">
                          Verificado
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Pendiente</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString("es-ES")}
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
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem
                                className={
                                  user.isSuperAdmin
                                    ? "text-destructive"
                                    : ""
                                }
                                onSelect={(e) => e.preventDefault()}
                              >
                                {user.isSuperAdmin
                                  ? "Revocar superadmin"
                                  : "Hacer superadmin"}
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  {user.isSuperAdmin
                                    ? "¿Revocar superadmin?"
                                    : "¿Hacer superadmin?"}
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  {user.isSuperAdmin
                                    ? `Revocarás los privilegios de superadmin a <strong>${user.name}</strong>`
                                    : `Otorgarás privilegios de superadmin a <strong>${user.name}</strong>. Esta acción permite gestionar todas las organizaciones del SaaS.`}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel disabled={togglingUserId === user.id}>
                                  Cancelar
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    handleToggleSuperAdmin(
                                      user.id,
                                      user.isSuperAdmin
                                    )
                                  }
                                  disabled={togglingUserId === user.id}
                                  className={
                                    user.isSuperAdmin
                                      ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      : ""
                                  }
                                >
                                  {togglingUserId === user.id ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Procesando...
                                    </>
                                  ) : user.isSuperAdmin ? (
                                    "Revocar"
                                  ) : (
                                    "Hacer superadmin"
                                  )}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>

                          <DropdownMenuSeparator />

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem
                                className="text-destructive"
                                onSelect={(e) => e.preventDefault()}
                              >
                                Eliminar usuario
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  ¿Eliminar usuario?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción eliminará permanentemente al usuario <strong>{user.name}</strong> y todos sus datos. Esta acción no se puede deshacer.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel disabled={deletingUserId === user.id}>
                                  Cancelar
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(user.id, user.name)}
                                  disabled={deletingUserId === user.id}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  {deletingUserId === user.id ? (
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
