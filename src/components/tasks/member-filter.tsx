"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Users } from "lucide-react";
import { useTransition } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Member {
  id: string;
  name: string;
  image: string | null;
}

interface MemberFilterProps {
  members: Member[];
  currentMemberId?: string;
}

export function MemberFilter({ members, currentMemberId }: MemberFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function handleMemberChange(memberId: string) {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (memberId === "all") {
        params.delete("assigneeId");
      } else {
        params.set("assigneeId", memberId);
      }
      router.push(`?${params.toString()}`, { scroll: false });
    });
  }

  return (
    <div className="flex items-center gap-2 flex-1 sm:flex-none">
      <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      <Select
        value={currentMemberId || "all"}
        onValueChange={handleMemberChange}
        disabled={isPending}
      >
        <SelectTrigger className="w-full sm:w-[200px]">
          <SelectValue placeholder="Todos los miembros" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los miembros</SelectItem>
          {members.map((member) => (
            <SelectItem key={member.id} value={member.id}>
              {member.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
