"use client";

import { useState, useEffect } from "react";
import { UserPlus, X, Loader2, Crown, Shield, Eye, User } from "lucide-react";
import { toast } from "sonner";

import {
  addProjectMember,
  removeProjectMember,
  getAvailableMembersForProject,
} from "@/actions/project-members";
import { getInitials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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

const PROJECT_ROLE_CONFIG: Record<string, { label: string; icon: typeof Crown; className: string }> = {
  lead: {
    label: "Lead",
    icon: Crown,
    className: "bg-green-500/20 text-green-400",
  },
  member: {
    label: "Miembro",
    icon: Shield,
    className: "bg-blue-500/20 text-blue-400",
  },
  viewer: {
    label: "Visor",
    icon: Eye,
    className: "bg-gray-500/20 text-gray-400",
  },
};

interface ProjectMember {
  id: string;
  role: string;
  createdAt: Date;
  user: { id: string; name: string; email: string; image: string | null };
}

interface AvailableMember {
  userId: string;
  name: string;
  email: string;
  image: string | null;
  orgRole: string;
}

interface ManageProjectMembersDialogProps {
  children: React.ReactNode;
  projectId: string;
  currentMembers: ProjectMember[];
  onSuccess?: () => void;
}

export function ManageProjectMembersDialog({
  children,
  projectId,
  currentMembers,
  onSuccess,
}: ManageProjectMembersDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [availableMembers, setAvailableMembers] = useState<AvailableMember[]>([]);
  const [loadingAvailable, setLoadingAvailable] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<string>("member");

  useEffect(() => {
    if (open) {
      loadAvailableMembers();
    }
  }, [open, currentMembers.length]);

  async function loadAvailableMembers() {
    setLoadingAvailable(true);
    try {
      const result = await getAvailableMembersForProject(projectId);
      if (result.success) {
        setAvailableMembers(result.data);
      }
    } catch {
      // silently fail
    } finally {
      setLoadingAvailable(false);
    }
  }

  async function handleAdd() {
    if (!selectedUserId) return;
    setIsLoading(true);
    try {
      const result = await addProjectMember(projectId, selectedUserId, selectedRole);
      if (result.success) {
        toast.success("Miembro añadido al proyecto");
        setSelectedUserId("");
        setSelectedRole("member");
        onSuccess?.();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Error al añadir miembro");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRemove(userId: string, name: string) {
    setRemovingId(userId);
    try {
      const result = await removeProjectMember(projectId, userId);
      if (result.success) {
        toast.success(`${name} eliminado del proyecto`);
        onSuccess?.();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Error al eliminar miembro");
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gestionar acceso al proyecto</DialogTitle>
          <DialogDescription>
            Añade o elimina miembros que pueden ver y trabajar en este proyecto.
          </DialogDescription>
        </DialogHeader>

        {/* Add member section */}
        {availableMembers.length > 0 && (
          <div className="space-y-3 border-b pb-4">
            <p className="text-sm font-medium">Añadir miembro</p>
            <div className="flex gap-2">
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Seleccionar miembro..." />
                </SelectTrigger>
                <SelectContent>
                  {availableMembers.map((m) => (
                    <SelectItem key={m.userId} value={m.userId}>
                      {m.name} ({m.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lead">Lead</SelectItem>
                  <SelectItem value="member">Miembro</SelectItem>
                  <SelectItem value="viewer">Visor</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={handleAdd}
                disabled={!selectedUserId || isLoading}
                size="icon"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        )}

        {loadingAvailable && availableMembers.length === 0 && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Current members list */}
        <div className="space-y-2">
          <p className="text-sm font-medium">
            Miembros del proyecto ({currentMembers.length})
          </p>
          {currentMembers.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No hay miembros asignados
            </p>
          ) : (
            <div className="space-y-2">
              {currentMembers.map((member) => {
                const roleConfig = PROJECT_ROLE_CONFIG[member.role] || PROJECT_ROLE_CONFIG.member;
                const RoleIcon = roleConfig.icon;
                return (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={member.user.image || undefined} />
                      <AvatarFallback>
                        {getInitials(member.user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {member.user.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {member.user.email}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`gap-1 ${roleConfig.className} border-transparent text-xs`}
                    >
                      <RoleIcon className="h-3 w-3" />
                      {roleConfig.label}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemove(member.user.id, member.user.name)}
                      disabled={removingId === member.user.id}
                    >
                      {removingId === member.user.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <X className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
