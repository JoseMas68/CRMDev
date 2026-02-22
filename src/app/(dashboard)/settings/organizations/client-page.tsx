"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Building2, MoreHorizontal, Trash2, Edit } from "lucide-react";
import { toast } from "sonner";
import {
    organization,
    useActiveOrganization,
    useListOrganizations,
} from "@/lib/auth-client";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export function OrganizationsClient() {
    const router = useRouter();
    const { data: activeOrg } = useActiveOrganization();
    const { data: organizations, isPending: isLoading, refetch } = useListOrganizations();

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isUpdateOpen, setIsUpdateOpen] = useState(false);
    const [deleteOrgId, setDeleteOrgId] = useState<string | null>(null);

    // Form states
    const [name, setName] = useState("");
    const [slug, setSlug] = useState("");
    const [logo, setLogo] = useState("");
    const [updateOrgTarget, setUpdateOrgTarget] = useState<{ id: string, name: string, slug: string, logo?: string | null } | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const generateSlug = (value: string) => {
        return value
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)+/g, "");
    };

    const handleCreateOrg = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !slug) return;

        setIsSubmitting(true);
        try {
            await organization.create({
                name,
                slug,
                logo: logo || undefined,
            });

            toast.success("Organización creada exitosamente");
            setIsCreateOpen(false);
            setName("");
            setSlug("");
            setLogo("");
            refetch();
            // Optional: switch active org
            // router.refresh();
        } catch (error) {
            toast.error("Error al crear la organización");
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateOrg = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !updateOrgTarget) return;

        setIsSubmitting(true);
        try {
            await organization.update({
                organizationId: updateOrgTarget.id,
                data: {
                    name,
                    slug,
                    logo: logo || undefined,
                }
            });

            toast.success("Organización actualizada exitosamente");
            setIsUpdateOpen(false);
            setUpdateOrgTarget(null);
            refetch();
        } catch (error) {
            toast.error("Error al actualizar la organización");
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteOrg = async () => {
        if (!deleteOrgId) return;

        setIsSubmitting(true);
        try {
            await organization.delete({
                organizationId: deleteOrgId,
            });

            toast.success("Organización eliminada");
            setDeleteOrgId(null);
            refetch();

            // If we deleted the active org, we should redirect to selection
            if (activeOrg?.id === deleteOrgId) {
                window.location.href = "/select-org";
            }
        } catch (error) {
            toast.error("Error al eliminar la organización");
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const openUpdateDialog = (org: { id: string, name: string, slug: string, logo?: string | null }) => {
        setUpdateOrgTarget(org);
        setName(org.name);
        setSlug(org.slug);
        setLogo(org.logo || "");
        setIsUpdateOpen(true);
    };

    if (isLoading) {
        return (
            <div className="grid gap-4 md:grid-cols-2">
                <Card className="animate-pulse h-[160px] bg-muted/50"></Card>
                <Card className="animate-pulse h-[160px] bg-muted/50"></Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h4 className="text-sm font-medium text-muted-foreground">
                    Cuentas ({organizations?.length || 0})
                </h4>

                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm">
                            <Plus className="mr-2 h-4 w-4" />
                            Nueva Organización
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <form onSubmit={handleCreateOrg}>
                            <DialogHeader>
                                <DialogTitle>Crear organización</DialogTitle>
                                <DialogDescription>
                                    Crea un nuevo espacio de trabajo para tu equipo o clientes.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Nombre</Label>
                                    <Input
                                        id="name"
                                        value={name}
                                        onChange={(e) => {
                                            setName(e.target.value);
                                            setSlug(generateSlug(e.target.value));
                                        }}
                                        placeholder="Acme Corp"
                                        required
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="slug">Identificador (Slug)</Label>
                                    <Input
                                        id="slug"
                                        value={slug}
                                        onChange={(e) => setSlug(e.target.value)}
                                        placeholder="acme-corp"
                                        required
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="logo">URL del Logo (Opcional)</Label>
                                    <Input
                                        id="logo"
                                        value={logo}
                                        onChange={(e) => setLogo(e.target.value)}
                                        placeholder="https://ejemplo.com/logo.png"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" type="button" onClick={() => setIsCreateOpen(false)}>
                                    Cancelar
                                </Button>
                                <Button type="submit" disabled={isSubmitting || !name || !slug}>
                                    {isSubmitting ? "Creando..." : "Crear"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {organizations?.map((org) => {
                    const isActive = activeOrg?.id === org.id;
                    const isOwner = (org as any).role === "owner" || (org as any).role === "admin"; // Check better-auth role

                    return (
                        <Card key={org.id} className={isActive ? "border-primary" : ""}>
                            <CardHeader className="p-4 pb-2">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                            {org.logo ? (
                                                <img
                                                    src={org.logo}
                                                    alt={org.name}
                                                    className="h-10 w-10 rounded-lg object-cover"
                                                />
                                            ) : (
                                                <Building2 className="h-5 w-5 text-primary" />
                                            )}
                                        </div>
                                        <div>
                                            <CardTitle className="text-base flex items-center gap-2">
                                                {org.name}
                                                {isActive && (
                                                    <Badge variant="default" className="text-[10px] px-1.5 h-4">
                                                        Activa
                                                    </Badge>
                                                )}
                                            </CardTitle>
                                            <CardDescription className="text-xs">
                                                {org.slug}
                                            </CardDescription>
                                        </div>
                                    </div>

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 -m-2">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>

                                            {!isActive && (
                                                <DropdownMenuItem
                                                    onClick={async () => {
                                                        await organization.setActive({ organizationId: org.id });
                                                        window.location.href = "/dashboard";
                                                    }}
                                                >
                                                    <Building2 className="mr-2 h-4 w-4" />
                                                    Cambiar a esta org
                                                </DropdownMenuItem>
                                            )}

                                            {isOwner && (
                                                <>
                                                    <DropdownMenuItem onClick={() => openUpdateDialog(org)}>
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        Editar detalles
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        className="text-destructive focus:text-destructive"
                                                        onClick={() => setDeleteOrgId(org.id)}
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Eliminar
                                                    </DropdownMenuItem>
                                                </>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 pt-2">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                                    <Badge variant="secondary" className="capitalize">
                                        {(org as any).role || "member"}
                                    </Badge>
                                    <span>Membro desde {new Date(org.createdAt).toLocaleDateString()}</span>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Delete Confirmation */}
            <AlertDialog open={!!deleteOrgId} onOpenChange={(open) => !open && setDeleteOrgId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar organización?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción es irreversible. Se eliminarán permanentemente todos
                            los datos, proyectos, clientes y tareas asociados a este espacio
                            de trabajo.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isSubmitting}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteOrg}
                            disabled={isSubmitting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isSubmitting ? "Eliminando..." : "Eliminar Permanentemente"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Update Dialog */}
            <Dialog open={isUpdateOpen} onOpenChange={setIsUpdateOpen}>
                <DialogContent>
                    <form onSubmit={handleUpdateOrg}>
                        <DialogHeader>
                            <DialogTitle>Editar organización</DialogTitle>
                            <DialogDescription>
                                Modifica los detalles básicos de este espacio de trabajo.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="edit-name">Nombre</Label>
                                <Input
                                    id="edit-name"
                                    value={name}
                                    onChange={(e) => {
                                        setName(e.target.value);
                                    }}
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-slug">Identificador (Slug)</Label>
                                <Input
                                    id="edit-slug"
                                    value={slug}
                                    onChange={(e) => setSlug(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-logo">URL del Logo (Opcional)</Label>
                                <Input
                                    id="edit-logo"
                                    value={logo}
                                    onChange={(e) => setLogo(e.target.value)}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" type="button" onClick={() => setIsUpdateOpen(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isSubmitting || !name || !slug}>
                                {isSubmitting ? "Guardando..." : "Guardar Cambios"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
