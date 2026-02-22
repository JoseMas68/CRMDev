"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Building2, ArrowRight, Search, Users } from "lucide-react";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

interface OrgSelectorProps {
  userId: string;
  userName: string;
}

export function OrgSelector({ userId, userName }: OrgSelectorProps) {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectingOrgId, setSelectingOrgId] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

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

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();

    if (!searchQuery.trim()) {
      toast.error("Ingresa un nombre para buscar");
      return;
    }

    setIsSearching(true);
    setHasSearched(true);

    try {
      const response = await fetch(`/api/organizations/search?q=${encodeURIComponent(searchQuery.trim())}`);
      const data = await response.json();

      if (data.success) {
        setSearchResults(data.organizations || []);
      } else {
        toast.error(data.error || "Error al buscar organizaciones");
        setSearchResults([]);
      }
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Error al buscar organizaciones");
      setSearchResults([]);
    } finally {
      setIsSearching(false);
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

  return (
    <Tabs defaultValue={organizations.length > 0 ? "existing" : "create"} className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="existing">
          Mis Organizaciones
        </TabsTrigger>
        <TabsTrigger value="create">
          Crear Nueva
        </TabsTrigger>
        <TabsTrigger value="join">
          Buscar y Unirse
        </TabsTrigger>
      </TabsList>

      {/* Existing Organizations */}
      <TabsContent value="existing" className="space-y-4">
        {organizations.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                No tienes organizaciones todavía. <br />
                Crea una nueva o busca una existente para unirte.
              </p>
            </CardContent>
          </Card>
        ) : (
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
        )}
      </TabsContent>

      {/* Create New Organization */}
      <TabsContent value="create">
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

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Plus className="mr-2 h-4 w-4" />
                Crear organizacion
              </Button>
            </form>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Join Existing Organization */}
      <TabsContent value="join" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Buscar organizacion</CardTitle>
            <CardDescription>
              Busca organizaciones existentes y solicita unirte a ellas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Nombre de la organizacion..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  disabled={isSearching}
                />
                <Button type="submit" disabled={isSearching}>
                  {isSearching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </form>

            {hasSearched && (
              <div className="mt-4 space-y-3">
                {searchResults.length === 0 ? (
                  <div className="text-center py-8">
                    <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      No se encontraron organizaciones con ese nombre
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Se encontraron {searchResults.length} organización(es)
                    </p>
                    {searchResults.map((org: any) => (
                      <div
                        key={org.id}
                        className="flex items-center gap-4 p-4 rounded-lg border"
                      >
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{org.name}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {org._count?.member || 0} miembros
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => {
                            toast.info(`Para unirte a ${org.name}, pide a un miembro que te envíe una invitación`);
                          }}
                        >
                          Solicitar acceso
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
