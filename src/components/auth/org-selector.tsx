"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Building2, ArrowRight } from "lucide-react";
import { toast } from "sonner";

import { useListOrganizations, organization } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface OrgSelectorProps {
  userId: string;
  userName: string;
}

export function OrgSelector({ userId, userName }: OrgSelectorProps) {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const [selectingOrgId, setSelectingOrgId] = useState<string | null>(null);

  // Fetch user's organizations
  const { data: orgsData, isPending: isLoadingOrgs, refetch } = useListOrganizations();
  const organizations = orgsData || [];

  async function handleCreateOrg(e: React.FormEvent) {
    e.preventDefault();

    if (!newOrgName.trim()) {
      toast.error("El nombre de la organizacion es requerido");
      return;
    }

    setIsLoading(true);

    try {
      const result = await organization.create({
        name: newOrgName.trim(),
        slug: newOrgName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
      });

      if (result.error) {
        toast.error(result.error.message || "Error al crear la organizacion");
        return;
      }

      // Set as active organization
      if (result.data?.id) {
        await organization.setActive({ organizationId: result.data.id });
      }

      toast.success("Organizacion creada correctamente");
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      console.error("Create org error:", error);
      toast.error("Error al crear la organizacion");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSelectOrg(orgId: string) {
    setSelectingOrgId(orgId);

    try {
      await organization.setActive({ organizationId: orgId });
      toast.success("Organizacion seleccionada");
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      console.error("Select org error:", error);
      toast.error("Error al seleccionar la organizacion");
    } finally {
      setSelectingOrgId(null);
    }
  }

  // Show create form if no organizations
  if (isLoadingOrgs) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Create new organization form
  if (isCreating || organizations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Crear nueva organizacion</CardTitle>
          <CardDescription>
            {organizations.length === 0
              ? "Crea tu primera organizacion para comenzar a usar CRMDev"
              : "Agrega una nueva organizacion a tu cuenta"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateOrg} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="orgName">Nombre de la organizacion</Label>
              <Input
                id="orgName"
                placeholder="Mi Empresa"
                value={newOrgName}
                onChange={(e) => setNewOrgName(e.target.value)}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Puedes usar el nombre de tu empresa, equipo o proyecto
              </p>
            </div>

            <div className="flex gap-3">
              <Button type="submit" className="flex-1" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Crear organizacion
              </Button>
              {organizations.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreating(false)}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }

  // List existing organizations
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Tus organizaciones</CardTitle>
          <CardDescription>
            Selecciona una organizacion para continuar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {organizations.map((org) => (
            <button
              key={org.id}
              onClick={() => handleSelectOrg(org.id)}
              disabled={selectingOrgId !== null}
              className="w-full flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors text-left disabled:opacity-50"
            >
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
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
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{org.name}</p>
                <p className="text-sm text-muted-foreground truncate">
                  {org.slug}
                </p>
              </div>
              {selectingOrgId === org.id ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              ) : (
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              )}
            </button>
          ))}
        </CardContent>
      </Card>

      <Button
        variant="outline"
        className="w-full"
        onClick={() => setIsCreating(true)}
      >
        <Plus className="mr-2 h-4 w-4" />
        Crear nueva organizacion
      </Button>
    </div>
  );
}
