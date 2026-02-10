import Link from "next/link";
import {
  ArrowRight,
  Github,
  GitPullRequest,
  Clock,
  Kanban,
  Code2,
  Zap,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-mono text-xl font-semibold text-neon-violet tech-glow-text tracking-tight">
              {"{ √ }"}
            </span>
            <span className="font-mono text-xl font-semibold text-gradient tech-glow-text">
              CRMDev
            </span>
            <span className="font-mono text-xl font-semibold text-neon-violet terminal-cursor">|</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="#features"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              Características
            </Link>
            <Link
              href="#integrations"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              Integraciones
            </Link>
            <Link
              href="#pricing"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              Precios
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Iniciar Sesión</Button>
            </Link>
            <Link href="/signup">
              <Button className="gap-2">
                <Github className="h-4 w-4" />
                Empezar con GitHub
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container flex flex-col items-center justify-center gap-6 py-24 text-center md:py-32">
        <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
          <Github className="mr-2 h-4 w-4" />
          Ahora con Sincronización GitHub
        </div>

        <h1 className="max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
          El CRM creado para{" "}
          <span className="text-gradient">desarrolladores</span>
        </h1>

        <p className="max-w-2xl text-lg text-muted-foreground md:text-xl">
          Gestiona clientes, proyectos y tiempo con integración nativa de GitHub.
          Vincula issues, PRs y commits directamente a tus tareas.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/signup">
            <Button size="lg" className="gap-2 glow-violet">
              <Github className="h-5 w-5" />
              Continuar con GitHub
            </Button>
          </Link>
          <Link href="#demo">
            <Button size="lg" variant="outline">
              Ver Demo
            </Button>
          </Link>
        </div>

        <p className="text-sm text-muted-foreground">
          Plan gratuito disponible. No requiere tarjeta de crédito.
        </p>
      </section>

      {/* Features Section */}
      <section id="features" className="container py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            Diseñado para cómo trabajan los desarrolladores
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Integraciones nativas con tu flujo de trabajo de desarrollo.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon={<Github className="h-8 w-8" />}
            title="Sincronización GitHub"
            description="Vincula repos a proyectos. Rastrea PRs, issues y commits automáticamente."
          />
          <FeatureCard
            icon={<Clock className="h-8 w-8" />}
            title="Control de Tiempo"
            description="Seguimiento de tiempo integrado con horas facturables y reportes por proyecto."
          />
          <FeatureCard
            icon={<Kanban className="h-8 w-8" />}
            title="Kanban Dev"
            description="Tableros de tareas con etiquetas de PR, enlaces a issues y referencias de commits."
          />
          <FeatureCard
            icon={<GitPullRequest className="h-8 w-8" />}
            title="Flujo de PRs"
            description="Ve el estado de PR, comentarios de revisión y estado de merge en tus tareas."
          />
          <FeatureCard
            icon={<Code2 className="h-8 w-8" />}
            title="Etiquetas Tech Stack"
            description="Etiqueta proyectos con tecnologías. Filtra por stack entre clientes."
          />
          <FeatureCard
            icon={<Zap className="h-8 w-8" />}
            title="Actividad en Vivo"
            description="Feed en tiempo real de PRs mergeados, issues abiertos y deployments."
          />
        </div>
      </section>

      {/* Verified Developer Section */}
      <section className="container py-24">
        <div className="rounded-2xl border border-border/50 bg-card p-8 md:p-16">
          <div className="grid gap-8 md:grid-cols-2 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-accent-green/10 px-4 py-1.5 text-sm font-medium text-accent-green mb-6">
                <CheckCircle2 className="h-4 w-4" />
                Insignia de Desarrollador Verificado
              </div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
                Demuestra que eres un desarrollador real
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                Conecta tu cuenta de GitHub para obtener la insignia de desarrollador verificado.
                Tus clientes verán que eres un desarrollador real con un perfil activo en GitHub.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-muted-foreground">
                  <CheckCircle2 className="h-5 w-5 text-accent-green" />
                  <span>Autenticación con GitHub en un clic</span>
                </li>
                <li className="flex items-center gap-3 text-muted-foreground">
                  <CheckCircle2 className="h-5 w-5 text-accent-green" />
                  <span>Sincronización automática de perfil</span>
                </li>
                <li className="flex items-center gap-3 text-muted-foreground">
                  <CheckCircle2 className="h-5 w-5 text-accent-green" />
                  <span>Insignia verificada visible en tu perfil</span>
                </li>
              </ul>
            </div>
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-64 h-64 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/30 flex items-center justify-center">
                  <div className="text-center">
                    <div className="relative inline-block">
                      <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center text-3xl font-bold">
                        JD
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-accent-green flex items-center justify-center border-4 border-card">
                        <span className="text-white text-xs font-bold">✓</span>
                      </div>
                    </div>
                    <p className="mt-4 font-semibold">Juan Developer</p>
                    <p className="text-sm text-muted-foreground">Dev Profesional</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="container py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            Precios simples y transparentes
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Empieza gratis, actualiza cuando necesites más.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
          <PricingCard
            name="Gratis"
            price="$0"
            description="Perfecto para freelancers"
            features={[
              "Hasta 5 clientes",
              "Control de tiempo básico",
              "Login con GitHub OAuth",
              "Insignia dev verificado",
            ]}
            cta="Comenzar"
            href="/signup"
          />
          <PricingCard
            name="Pro"
            price="$19"
            description="Para agencias en crecimiento"
            features={[
              "Clientes ilimitados",
              "Control de tiempo avanzado",
              "Sincronización de repos GitHub",
              "Colaboración en equipo",
              "Soporte prioritario",
            ]}
            cta="Prueba Gratis"
            href="/signup"
            highlighted
          />
          <PricingCard
            name="Empresa"
            price="Personalizado"
            description="Para equipos grandes"
            features={[
              "Todo lo de Pro",
              "Integraciones personalizadas",
              "SSO / SAML",
              "Soporte dedicado",
              "Garantía SLA",
            ]}
            cta="Contactar Ventas"
            href="/contact"
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-24">
        <div className="rounded-2xl bg-gradient-to-r from-primary/20 to-secondary/20 border border-primary/30 p-8 md:p-16 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            ¿Listo para mejorar tu flujo de trabajo?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Únete a los desarrolladores que gestionan su trabajo con clientes usando CRMDev.
          </p>
          <Link href="/signup">
            <Button size="lg" className="gap-2">
              <Github className="h-5 w-5" />
              Comenzar Gratis
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 mt-auto">
        <div className="container flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="font-mono text-lg font-semibold text-neon-violet tracking-tight">
              {"{ √ }"}
            </span>
            <span className="font-mono font-semibold text-gradient">
              CRMDev
            </span>
          </div>

          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} CRMDev. Todos los derechos reservados.
          </p>

          <div className="flex gap-6">
            <Link
              href="/privacy"
              className="text-sm text-muted-foreground hover:text-primary"
            >
              Privacidad
            </Link>
            <Link
              href="/terms"
              className="text-sm text-muted-foreground hover:text-primary"
            >
              Términos
            </Link>
            <Link
              href="https://github.com"
              className="text-sm text-muted-foreground hover:text-primary"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Github className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="group relative rounded-2xl border border-border/50 p-8 hover:border-primary/50 transition-all neon-border-hover">
      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}

function PricingCard({
  name,
  price,
  description,
  features,
  cta,
  href,
  highlighted = false,
}: {
  name: string;
  price: string;
  description: string;
  features: string[];
  cta: string;
  href: string;
  highlighted?: boolean;
}) {
  return (
    <div
      className={`relative rounded-2xl border p-8 ${
        highlighted
          ? "border-primary/50 bg-primary/5 glow-violet"
          : "border-border/50"
      }`}
    >
      {highlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
          Más Popular
        </div>
      )}
      <h3 className="text-xl font-semibold">{name}</h3>
      <p className="text-muted-foreground text-sm mb-4">{description}</p>
      <div className="mb-6">
        <span className="text-4xl font-bold">{price}</span>
        {price !== "Personalizado" && (
          <span className="text-muted-foreground">/mes</span>
        )}
      </div>
      <ul className="space-y-3 mb-8">
        {features.map((feature) => (
          <li key={feature} className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4 text-accent-green" />
            {feature}
          </li>
        ))}
      </ul>
      <Link href={href} className="block">
        <Button
          className="w-full"
          variant={highlighted ? "default" : "outline"}
        >
          {cta}
        </Button>
      </Link>
    </div>
  );
}
