import Link from "next/link";
import { CheckCircle2, Clock, GitPullRequest, Kanban } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-background">
      {/* Left side - Branding - OpenClaw Premium Theme */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-charcoal-bg border-r border-white/5">
        {/* Animated Background Mesh */}
        <div className="absolute inset-0 bg-mesh opacity-20" />

        {/* Decorative Light Effects */}
        <div className="absolute top-0 right-0 h-96 w-96 bg-primary/10 blur-[120px] rounded-full -z-10" />
        <div className="absolute bottom-0 left-0 h-96 w-96 bg-accent-green/10 blur-[120px] rounded-full -z-10" />

        <div className="relative z-10 flex flex-col min-h-screen w-full p-12 md:p-16 lg:p-20">
          {/* Logo Premium */}
          <div className="mb-auto">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <span className="font-mono text-2xl font-semibold text-neon-violet tech-glow-text tracking-tight">
                {"{ √ }"}
              </span>
              <span className="font-mono text-2xl font-semibold text-gradient tech-glow-text">
                CRMDev
              </span>
              <span className="font-mono text-2xl font-semibold text-neon-violet terminal-cursor">|</span>
            </Link>
          </div>

          <div className="my-auto space-y-10">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight">
                Gestiona tu negocio <br />
                <span className="text-gradient">de forma inteligente</span>
                <span className="terminal-cursor text-accent-green">_</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-md leading-relaxed">
                Clientes, ventas, proyectos y tareas en una sola plataforma.
                Diseñado para desarrolladores que quieren escalar.
              </p>
            </div>

            <div className="grid gap-5">
              {[
                { icon: GitPullRequest, text: "Sincronización nativa con GitHub", color: "text-neon-violet" },
                { icon: Clock, text: "Control de tiempo y facturación", color: "text-accent-green" },
                { icon: Kanban, text: "Pipeline de ventas IA-Powered", color: "text-primary" }
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-4 group">
                  <div className="h-12 w-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 group-hover:border-white/20 transition-all shadow-2xl">
                    <feature.icon className={`h-6 w-6 ${feature.color}`} />
                  </div>
                  <span className="font-medium text-muted-foreground/80 group-hover:text-foreground transition-colors">{feature.text}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-6 pt-6">
              <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/5 border border-white/5 shadow-inner">
                <div className="h-2 w-2 rounded-full bg-accent-green animate-pulse" />
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">99.9% uptime</span>
              </div>
              <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/5 border border-white/5 shadow-inner">
                <div className="h-2 w-2 rounded-full bg-neon-violet" />
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">Elite Dev Grade</span>
              </div>
            </div>
          </div>

          <div className="mt-auto pt-10">
            <p className="text-xs font-mono text-muted-foreground/30 flex items-center gap-2">
              <span className="h-px w-8 bg-white/5" />
              &copy; {new Date().getFullYear()} CRMDev Systems. Initializing session...
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Auth form */}
      <div className="flex-1 flex items-center justify-center p-8 relative overflow-y-auto">
        <div className="w-full max-w-md my-auto">
          {/* Mobile logo removed - Handled by Form components */}
          {children}
        </div>
      </div>
    </div>

  );
}
