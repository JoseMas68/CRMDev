import Link from "next/link";
import { Mail, Phone, Building2 } from "lucide-react";

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
}

export function ClientCard({ client }: ClientCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{client.name}</h3>
            {client.company && (
              <p className="text-sm text-muted-foreground truncate">
                {client.company}
              </p>
            )}
          </div>
          <Badge
            variant="secondary"
            className={statusColors[client.status]}
          >
            {statusLabels[client.status]}
          </Badge>
        </div>

        <div className="mt-4 space-y-2 text-sm">
          {client.email && (
            <a
              href={`mailto:${client.email}`}
              className="flex items-center gap-2 text-muted-foreground hover:text-primary"
            >
              <Mail className="h-4 w-4" />
              {client.email}
            </a>
          )}
          {client.phone && (
            <a
              href={`tel:${client.phone}`}
              className="flex items-center gap-2 text-muted-foreground hover:text-primary"
            >
              <Phone className="h-4 w-4" />
              {client.phone}
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
