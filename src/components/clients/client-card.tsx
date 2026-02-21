"use client";

import Link from "next/link";
import { Mail, Phone, Building2, ChevronRight, User } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusLabels: Record<string, string> = {
  LEAD: "Lead",
  PROSPECT: "Prospecto",
  CUSTOMER: "Cliente",
  INACTIVE: "Inactivo",
  CHURNED: "Perdido",
};

const statusColors: Record<string, string> = {
  LEAD: "bg-blue-500 text-white",
  PROSPECT: "bg-yellow-500 text-white",
  CUSTOMER: "bg-green-500 text-white",
  INACTIVE: "bg-gray-500 text-white",
  CHURNED: "bg-red-500 text-white",
};

interface ClientCardProps {
  client: {
    id: string;
    name: string;
    company: string | null;
    email: string | null;
    phone: string | null;
    status: string;
  };
  onDelete?: (id: string) => void;
  index?: number;
}

export function ClientCard({ client, onDelete, index = 0 }: ClientCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="w-full"
    >
      {/* MOBILE DESIGN - App-like card */}
      <Link href={`/clients/${client.id}`} className="block md:hidden">
        <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 rounded-2xl p-5 shadow-lg border border-gray-200 dark:border-gray-700 active:scale-95 transition-transform">
          {/* Header con avatar y nombre */}
          <div className="flex items-center gap-4 mb-4">
            {/* Avatar grande */}
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white text-2xl font-bold shadow-md">
              {client.name.charAt(0).toUpperCase()}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white truncate">
                {client.name}
              </h3>
              {client.company && (
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate flex items-center gap-1 mt-1">
                  <Building2 className="h-4 w-4" />
                  {client.company}
                </p>
              )}
            </div>

            <ChevronRight className="h-6 w-6 text-gray-400" />
          </div>

          {/* Status badge prominente */}
          <div className="mb-4">
            <Badge
              className={cn(
                "text-sm font-bold px-4 py-2 rounded-full shadow-sm",
                statusColors[client.status]
              )}
            >
              {statusLabels[client.status]}
            </Badge>
          </div>

          {/* Acciones directas - botones grandes */}
          <div className="grid grid-cols-2 gap-3">
            {client.email && (
              <a
                href={`mailto:${client.email}`}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white rounded-xl py-3 px-4 font-semibold transition-colors shadow-md"
              >
                <Mail className="h-5 w-5" />
                <span>Email</span>
              </a>
            )}
            {client.phone && (
              <a
                href={`tel:${client.phone}`}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 active:bg-green-700 text-white rounded-xl py-3 px-4 font-semibold transition-colors shadow-md"
              >
                <Phone className="h-5 w-5" />
                <span>Llamar</span>
              </a>
            )}
          </div>
        </div>
      </Link>

      {/* DESKTOP DESIGN - Original card style */}
      <div className="hidden md:block">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all p-4">
          <div className="flex items-start justify-between gap-4 mb-4">
            <Link
              href={`/clients/${client.id}`}
              className="flex-1 min-w-0 group"
            >
              <h3 className="font-semibold text-base truncate group-hover:text-primary transition-colors">
                {client.name}
              </h3>
              {client.company && (
                <p className="text-sm text-muted-foreground truncate flex items-center gap-2 mt-1">
                  <Building2 className="h-4 w-4" />
                  {client.company}
                </p>
              )}
            </Link>
            <Badge variant="secondary" className={cn("text-xs", statusColors[client.status])}>
              {statusLabels[client.status]}
            </Badge>
          </div>

          <div className="flex gap-2">
            {client.email && (
              <a
                href={`mailto:${client.email}`}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded transition-colors"
              >
                <Mail className="h-4 w-4" />
              </a>
            )}
            {client.phone && (
              <a
                href={`tel:${client.phone}`}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded transition-colors"
              >
                <Phone className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
