"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { organization } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

interface InvitationActionsProps {
  invitationId: string;
  email: string;
  onSuccess?: () => void;
}

export function InvitationActions({
  invitationId,
  email,
  onSuccess,
}: InvitationActionsProps) {
  const [isLoading, setIsLoading] = useState(false);

  async function handleCancel() {
    setIsLoading(true);
    try {
      const result = await organization.cancelInvitation({
        invitationId,
      });

      if (result.error) {
        toast.error(result.error.message || "Error al cancelar la invitación");
        return;
      }

      toast.success(`Invitación a ${email} cancelada`);
      onSuccess?.();
    } catch (error) {
      toast.error("Error al cancelar la invitación");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleCancel}
      disabled={isLoading}
      className="text-destructive hover:text-destructive"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <X className="h-4 w-4 mr-1" />
      )}
      Cancelar
    </Button>
  );
}
