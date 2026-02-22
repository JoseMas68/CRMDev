"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Copy, Plus, Trash2, KeyRound, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

import { createApiKey, deleteApiKey } from "@/actions/api-keys";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
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
import { Badge } from "@/components/ui/badge";

interface ApiKey {
    id: string;
    name: string;
    key: string;
    createdAt: Date;
    lastUsedAt: Date | null;
    user: {
        name: string;
        image: string | null;
    };
}

interface ApiKeysClientPageProps {
    initialKeys: ApiKey[];
    canManageKeys: boolean;
}

export function ApiKeysClientPage({ initialKeys, canManageKeys }: ApiKeysClientPageProps) {
    const [keys, setKeys] = useState(initialKeys);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [newKeyName, setNewKeyName] = useState("");
    const [createdToken, setCreatedToken] = useState<string | null>(null);

    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        if (!newKeyName.trim()) return;

        setIsCreating(true);
        try {
            const res = await createApiKey(newKeyName.trim());
            if (res.success && res.data) {
                setCreatedToken(res.data.key);
                setKeys([res.data as unknown as ApiKey, ...keys]);
                toast.success("API Key generada correctamente");
            } else {
                toast.error(res.error || "Error al crear la API Key");
            }
        } catch (error) {
            toast.error("Error inesperado al crear");
        } finally {
            setIsCreating(false);
        }
    }

    function handleCloseCreate() {
        setIsCreateOpen(false);
        setNewKeyName("");
        setCreatedToken(null);
    }

    async function copyToClipboard(text: string) {
        await navigator.clipboard.writeText(text);
        toast.success("Copiado al portapapeles");
    }

    async function confirmDelete() {
        if (!deleteId) return;
        setIsDeleting(true);
        try {
            const res = await deleteApiKey(deleteId);
            if (res.success) {
                setKeys(keys.filter((k) => k.id !== deleteId));
                toast.success("API Key eliminada");
            } else {
                toast.error(res.error || "Error al eliminar");
            }
        } catch (error) {
            toast.error("Error inesperado al eliminar");
        } finally {
            setIsDeleting(false);
            setDeleteId(null);
        }
    }

    if (!canManageKeys) {
        return (
            <Card>
                <CardContent className="py-8 flex flex-col items-center">
                    <AlertTriangle className="h-10 w-10 text-destructive mb-4" />
                    <h3 className="font-semibold text-lg">Acceso Denegado</h3>
                    <p className="text-muted-foreground mt-2">
                        Solo los administradores o propietarios pueden gestionar las API Keys de esta organización.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <div className="flex justify-end mb-6">
                <Button onClick={() => setIsCreateOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Crear nueva API Key
                </Button>
            </div>

            <div className="space-y-4">
                {keys.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 flex flex-col items-center justify-center text-center text-muted-foreground">
                            <KeyRound className="h-12 w-12 opacity-20 mb-4" />
                            <p>No se han generado llaves de API todavía.</p>
                            <p className="text-sm mt-1">Crea la primera para conectar a Claude o ChatGPT.</p>
                        </CardContent>
                    </Card>
                ) : (
                    keys.map((apiKey) => (
                        <Card key={apiKey.id}>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <div>
                                    <CardTitle className="text-base font-semibold">{apiKey.name}</CardTitle>
                                    <CardDescription>
                                        Creada por {apiKey.user.name} el {format(new Date(apiKey.createdAt), "dd/MM/yyyy")}
                                    </CardDescription>
                                </div>
                                <div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                        onClick={() => setDeleteId(apiKey.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between bg-muted/50 p-3 rounded-lg border">
                                    <div className="font-mono text-sm text-muted-foreground mr-4">
                                        {apiKey.key.substring(0, 8)}••••••••••••••••
                                    </div>
                                    <Badge variant="outline" className="text-xs">
                                        {apiKey.lastUsedAt ? `Último uso: ${format(new Date(apiKey.lastUsedAt), "dd/MM/yy")}` : "Nunca usada"}
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Creación Modal */}
            <Dialog open={isCreateOpen} onOpenChange={isCreateOpen ? undefined : handleCloseCreate}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Añadir nueva API Key</DialogTitle>
                        <DialogDescription>
                            Usa esta llave en clientes MCP (Model Context Protocol). No elimines ni compartas la llave públicamente.
                        </DialogDescription>
                    </DialogHeader>

                    {!createdToken ? (
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nombre de la integración (ej. Claude Desktop)</Label>
                                <Input
                                    id="name"
                                    placeholder="Mi asistente local"
                                    value={newKeyName}
                                    onChange={(e) => setNewKeyName(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={handleCloseCreate} disabled={isCreating}>
                                    Cancelar
                                </Button>
                                <Button type="submit" disabled={isCreating || !newKeyName.trim()}>
                                    {isCreating ? "Generando..." : "Generar Llave"}
                                </Button>
                            </DialogFooter>
                        </form>
                    ) : (
                        <div className="space-y-4 pt-4">
                            <div className="p-3 bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200 text-sm rounded-lg border border-amber-200 dark:border-amber-800">
                                <span className="font-semibold block mb-1">¡Copia esta clave de inmediato!</span>
                                No podrás volver a verla entera por seguridad. Si la pierdes, tendrás que generar otra.
                            </div>

                            <div className="flex gap-2 items-center p-2 bg-muted rounded-md border">
                                <code className="text-sm flex-1 break-all px-2">{createdToken}</code>
                                <Button size="icon" variant="ghost" onClick={() => copyToClipboard(createdToken)}>
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>

                            <DialogFooter className="mt-6">
                                <Button onClick={handleCloseCreate}>
                                    Cerrar
                                </Button>
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Eliminación Modal */}
            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Revocar API Key</AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿Estás seguro de que quieres eliminar esta llave? Cualquier herramienta o IA que esté usándola para MCP dejará de tener acceso inmediatamente.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction disabled={isDeleting} onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            {isDeleting ? "Revocando..." : "Revocar Llave"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
