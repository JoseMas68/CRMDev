"use client";

import { Users, Settings2, Crown, Shield, Eye } from "lucide-react";
import { getInitials } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ManageProjectMembersDialog } from "./manage-project-members-dialog";

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

interface ProjectMembersCardProps {
  projectId: string;
  members: ProjectMember[];
  canManage: boolean;
  onRefresh: () => void;
}

export function ProjectMembersCard({
  projectId,
  members,
  canManage,
  onRefresh,
}: ProjectMembersCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="h-5 w-5" />
          Equipo del Proyecto
          <span className="text-sm font-normal text-muted-foreground">
            ({members.length})
          </span>
        </CardTitle>
        {canManage && (
          <ManageProjectMembersDialog
            projectId={projectId}
            currentMembers={members}
            onSuccess={onRefresh}
          >
            <Button variant="outline" size="sm">
              <Settings2 className="mr-2 h-4 w-4" />
              Gestionar acceso
            </Button>
          </ManageProjectMembersDialog>
        )}
      </CardHeader>
      <CardContent>
        {members.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No hay miembros asignados a este proyecto
          </p>
        ) : (
          <div className="space-y-3">
            {members.map((member) => {
              const roleConfig = PROJECT_ROLE_CONFIG[member.role] || PROJECT_ROLE_CONFIG.member;
              const RoleIcon = roleConfig.icon;
              return (
                <div key={member.id} className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
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
                    className={`gap-1 ${roleConfig.className} border-transparent`}
                  >
                    <RoleIcon className="h-3 w-3" />
                    {roleConfig.label}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
