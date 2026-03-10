import { getGlobalStats } from "@/actions/admin/stats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, Briefcase, FolderKanban, CheckSquare, TrendingUp } from "lucide-react";

async function AdminDashboard() {
  const result = await getGlobalStats();

  if (!result.success) {
    const error = "error" in result && result.error ? result.error : "Unknown error";
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-4">Admin Dashboard</h1>
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

  // Type assertion - sabemos que data existe porque success es true
  const stats = (result as { success: true; data: any }).data;

  const statCards = [
    {
      title: "Organizaciones",
      value: stats.organizations.total,
      change: `+${stats.organizations.thisMonth} este mes`,
      icon: Building2,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Usuarios",
      value: stats.users.total,
      change: "Total registrados",
      icon: Users,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Organizaciones Activas",
      value: stats.organizations.active,
      change: "Últimos 7 días",
      icon: TrendingUp,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      title: "Entidades",
      value: `${stats.entities.totalClients} clients`,
      change: `${stats.entities.totalProjects} projects • ${stats.entities.totalTasks} tasks`,
      icon: Briefcase,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard del SaaS</h1>
        <p className="text-muted-foreground">
          Vista general de tu CRM multi-tenant
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.change}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Access */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Accesos Rápidos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <a
              href="/admin/organizations"
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted transition-colors"
            >
              <Building2 className="h-5 w-5 text-blue-500" />
              <div>
                <p className="font-medium">Organizaciones</p>
                <p className="text-sm text-muted-foreground">
                  Gestiona todas las organizaciones
                </p>
              </div>
            </a>
            <a
              href="/admin/users"
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted transition-colors"
            >
              <Users className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-medium">Usuarios</p>
                <p className="text-sm text-muted-foreground">
                  Gestiona usuarios y permisos
                </p>
              </div>
            </a>
          </CardContent>
        </Card>

        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle>Estado del SaaS</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Estado de operaciones</span>
                <span className="flex items-center gap-1 text-sm text-green-600">
                  <span className="h-2 w-2 rounded-full bg-green-600" />
                  Operativo
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Base de datos</span>
                <span className="text-sm text-muted-foreground">
                  PostgreSQL (Neon)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Organizaciones activas</span>
                <span className="text-sm text-muted-foreground">
                  {stats.organizations.active} / {stats.organizations.total} total
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default AdminDashboard;
