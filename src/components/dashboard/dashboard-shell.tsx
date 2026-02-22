"use client";

import { useSidebarStore } from "@/store/sidebar-store";
import { cn } from "@/lib/utils";
import React from "react";

interface DashboardShellProps {
    sidebar: React.ReactNode;
    header: React.ReactNode;
    children: React.ReactNode;
    bottomNav: React.ReactNode;
}

export function DashboardShell({ sidebar, header, children, bottomNav }: DashboardShellProps) {
    const { isCollapsed } = useSidebarStore();

    return (
        <div className="flex min-h-screen">
            {sidebar}

            <div
                className={cn(
                    "flex-1 flex flex-col transition-all duration-300 ease-in-out",
                    isCollapsed ? "lg:pl-20" : "lg:pl-72"
                )}
            >
                {header}
                <main className="flex-1 p-4 lg:p-6 pb-20 lg:pb-6">{children}</main>
            </div>

            {bottomNav}
        </div>
    );
}
