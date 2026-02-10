"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ProjectMembersCard } from "./project-members-card";

interface ProjectMember {
  id: string;
  role: string;
  createdAt: Date;
  user: { id: string; name: string; email: string; image: string | null };
}

interface ProjectMembersSectionProps {
  projectId: string;
  members: ProjectMember[];
  canManage: boolean;
}

export function ProjectMembersSection({
  projectId,
  members,
  canManage,
}: ProjectMembersSectionProps) {
  const router = useRouter();

  function handleRefresh() {
    router.refresh();
  }

  return (
    <ProjectMembersCard
      projectId={projectId}
      members={members}
      canManage={canManage}
      onRefresh={handleRefresh}
    />
  );
}
