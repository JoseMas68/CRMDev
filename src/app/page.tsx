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
  Bot,
  Sparkles,
  LifeBuoy,
  MessageSquare,
  ExternalLink,
  Link as LinkIcon,
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

      {/* AI Integration Section - Mobile optimized */}
      <section id="integrations" className="container px-4 sm:px-6 py-16 sm:py-24">
        <div className="rounded-2xl border border-border/50 bg-card p-6 sm:p-8 md:p-16">
          <div className="grid gap-8 md:grid-cols-2 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-accent-purple/10 px-3 py-1 sm:px-4 sm:py-1.5 text-xs sm:text-sm font-medium text-accent-purple mb-4 sm:mb-6">
                <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Potenciado por Inteligencia Artificial
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-4">
                Conecta Claude, ChatGPT y otras IAs
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground mb-6">
                CRMDev integra Model Context Protocol (MCP). Conecta cualquier asistente de IA
                para automatizar tareas, crear proyectos, asignar trabajo y mucho más.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-muted-foreground text-sm sm:text-base">
                  <Bot className="h-5 w-5 text-accent-purple flex-shrink-0" />
                  <span>ChatGPT, Claude, Gemini y más IAs compatibles</span>
                </li>
                <li className="flex items-center gap-3 text-muted-foreground text-sm sm:text-base">
                  <CheckCircle2 className="h-5 w-5 text-accent-purple flex-shrink-0" />
                  <span>18 endpoints MCP disponibles (proyectos, tareas, clientes, tickets)</span>
                </li>
                <li className="flex items-center gap-3 text-muted-foreground text-sm sm:text-base">
                  <CheckCircle2 className="h-5 w-5 text-accent-purple flex-shrink-0" />
                  <span>API keys por organización. Seguridad multi-tenant.</span>
                </li>
                <li className="flex items-center gap-3 text-muted-foreground text-sm sm:text-base">
                  <CheckCircle2 className="h-5 w-5 text-accent-purple flex-shrink-0" />
                  <span>La IA puede asignar tareas a miembros del equipo</span>
                </li>
              </ul>
            </div>
            <div className="flex justify-center">
              <div className="relative w-full max-w-xs">
                {/* MCP Architecture Visualization */}
                <div className="rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20 p-4 sm:p-6">
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-background border border-border/50 flex items-center justify-center text-xs sm:text-sm">
                        🤖
                      </div>
                      <div className="flex-1 text-xs sm:text-sm">
                        <div className="font-medium">Claude / ChatGPT</div>
                        <div className="text-muted-foreground text-[10px] sm:text-xs">Asistente IA</div>
                      </div>
                    </div>
                    <div className="flex justify-center">
                      <div className="text-accent-purple text-lg sm:text-xl">⬇️</div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-background border border-border/50 flex items-center justify-center text-xs sm:text-sm font-mono font-bold text-accent-purple">
                        MCP
                      </div>
                      <div className="flex-1 text-xs sm:text-sm">
                        <div className="font-medium">REST API</div>
                        <div className="text-muted-foreground text-[10px] sm:text-xs">18 endpoints</div>
                      </div>
                    </div>
                    <div className="flex justify-center">
                      <div className="text-accent-purple text-lg sm:text-xl">⬇️</div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-background border border-border/50 flex items-center justify-center text-xs sm:text-sm">
                        📊
                      </div>
                      <div className="flex-1 text-xs sm:text-sm">
                        <div className="font-medium">CRMDev</div>
                        <div className="text-muted-foreground text-[10px] sm:text-xs">Tareas, Proyectos, Clientes</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Client Support Section - Mobile optimized */}
      <section id="support" className="container px-4 sm:px-6 py-16 sm:py-24">
        <div className="rounded-2xl border border-border/50 bg-card p-6 sm:p-8 md:p-16">
          <div className="grid gap-8 md:grid-cols-2 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-accent-blue/10 px-3 py-1 sm:px-4 sm:py-1.5 text-xs sm:text-sm font-medium text-accent-blue mb-4 sm:mb-6">
                <LifeBuoy className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Soporte Directo con tus Clientes
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-4">
                Conexión directa 24/7
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground mb-6">
                Crea enlaces de soporte personalizados para cada cliente. Incrusta el formulario
                en sus proyectos web para recibir tickets directamente en CRMDev.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-muted-foreground text-sm sm:text-base">
                  <LinkIcon className="h-5 w-5 text-accent-blue flex-shrink-0" />
                  <span>Enlace único de soporte por cliente: <code className="text-xs bg-muted px-1.5 py-0.5 rounded">/support/empresa</code></span>
                </li>
                <li className="flex items-center gap-3 text-muted-foreground text-sm sm:text-base">
                  <MessageSquare className="h-5 w-5 text-accent-blue flex-shrink-0" />
                  <span>Tickets categorizados automáticamente por IA</span>
                </li>
                <li className="flex items-center gap-3 text-muted-foreground text-sm sm:text-base">
                  <CheckCircle2 className="h-5 w-5 text-accent-blue flex-shrink-0" />
                  <span>Asigna tickets a proyectos o miembros del equipo</span>
                </li>
                <li className="flex items-center gap-3 text-muted-foreground text-sm sm:text-base">
                  <ExternalLink className="h-5 w-5 text-accent-blue flex-shrink-0" />
                  <span>Incrusta el widget en cualquier web de tu cliente</span>
                </li>
              </ul>
            </div>
            <div className="flex justify-center">
              <div className="relative w-full max-w-xs">
                {/* Support Widget Preview */}
                <div className="rounded-xl bg-gradient-to-br from-accent-blue/10 to-cyan-500/10 border border-accent-blue/20 p-4 sm:p-6">
                  <div className="space-y-3 sm:space-y-4">
                    <div className="text-center pb-2 border-b border-accent-blue/20">
                      <div className="text-sm font-semibold text-accent-blue">Soporte Técnico</div>
                      <div className="text-[10px] sm:text-xs text-muted-foreground">Respuesta en 24h</div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-2 bg-background/50 rounded w-3/4"></div>
                      <div className="h-2 bg-background/50 rounded w-1/2"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-8 bg-background/50 rounded text-[10px] sm:text-xs flex items-center justify-center text-muted-foreground">
                        Descripción del problema...
                      </div>
                    </div>
                    <div className="pt-2">
                      <div className="h-7 sm:h-8 bg-accent-blue/20 rounded text-[10px] sm:text-xs flex items-center justify-center text-accent-blue font-medium">
                        Enviar Ticket
                      </div>
                    </div>
                    <div className="text-center text-[9px] sm:text-[10px] text-muted-foreground pt-1">
                      Powered by CRMDev
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Organization & Team Section - Mobile optimized */}
      <section id="teams" className="container px-4 sm:px-6 py-16 sm:py-24">
        <div className="rounded-2xl border border-border/50 bg-card p-6 sm:p-8 md:p-16">
          <div className="grid gap-8 md:grid-cols-2 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-accent-orange/10 px-3 py-1 sm:px-4 sm:py-1.5 text-xs sm:text-sm font-medium text-accent-orange mb-4 sm:mb-6">
                <Zap className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Organizaciones Multi-Usuario
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-4">
                Tu espacio de trabajo, tu equipo
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground mb-6">
                Crea organizaciones con espacios de trabajo aislados. Añade miembros humanos
                y agentes de IA que trabajan juntos en proyectos y tareas.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-muted-foreground text-sm sm:text-base">
                  <CheckCircle2 className="h-5 w-5 text-accent-orange flex-shrink-0" />
                  <span>Miembros humanos con roles (Owner, Admin, Member)</span>
                </li>
                <li className="flex items-center gap-3 text-muted-foreground text-sm sm:text-base">
                  <Bot className="h-5 w-5 text-accent-orange flex-shrink-0" />
                  <span>Asignar tareas a miembros humanos o IA</span>
                </li>
                <li className="flex items-center gap-3 text-muted-foreground text-sm sm:text-base">
                  <CheckCircle2 className="h-5 w-5 text-accent-orange flex-shrink-0" />
                  <span>La IA puede ver tu equipo y asignar trabajo</span>
                </li>
                <li className="flex items-center gap-3 text-muted-foreground text-sm sm:text-base">
                  <CheckCircle2 className="h-5 w-5 text-accent-orange flex-shrink-0" />
                  <span>Multi-tenant: datos aislados por organización</span>
                </li>
              </ul>
            </div>
            <div className="flex justify-center">
              <div className="relative w-full max-w-xs">
                {/* Team Visualization */}
                <div className="rounded-xl bg-gradient-to-br from-accent-orange/10 to-amber-500/10 border border-accent-orange/20 p-4 sm:p-6">
                  <div className="space-y-3 sm:space-y-4">
                    <div className="text-center pb-2 border-b border-accent-orange/20">
                      <div className="text-sm font-semibold text-accent-orange">Miembros del Equipo</div>
                      <div className="text-[10px] sm:text-xs text-muted-foreground">4 miembros activos</div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-background border border-border/50 flex items-center justify-center text-xs">JP</div>
                        <div className="flex-1">
                          <div className="text-xs font-medium">Juan Pérez</div>
                          <div className="text-[9px] text-muted-foreground">Admin</div>
                        </div>
                        <div className="w-2 h-2 rounded-full bg-accent-green"></div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-background border border-border/50 flex items-center justify-center text-xs">ML</div>
                        <div className="flex-1">
                          <div className="text-xs font-medium">María López</div>
                          <div className="text-[9px] text-muted-foreground">Member</div>
                        </div>
                        <div className="w-2 h-2 rounded-full bg-accent-green"></div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-accent-purple/20 border border-accent-purple/50 flex items-center justify-center text-xs">🤖</div>
                        <div className="flex-1">
                          <div className="text-xs font-medium">Claude AI</div>
                          <div className="text-[9px] text-accent-purple">Asistente IA</div>
                        </div>
                        <div className="w-2 h-2 rounded-full bg-accent-purple"></div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-accent-purple/20 border border-accent-purple/50 flex items-center justify-center text-xs">🤖</div>
                        <div className="flex-1">
                          <div className="text-xs font-medium">ChatGPT</div>
                          <div className="text-[9px] text-accent-purple">Asistente IA</div>
                        </div>
                        <div className="w-2 h-2 rounded-full bg-accent-purple"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Verified Developer Section - Mobile optimized - Compact */}
      <section className="container px-4 sm:px-6 py-12 sm:py-16">
        <div className="rounded-2xl border border-border/50 bg-card p-6 sm:p-8 md:p-12">
          <div className="grid gap-6 md:grid-cols-2 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-accent-green/10 px-3 py-1 sm:px-3 sm:py-1 text-[10px] sm:text-xs font-medium text-accent-green mb-3 sm:mb-4">
                <CheckCircle2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                Insignia de Desarrollador Verificado
              </div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight mb-3">
                Demuestra que eres un desarrollador real
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground mb-4">
                Conecta tu cuenta de GitHub para obtener la insignia. Tus clients verán tu perfil verificado.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-muted-foreground text-xs sm:text-sm">
                  <CheckCircle2 className="h-4 w-4 text-accent-green flex-shrink-0" />
                  <span>Autenticación GitHub OAuth</span>
                </li>
                <li className="flex items-center gap-2 text-muted-foreground text-xs sm:text-sm">
                  <CheckCircle2 className="h-4 w-4 text-accent-green flex-shrink-0" />
                  <span>Badge de verificado en perfil</span>
                </li>
              </ul>
            </div>
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-40 h-40 sm:w-52 sm:h-52 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/30 flex items-center justify-center">
                  <div className="text-center">
                    <div className="relative inline-block">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-muted flex items-center justify-center text-xl sm:text-2xl font-bold">
                        JD
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-accent-green flex items-center justify-center border-4 border-card">
                        <span className="text-white text-[10px] sm:text-xs font-bold">✓</span>
                      </div>
                    </div>
                    <p className="mt-2 sm:mt-3 font-semibold text-xs sm:text-sm">Juan Developer</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Verificado</p>
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
