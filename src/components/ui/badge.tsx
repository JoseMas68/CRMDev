import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        // CRMDev: Dev label variants
        bug: "border-transparent bg-red-500/20 text-red-400 hover:bg-red-500/30",
        feature: "border-transparent bg-violet-500/20 text-violet-400 hover:bg-violet-500/30",
        enhancement: "border-transparent bg-blue-500/20 text-blue-400 hover:bg-blue-500/30",
        documentation: "border-transparent bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30",
        refactor: "border-transparent bg-orange-500/20 text-orange-400 hover:bg-orange-500/30",
        hotfix: "border-transparent bg-pink-500/20 text-pink-400 hover:bg-pink-500/30",
        // CRMDev: PR status variants
        merged: "border-transparent bg-purple-500/20 text-purple-400",
        open: "border-transparent bg-green-500/20 text-green-400",
        closed: "border-transparent bg-gray-500/20 text-gray-400",
        draft: "border-transparent bg-gray-500/20 text-gray-500",
        // CRMDev: Priority variants
        low: "border-transparent bg-gray-500/20 text-gray-400",
        medium: "border-transparent bg-blue-500/20 text-blue-400",
        high: "border-transparent bg-orange-500/20 text-orange-400",
        urgent: "border-transparent bg-red-500/20 text-red-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
