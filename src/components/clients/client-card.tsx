"use client";

import Link from "next/link";
import { Mail, Phone, Building2, ChevronRight } from "lucide-react";
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
      {/* MOBILE DESIGN - Compact card */}
      <Link href={`/clients/${client.id}`} className="block md:hidden">
        <div className="bg-white dark:bg-gray-900 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-gray-700 active:scale-[0.98] transition-transform">
          {/* Header compacto */}
          <div className="flex items-center gap-3">
            {/* Avatar pequeño */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white text-sm font-bold shadow-sm flex-shrink-0">
              {client.name.charAt(0).toUpperCase()}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {client.name}
              </h3>
              {client.company && (
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  {client.company}
                </p>
              )}
            </div>

            {/* Status badge pequeño */}
            <Badge
              className={cn(
                "text-[10px] font-semibold px-2 py-0.5 rounded-md flex-shrink-0",
                statusColors[client.status]
              )}
            >
              {statusLabels[client.status]}
            </Badge>

            <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
          </div>

          {/* Iconos de contacto - solo visuales, no clickeables */}
          <div className="flex gap-3 mt-2 ml-13 opacity-50">
            {client.email && (
              <Mail className="h-3.5 w-3.5 text-gray-400" />
            )}
            {client.phone && (
              <Phone className="h-3.5 w-3.5 text-gray-400" />
            )}
          </div>
        </div>
      </Link>

      {/* DESKTOP DESIGN - Table row style */}
      <div className="hidden md:block">
        <div className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white font-bold">
                {client.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="font-semibold">{client.name}</h3>
                {client.company && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    {client.company}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Badge
                className={cn(
                  statusColors[client.status]
                )}
              >
                {statusLabels[client.status]}
              </Badge>

              <div className="flex gap-2 text-sm text-muted-foreground">
                {client.email && (
                  <a
                    href={`mailto:${client.email}`}
                    onClick={(e) => e.stopPropagation()}
                    className="hover:text-foreground"
                  >
                    <Mail className="h-4 w-4" />
                  </a>
                )}
                {client.phone && (
                  <a
                    href={`tel:${client.phone}`}
                    onClick={(e) => e.stopPropagation()}
                    className="hover:text-foreground"
                  >
                    <Phone className="h-4 w-4" />
                  </a>
                )}
              </div>

              <Link href={`/clients/${client.id}`}>
                <Button variant="ghost" size="sm">
                  Ver
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
