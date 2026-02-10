import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/80" />
        <div className="relative z-10 flex flex-col justify-between p-12 text-primary-foreground">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <div className="h-10 w-10 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center">
              <span className="font-bold text-lg">C</span>
            </div>
            CRMDev
          </Link>

          <div className="space-y-6">
            <h1 className="text-4xl font-bold leading-tight">
              Gestiona tu negocio
              <br />
              de forma inteligente
            </h1>
            <p className="text-lg opacity-90 max-w-md">
              Clientes, ventas, proyectos y tareas en una sola plataforma.
              Disenado para equipos que quieren crecer.
            </p>

            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-400" />
                <span className="text-sm opacity-80">+1000 empresas activas</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-400" />
                <span className="text-sm opacity-80">99.9% uptime</span>
              </div>
            </div>
          </div>

          <p className="text-sm opacity-60">
            &copy; {new Date().getFullYear()} CRMDev. Todos los derechos reservados.
          </p>
        </div>

        {/* Decorative elements */}
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/5" />
        <div className="absolute -left-12 -bottom-12 h-64 w-64 rounded-full bg-white/5" />
      </div>

      {/* Right side - Auth form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden text-center">
            <Link href="/" className="inline-flex items-center gap-2 font-bold text-xl">
              <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold">C</span>
              </div>
              CRMDev
            </Link>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
