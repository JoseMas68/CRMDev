"use client";

import { UserPlus, Users, Mail, Crown, ShieldCheck, User } from "lucide-react";
import { useActiveOrganization, useSession } from "@/lib/auth-client";
import { getInitials, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { InviteMemberDialog } from "./invite-member-dialog";
import { MemberActions } from "./member-actions";
import { InvitationActions } from "./invitation-actions";

const ROLE_CONFIG: Record<string, { label: string; icon: typeof Crown; className: string }> = {
  owner: {
    label: "Propietario",
    icon: Crown,
    className: "bg-violet-500/20 text-violet-400",
  },
  admin: {
    label: "Administrador",
    icon: ShieldCheck,
    className: "bg-blue-500/20 text-blue-400",
  },
  member: {
    label: "Miembro",
    icon: User,
    className: "bg-gray-500/20 text-gray-400",
  },
};

export function MembersPage() {
  const { data: activeOrg, refetch } = useActiveOrganization();
  const { data: sessionData } = useSession();

  const members = activeOrg?.members || [];
  const invitations = (activeOrg?.invitations || []).filter(
    (inv: any) => inv.status === "pending"
  );

  const currentUserId = sessionData?.user?.id || "";
  const currentMember = members.find((m: any) => m.userId === currentUserId);
  const currentUserRole = currentMember?.role || "member";
  const canInvite = currentUserRole === "owner" || currentUserRole === "admin";

  function handleRefresh() {
    refetch();
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Equipo</h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Gestiona los miembros de tu organización
          </p>
        </div>

        {canInvite && activeOrg && (
          <InviteMemberDialog
            organizationId={activeOrg.id}
            onSuccess={handleRefresh}
          >
            <Button className="w-full sm:w-auto">
              <UserPlus className="mr-2 h-4 w-4" />
              Invitar
            </Button>
          </InviteMemberDialog>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="members">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="members" className="gap-2 flex-1 sm:flex-none">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Miembros</span>
            ({members.length})
          </TabsTrigger>
          <TabsTrigger value="invitations" className="gap-2 flex-1 sm:flex-none">
            <Mail className="h-4 w-4" />
            <span className="hidden sm:inline">Invitaciones</span>
            ({invitations.length})
          </TabsTrigger>
        </TabsList>

        {/* Members Tab */}
        <TabsContent value="members" className="mt-4">
          {members.length === 0 ? (
            <div className="rounded-lg border p-8 text-center text-muted-foreground">
              No hay miembros en esta organización
            </div>
          ) : (
            <div className="space-y-2">
              {members.map((member: any) => {
                const roleConfig = ROLE_CONFIG[member.role] || ROLE_CONFIG.member;
                const RoleIcon = roleConfig.icon;
                return (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                  >
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarImage
                        src={member.user?.image || undefined}
                        alt={member.user?.name}
                      />
                      <AvatarFallback>
                        {getInitials(member.user?.name || "?")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-sm">
                        {member.user?.name}
                        {member.userId === currentUserId && (
                          <span className="text-xs text-muted-foreground ml-2">(tú)</span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground truncate sm:hidden">
                        {roleConfig.label}
                      </p>
                      <p className="text-xs text-muted-foreground hidden sm:block">
                        {member.user?.email}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`gap-1 ${roleConfig.className} border-transparent flex-shrink-0 hidden sm:flex`}
                    >
                      <RoleIcon className="h-3 w-3" />
                      {roleConfig.label}
                    </Badge>
                    <MemberActions
                      memberId={member.id}
                      memberUserId={member.userId}
                      memberName={member.user?.name || ""}
                      memberRole={member.role}
                      organizationId={activeOrg!.id}
                      currentUserRole={currentUserRole}
                      currentUserId={currentUserId}
                      onSuccess={handleRefresh}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Invitations Tab */}
        <TabsContent value="invitations" className="mt-4">
          {invitations.length === 0 ? (
            <div className="rounded-lg border p-8 text-center text-muted-foreground">
              No hay invitaciones pendientes
            </div>
          ) : (
            <div className="space-y-2">
              {invitations.map((invitation: any) => {
                const roleConfig = ROLE_CONFIG[invitation.role] || ROLE_CONFIG.member;
                const RoleIcon = roleConfig.icon;
                return (
                  <div
                    key={invitation.id}
                    className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-sm">{invitation.email}</p>
                      <p className="text-xs text-muted-foreground truncate sm:hidden">
                        {roleConfig.label}
                      </p>
                      <p className="text-xs text-muted-foreground hidden sm:block">
                        Expira: {formatDate(invitation.expiresAt)}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`gap-1 ${roleConfig.className} border-transparent flex-shrink-0 hidden sm:flex`}
                    >
                      <RoleIcon className="h-3 w-3" />
                      {roleConfig.label}
                    </Badge>
                    {canInvite && (
                      <InvitationActions
                        invitationId={invitation.id}
                        email={invitation.email}
                        onSuccess={handleRefresh}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
