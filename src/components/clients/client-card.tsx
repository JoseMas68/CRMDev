"use client";

import Link from "next/link";
import { Mail, Phone, Building2, MoreVertical, Eye, Edit, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const statusLabels: Record<string, string> = {
  LEAD: "Lead",
  PROSPECT: "Prospecto",
  CUSTOMER: "Cliente",
  INACTIVE: "Inactivo",
  CHURNED: "Perdido",
};

const statusColors: Record<string, string> = {
  LEAD: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  PROSPECT: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  CUSTOMER: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  INACTIVE: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  CHURNED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
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
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <Link
              href={`/clients/${client.id}`}
              className="flex-1 min-w-0 group"
            >
              <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
                {client.name}
              </h3>
              {client.company && (
                <p className="text-sm text-muted-foreground truncate flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  {client.company}
                </p>
              )}
            </Link>
            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className={statusColors[client.status]}
              >
                {statusLabels[client.status]}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/clients/${client.id}`} className="cursor-pointer">
                      <Eye className="mr-2 h-4 w-4" />
                      Ver Detalles
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/clients/${client.id}/edit`} className="cursor-pointer">
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </Link>
                  </DropdownMenuItem>
                  {onDelete && (
                    <DropdownMenuItem
                      onClick={() => onDelete(client.id)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Eliminar
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="mt-4 space-y-2 text-sm">
            {client.email && (
              <a
                href={`mailto:${client.email}`}
                className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors active:scale-95 transform"
                onClick={(e) => e.stopPropagation()}
              >
                <Mail className="h-4 w-4 shrink-0" />
                <span className="truncate">{client.email}</span>
              </a>
            )}
            {client.phone && (
              <a
                href={`tel:${client.phone}`}
                className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors active:scale-95 transform"
                onClick={(e) => e.stopPropagation()}
              >
                <Phone className="h-4 w-4 shrink-0" />
                <span className="truncate">{client.phone}</span>
              </a>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
