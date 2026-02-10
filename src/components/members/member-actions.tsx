"use client";

import { useState } from "react";
import {
  MoreHorizontal,
  Shield,
  ShieldCheck,
  UserMinus,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

import { organization } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
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

interface MemberActionsProps {
  memberId: string;
  memberUserId: string;
  memberName: string;
  memberRole: string;
  organizationId: string;
  currentUserRole: string;
  currentUserId: string;
  onSuccess?: () => void;
}

export function MemberActions({
  memberId,
  memberUserId,
  memberName,
  memberRole,
  organizationId,
  currentUserRole,
  currentUserId,
  onSuccess,
}: MemberActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);

  const isOwner = memberRole === "owner";
  const isSelf = memberUserId === currentUserId;
  const canManage =
    (currentUserRole === "owner" || currentUserRole === "admin") &&
    !isOwner &&
    !isSelf;

  if (!canManage) return null;

  async function handleChangeRole(newRole: "admin" | "member") {
    setIsLoading(true);
    try {
      const result = await organization.updateMemberRole({
        memberId,
        role: newRole,
        organizationId,
      });

      if (result.error) {
        toast.error(result.error.message || "Error al cambiar el rol");
        return;
      }

      toast.success(`Rol de ${memberName} actualizado a ${newRole === "admin" ? "Administrador" : "Miembro"}`);
      onSuccess?.();
    } catch (error) {
      toast.error("Error al cambiar el rol");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRemove() {
    setIsLoading(true);
    try {
      const result = await organization.removeMember({
        memberIdOrEmail: memberId,
        organizationId,
      });

      if (result.error) {
        toast.error(result.error.message || "Error al eliminar miembro");
        return;
      }

      toast.success(`${memberName} ha sido eliminado de la organización`);
      setShowRemoveDialog(false);
      onSuccess?.();
    } catch (error) {
      toast.error("Error al eliminar miembro");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MoreHorizontal className="h-4 w-4" />
            )}
            <span className="sr-only">Acciones</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {memberRole === "member" && (
            <DropdownMenuItem onClick={() => handleChangeRole("admin")}>
              <ShieldCheck className="mr-2 h-4 w-4" />
              Hacer administrador
            </DropdownMenuItem>
          )}
          {memberRole === "admin" && (
            <DropdownMenuItem onClick={() => handleChangeRole("member")}>
              <Shield className="mr-2 h-4 w-4" />
              Cambiar a miembro
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setShowRemoveDialog(true)}
            className="text-destructive focus:text-destructive"
          >
            <UserMinus className="mr-2 h-4 w-4" />
            Eliminar miembro
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar miembro</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que quieres eliminar a <strong>{memberName}</strong> de la organización? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
