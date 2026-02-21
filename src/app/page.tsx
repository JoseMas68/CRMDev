"use client";

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
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header - Mobile optimized */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 md:h-16 items-center justify-between px-4">
          {/* Logo - Simplified on mobile */}
          <Link href="/" className="flex items-center gap-1.5 md:gap-2">
            <span className="font-mono text-base md:text-xl font-semibold text-neon-violet tech-glow-text tracking-tight">
              {"{ √ }"}
            </span>
            <span className="font-mono text-base md:text-xl font-semibold text-gradient tech-glow-text hidden sm:inline-block">
              CRMDev
            </span>
            <span className="font-mono text-base md:text-xl font-semibold text-neon-violet terminal-cursor hidden md:inline-block">|</span>
          </Link>

          {/* Desktop Nav */}
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

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
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

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 -mr-2"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border/40 bg-background">
            <div className="container py-4 space-y-3">
              <Link
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-base font-medium text-muted-foreground hover:text-primary"
              >
                Características
              </Link>
              <Link
                href="#integrations"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-base font-medium text-muted-foreground hover:text-primary"
              >
                Integraciones
              </Link>
              <Link
                href="#pricing"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-base font-medium text-muted-foreground hover:text-primary"
              >
                Precios
              </Link>
              <div className="h-px bg-border/50 my-4" />
              <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start">
                  Iniciar Sesión
                </Button>
              </Link>
              <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full gap-2">
                  <Github className="h-4 w-4" />
                  Continuar con GitHub
                </Button>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section - Mobile optimized */}
      <section className="container px-4 sm:px-6 flex flex-col items-center justify-center gap-6 py-16 sm:py-20 md:py-24 lg:py-32 text-center">
        <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 sm:px-4 sm:py-1.5 text-xs sm:text-sm font-medium text-primary">
          <Github className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
          Ahora con Sincronización GitHub
        </div>

        <h1 className="max-w-4xl text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight px-4">
          El CRM creado para{" "}
          <span className="text-gradient">desarrolladores</span>
        </h1>

        <p className="max-w-2xl text-base sm:text-lg md:text-xl text-muted-foreground px-4">
          Gestiona clientes, proyectos y tiempo con integración nativa de GitHub.
          Vincula issues, PRs y commits directamente a tus tareas.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto px-4">
          <Link href="/signup" className="flex-1 sm:flex-initial">
            <Button size="lg" className="gap-2 glow-violet w-full sm:w-auto">
              <Github className="h-5 w-5" />
              Continuar con GitHub
            </Button>
          </Link>
          <Link href="#demo" className="flex-1 sm:flex-initial">
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              Ver Demo
            </Button>
          </Link>
        </div>

        <p className="text-sm text-muted-foreground px-4">
          Plan gratuito disponible. No requiere tarjeta de crédito.
        </p>
      </section>

      {/* Features Section - Mobile optimized */}
      <section id="features" className="container px-4 sm:px-6 py-16 sm:py-24">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-4 px-4">
            Diseñado para cómo trabajan los desarrolladores
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
            Integraciones nativas con tu flujo de trabajo de desarrollo.
          </p>
        </div>

        <div className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon={<Github className="h-6 w-6 sm:h-8 sm:w-8" />}
            title="Sincronización GitHub"
            description="Vincula repos a proyectos. Rastrea PRs, issues y commits automáticamente."
          />
          <FeatureCard
            icon={<Clock className="h-6 w-6 sm:h-8 sm:w-8" />}
            title="Control de Tiempo"
            description="Seguimiento de tiempo integrado con horas facturables y reportes por proyecto."
          />
          <FeatureCard
            icon={<Kanban className="h-6 w-6 sm:h-8 sm:w-8" />}
            title="Kanban Dev"
            description="Tableros de tareas con etiquetas de PR, enlaces a issues y referencias de commits."
          />
          <FeatureCard
            icon={<GitPullRequest className="h-6 w-6 sm:h-8 sm:w-8" />}
            title="Flujo de PRs"
            description="Ve el estado de PR, comentarios de revisión y estado de merge en tus tareas."
          />
          <FeatureCard
            icon={<Code2 className="h-6 w-6 sm:h-8 sm:w-8" />}
            title="Etiquetas Tech Stack"
            description="Etiqueta proyectos con tecnologías. Filtra por stack entre clientes."
          />
          <FeatureCard
            icon={<Zap className="h-6 w-6 sm:h-8 sm:w-8" />}
            title="Actividad en Vivo"
            description="Feed en tiempo real de PRs mergeados, issues abiertos y deployments."
          />
        </div>
      </section>

      {/* Verified Developer Section - Mobile optimized */}
      <section className="container px-4 sm:px-6 py-16 sm:py-24">
        <div className="rounded-2xl border border-border/50 bg-card p-6 sm:p-8 md:p-16">
          <div className="grid gap-8 md:grid-cols-2 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-accent-green/10 px-3 py-1 sm:px-4 sm:py-1.5 text-xs sm:text-sm font-medium text-accent-green mb-4 sm:mb-6">
                <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Insignia de Desarrollador Verificado
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-4">
                Demuestra que eres un desarrollador real
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground mb-6">
                Conecta tu cuenta de GitHub para obtener la insignia de desarrollador verificado.
                Tus clientes verán que eres un desarrollador real con un perfil activo en GitHub.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-muted-foreground text-sm sm:text-base">
                  <CheckCircle2 className="h-5 w-5 text-accent-green flex-shrink-0" />
                  <span>Autenticación con GitHub en un clic</span>
                </li>
                <li className="flex items-center gap-3 text-muted-foreground text-sm sm:text-base">
                  <CheckCircle2 className="h-5 w-5 text-accent-green flex-shrink-0" />
                  <span>Sincronización automática de perfil</span>
                </li>
                <li className="flex items-center gap-3 text-muted-foreground text-sm sm:text-base">
                  <CheckCircle2 className="h-5 w-5 text-accent-green flex-shrink-0" />
                  <span>Insignia verificada visible en tu perfil</span>
                </li>
              </ul>
            </div>
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-48 h-48 sm:w-64 sm:h-64 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/30 flex items-center justify-center">
                  <div className="text-center">
                    <div className="relative inline-block">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-muted flex items-center justify-center text-2xl sm:text-3xl font-bold">
                        JD
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-accent-green flex items-center justify-center border-4 border-card">
                        <span className="text-white text-xs font-bold">✓</span>
                      </div>
                    </div>
                    <p className="mt-3 sm:mt-4 font-semibold text-sm sm:text-base">Juan Developer</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Dev Profesional</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section - Mobile optimized */}
      <section id="pricing" className="container px-4 sm:px-6 py-16 sm:py-24">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-4 px-4">
            Precios simples y transparentes
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
            Empieza gratis, actualiza cuando necesites más.
          </p>
        </div>

        <div className="grid gap-6 sm:gap-8 md:grid-cols-3 max-w-5xl mx-auto">
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

      {/* CTA Section - Mobile optimized */}
      <section className="container px-4 sm:px-6 py-16 sm:py-24">
        <div className="rounded-2xl bg-gradient-to-r from-primary/20 to-secondary/20 border border-primary/30 p-6 sm:p-8 md:p-16 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-4 px-4">
            ¿Listo para mejorar tu flujo de trabajo?
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-6 sm:mb-8 px-4">
            Únete a los desarrolladores que gestionan su trabajo con clientes usando CRMDev.
          </p>
          <Link href="/signup">
            <Button size="lg" className="gap-2 w-full sm:w-auto">
              <Github className="h-5 w-5" />
              Comenzar Gratis
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer - Mobile optimized */}
      <footer className="border-t py-8 sm:py-12 mt-auto">
        <div className="container px-4 sm:px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="font-mono text-base sm:text-lg font-semibold text-neon-violet tracking-tight">
              {"{ √ }"}
            </span>
            <span className="font-mono text-base sm:text-lg font-semibold text-gradient">
              CRMDev
            </span>
          </div>

          <p className="text-xs sm:text-sm text-muted-foreground text-center">
            &copy; {new Date().getFullYear()} CRMDev. Todos los derechos reservados.
          </p>

          <div className="flex gap-4 sm:gap-6">
            <Link
              href="/privacy"
              className="text-xs sm:text-sm text-muted-foreground hover:text-primary"
            >
              Privacidad
            </Link>
            <Link
              href="/terms"
              className="text-xs sm:text-sm text-muted-foreground hover:text-primary"
            >
              Términos
            </Link>
            <Link
              href="https://github.com"
              className="text-xs sm:text-sm text-muted-foreground hover:text-primary"
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
    <div className="group relative rounded-2xl border border-border/50 p-6 sm:p-8 hover:border-primary/50 transition-all neon-border-hover">
      <div className="mb-4 inline-flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <h3 className="text-lg sm:text-xl font-semibold mb-2">{title}</h3>
      <p className="text-sm sm:text-base text-muted-foreground">{description}</p>
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
      className={`relative rounded-2xl border p-6 sm:p-8 ${
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
      <h3 className="text-lg sm:text-xl font-semibold">{name}</h3>
      <p className="text-muted-foreground text-sm mb-4">{description}</p>
      <div className="mb-6">
        <span className="text-3xl sm:text-4xl font-bold">{price}</span>
        {price !== "Personalizado" && (
          <span className="text-muted-foreground text-sm sm:text-base">/mes</span>
        )}
      </div>
      <ul className="space-y-3 mb-6 sm:mb-8">
        {features.map((feature) => (
          <li key={feature} className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4 text-accent-green flex-shrink-0" />
            <span className="text-sm sm:text-base">{feature}</span>
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
