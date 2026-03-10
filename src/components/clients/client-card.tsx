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
      {/* MOBILE DESIGN - Improved compact card */}
      <div className="block md:hidden bg-card rounded-lg p-4 shadow-sm border hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
        <Link href={`/clients/${client.id}`} className="flex items-center gap-3">
          {/* Avatar pequeño */}
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white text-sm font-bold shadow-sm flex-shrink-0 ring-2 ring-background">
            {client.name.charAt(0).toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate mb-0.5">
              {client.name}
            </h3>
            {client.company && (
              <p className="text-xs text-muted-foreground truncate flex items-center gap-1.5">
                <Building2 className="h-3 w-3" />
                {client.company}
              </p>
            )}
          </div>

          {/* Status badge pequeño */}
          <Badge
            className={cn(
              "text-[10px] font-semibold px-2.5 py-1 rounded-md flex-shrink-0",
              statusColors[client.status]
            )}
          >
            {statusLabels[client.status]}
          </Badge>

          <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
        </Link>

        {/* Acciones de contacto clickeables y usables - Better spacing */}
        {(client.email || client.phone) && (
          <div className="flex gap-2 mt-4 pt-3 border-t">
            {client.email && (
              <a
                href={`mailto:${client.email}`}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-md bg-muted/50 hover:bg-muted text-sm font-medium transition-colors"
              >
                <Mail className="h-4 w-4" />
                <span>Correo</span>
              </a>
            )}
            {client.phone && (
              <a
                href={`tel:${client.phone}`}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-md bg-muted/50 hover:bg-muted text-sm font-medium transition-colors"
              >
                <Phone className="h-4 w-4" />
                <span>Llamar</span>
              </a>
            )}
          </div>
        )}
      </div>

      {/* DESKTOP DESIGN - Improved table row style */}
      <div className="hidden md:block">
        <div className="border rounded-lg p-4 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-muted/30 group">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white font-bold ring-2 ring-background flex-shrink-0">
                {client.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm truncate">{client.name}</h3>
                {client.company && (
                  <p className="text-sm text-muted-foreground truncate flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5" />
                    {client.company}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              <Badge
                className={cn(
                  "text-xs font-medium px-2.5 py-1",
                  statusColors[client.status]
                )}
              >
                {statusLabels[client.status]}
              </Badge>

              <div className="flex items-center gap-2">
                {client.email && (
                  <a
                    href={`mailto:${client.email}`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center justify-center h-9 w-9 rounded-md bg-muted/50 hover:bg-muted transition-colors"
                    title="Enviar correo"
                  >
                    <Mail className="h-4 w-4" />
                  </a>
                )}
                {client.phone && (
                  <a
                    href={`tel:${client.phone}`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center justify-center h-9 w-9 rounded-md bg-muted/50 hover:bg-muted transition-colors"
                    title="Llamar"
                  >
                    <Phone className="h-4 w-4" />
                  </a>
                )}
              </div>

              <Link href={`/clients/${client.id}`}>
                <Button variant="ghost" size="sm" className="h-9">
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
