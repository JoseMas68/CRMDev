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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Equipo</h1>
          <p className="text-muted-foreground">
            Gestiona los miembros de tu organización
          </p>
        </div>

        {canInvite && activeOrg && (
          <InviteMemberDialog
            organizationId={activeOrg.id}
            onSuccess={handleRefresh}
          >
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Invitar miembro
            </Button>
          </InviteMemberDialog>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="members">
        <TabsList>
          <TabsTrigger value="members" className="gap-2">
            <Users className="h-4 w-4" />
            Miembros ({members.length})
          </TabsTrigger>
          <TabsTrigger value="invitations" className="gap-2">
            <Mail className="h-4 w-4" />
            Invitaciones ({invitations.length})
          </TabsTrigger>
        </TabsList>

        {/* Members Tab */}
        <TabsContent value="members">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Miembro</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead className="hidden sm:table-cell">Se unió</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      No hay miembros en esta organización
                    </TableCell>
                  </TableRow>
                ) : (
                  members.map((member: any) => {
                    const roleConfig = ROLE_CONFIG[member.role] || ROLE_CONFIG.member;
                    const RoleIcon = roleConfig.icon;
                    return (
                      <TableRow key={member.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarImage
                                src={member.user?.image || undefined}
                                alt={member.user?.name}
                              />
                              <AvatarFallback>
                                {getInitials(member.user?.name || "?")}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="font-medium truncate">
                                {member.user?.name}
                                {member.userId === currentUserId && (
                                  <span className="text-xs text-muted-foreground ml-2">(tú)</span>
                                )}
                              </p>
                              <p className="text-sm text-muted-foreground truncate">
                                {member.user?.email}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`gap-1 ${roleConfig.className} border-transparent`}
                          >
                            <RoleIcon className="h-3 w-3" />
                            {roleConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground">
                          {formatDate(member.createdAt)}
                        </TableCell>
                        <TableCell>
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
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Invitations Tab */}
        <TabsContent value="invitations">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead className="hidden sm:table-cell">Expira</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      No hay invitaciones pendientes
                    </TableCell>
                  </TableRow>
                ) : (
                  invitations.map((invitation: any) => {
                    const roleConfig = ROLE_CONFIG[invitation.role] || ROLE_CONFIG.member;
                    const RoleIcon = roleConfig.icon;
                    return (
                      <TableRow key={invitation.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <p className="font-medium truncate">{invitation.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`gap-1 ${roleConfig.className} border-transparent`}
                          >
                            <RoleIcon className="h-3 w-3" />
                            {roleConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground">
                          {formatDate(invitation.expiresAt)}
                        </TableCell>
                        <TableCell>
                          {canInvite && (
                            <InvitationActions
                              invitationId={invitation.id}
                              email={invitation.email}
                              onSuccess={handleRefresh}
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
