"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, getInitials } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Check } from "lucide-react";

interface UserBadgeProps {
  user: {
    name: string;
    image?: string | null;
    avatarUrl?: string | null;
    isVerifiedDev?: boolean;
    githubUsername?: string | null;
  };
  size?: "sm" | "md" | "lg";
  showName?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: "h-6 w-6",
  md: "h-8 w-8",
  lg: "h-10 w-10",
};

const badgeSizeClasses = {
  sm: "h-3 w-3 -bottom-0.5 -right-0.5",
  md: "h-4 w-4 -bottom-0.5 -right-0.5",
  lg: "h-5 w-5 -bottom-1 -right-1",
};

const checkSizeClasses = {
  sm: "h-1.5 w-1.5",
  md: "h-2 w-2",
  lg: "h-2.5 w-2.5",
};

export function UserBadge({
  user,
  size = "md",
  showName = false,
  className,
}: UserBadgeProps) {
  const avatarSrc = user.avatarUrl || user.image || undefined;

  const avatarContent = (
    <div className="relative">
      <Avatar className={sizeClasses[size]}>
        <AvatarImage src={avatarSrc} alt={user.name} />
        <AvatarFallback className="text-xs bg-primary/10 text-primary">
          {getInitials(user.name)}
        </AvatarFallback>
      </Avatar>

      {user.isVerifiedDev && (
        <div
          className={cn(
            "absolute flex items-center justify-center rounded-full bg-accent-green text-white border-2 border-background",
            badgeSizeClasses[size]
          )}
        >
          <Check className={checkSizeClasses[size]} strokeWidth={3} />
        </div>
      )}
    </div>
  );

  if (user.isVerifiedDev) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn("flex items-center gap-2", className)}>
              {avatarContent}
              {showName && (
                <span className="text-sm font-medium truncate">{user.name}</span>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-medium">Verified Developer</p>
            {user.githubUsername && (
              <p className="text-xs text-muted-foreground">@{user.githubUsername}</p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {avatarContent}
      {showName && (
        <span className="text-sm font-medium truncate">{user.name}</span>
      )}
    </div>
  );
}

// Compact verified badge symbol for inline use
export function VerifiedBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center w-4 h-4 rounded-full bg-accent-green text-white text-[8px] font-bold",
        className
      )}
    >
      ✓
    </span>
  );
}
