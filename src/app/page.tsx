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
              <Button>
                Crear Cuenta
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
                <Button className="w-full">
                  Crear Cuenta
                </Button>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section - Mobile optimized */}
      <section className="container px-4 sm:px-6 flex flex-col items-center justify-center gap-6 py-16 sm:py-20 md:py-24 lg:py-32 text-center">
        <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 sm:px-4 sm:py-1.5 text-xs sm:text-sm font-medium text-primary">
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
            <Button size="lg" className="glow-violet w-full sm:w-auto">
              Crear Cuenta
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

      {/* AI Integration Section - OpenClaw Theme */}
      <section id="integrations" className="container px-4 sm:px-6 py-16 sm:py-24 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-mesh -z-10 opacity-50" />

        <div className="rounded-3xl border-gradient-purple bg-card/30 backdrop-blur-sm p-6 sm:p-8 md:p-16 relative overflow-hidden group">
          {/* Decorative Robotic Claw Background Elements */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all" />

          <div className="grid gap-12 lg:grid-cols-2 items-center relative z-10">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-1.5 text-xs sm:text-sm font-medium text-primary mb-6 animate-float">
                <div className="relative w-4 h-4 mr-1">
                  <Sparkles className="absolute inset-0 h-4 w-4" />
                </div>
                OpenClaw Intelligence Engine
              </div>

              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-6 leading-tight">
                Potencia tu CRM con <span className="text-gradient">OpenClaw</span>
              </h2>

              <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed">
                Integra la potencia de Claude y ChatGPT a través del protocolo MCP.
                Tus agentes de IA ahora tienen "pinzas" para interactuar directamente con tus datos.
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="glass-card p-4 rounded-xl border-white/5 hover:border-primary/30 transition-colors">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3 text-primary">
                    <Bot className="h-6 w-6" />
                  </div>
                  <h4 className="font-semibold mb-1">Agentes Autónomos</h4>
                  <p className="text-sm text-muted-foreground">La IA puede crear proyectos y asignar tareas por ti.</p>
                </div>
                <div className="glass-card p-4 rounded-xl border-white/5 hover:border-primary/30 transition-colors">
                  <div className="h-10 w-10 rounded-lg bg-accent-green/10 flex items-center justify-center mb-3 text-accent-green">
                    <Zap className="h-6 w-6" />
                  </div>
                  <h4 className="font-semibold mb-1">MCP Nativo</h4>
                  <p className="text-sm text-muted-foreground">18 endpoints listos para conectar con cualquier LLM.</p>
                </div>
              </div>

              <div className="mt-8 flex items-center gap-4 text-sm font-medium text-primary">
                <CheckCircle2 className="h-5 w-5" />
                Seguridad Multi-tenant de grado empresarial
              </div>
            </div>

            <div className="relative">
              {/* Visualizing the "Claw" connecting AI to Data */}
              <div className="relative aspect-square w-full max-w-[400px] mx-auto">
                {/* AI Node */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 glass-card p-4 rounded-2xl border-primary/30 z-20 animate-float">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white text-xl">
                      🤖
                    </div>
                    <div>
                      <div className="font-bold text-sm">AI Agent</div>
                      <div className="text-[10px] text-primary uppercase tracking-widest font-black">Claude / GPT</div>
                    </div>
                  </div>
                </div>

                {/* Connection Lines (SVGs) */}
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 400">
                  <defs>
                    <linearGradient id="line-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="hsl(var(--accent-green))" stopOpacity="0.5" />
                    </linearGradient>
                  </defs>

                  {/* The Claw Arms */}
                  <path
                    d="M200 80 Q150 150 120 250"
                    fill="none"
                    stroke="url(#line-grad)"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                    className="animate-claw-left"
                  />
                  <path
                    d="M200 80 Q250 150 280 250"
                    fill="none"
                    stroke="url(#line-grad)"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                    className="animate-claw-right"
                  />

                  {/* Connection Node */}
                  <circle cx="200" cy="80" r="4" fill="hsl(var(--primary))" className="animate-pulse" />
                </svg>

                {/* DATA Node (MCP) */}
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-full flex justify-between px-4">
                  <div className="glass-card p-3 rounded-xl border-accent-green/20 scale-90 sm:scale-100">
                    <div className="text-xs font-mono text-accent-green mb-1">/projects</div>
                    <div className="h-1.5 w-12 bg-accent-green/20 rounded-full overflow-hidden">
                      <div className="h-full bg-accent-green w-2/3 animate-pulse"></div>
                    </div>
                  </div>
                  <div className="glass-card p-3 rounded-xl border-primary/20 scale-90 sm:scale-100 translate-y-8">
                    <div className="text-xs font-mono text-primary mb-1">/tasks</div>
                    <div className="h-1.5 w-12 bg-primary/20 rounded-full overflow-hidden">
                      <div className="h-full bg-primary w-1/2 animate-pulse"></div>
                    </div>
                  </div>
                  <div className="glass-card p-3 rounded-xl border-accent-green/20 scale-90 sm:scale-100">
                    <div className="text-xs font-mono text-accent-green mb-1">/clients</div>
                    <div className="h-1.5 w-12 bg-accent-green/20 rounded-full overflow-hidden">
                      <div className="h-full bg-accent-green w-4/5 animate-pulse"></div>
                    </div>
                  </div>
                </div>

                {/* Central "Core" */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full bg-primary/5 border border-primary/20 flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent animate-pulse" />
                  <span className="font-mono font-black text-primary z-10 text-xl tracking-tighter">MCP</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Client Support Section - Terminal Style */}
      <section id="support" className="container px-4 sm:px-6 py-16 sm:py-24">
        <div className="rounded-3xl border border-border/40 bg-card/50 backdrop-blur-md p-6 sm:p-8 md:p-16 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10" />

          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div className="order-2 lg:order-1">
              <div className="inline-flex items-center gap-2 rounded-full bg-accent-green/10 border border-accent-green/20 px-4 py-1.5 text-xs sm:text-sm font-medium text-accent-green mb-6">
                <MessageSquare className="h-4 w-4" />
                Soporte de Élite para tus Clientes
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-6">
                Tu Centro de Comando de <span className="text-neon-violet tech-glow-text">Tickets</span>
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Elimina el caos del correo. Ofrece a tus clientes una interfaz profesional
                integrada directamente en sus proyectos que alimenta tu pipeline en CRMDev.
              </p>

              <ul className="space-y-4">
                {[
                  { icon: LinkIcon, text: "Endpoints personalizados: support.tu-app.com", color: "text-neon-violet" },
                  { icon: Bot, text: "Clasificación automática por OpenClaw", color: "text-accent-green" },
                  { icon: ExternalLink, text: "Widget incrustable (React/Vue/HTML)", color: "text-primary" }
                ].map((item, i) => (i < 3 &&
                  <li key={i} className="flex items-center gap-4 group">
                    <div className={`h-10 w-10 rounded-lg bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors ${item.color}`}>
                      <item.icon className="h-5 w-5" />
                    </div>
                    <span className="text-muted-foreground font-medium">{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="order-1 lg:order-2 flex justify-center">
              {/* Terminal-style Widget Preview */}
              <div className="w-full max-w-md bg-black/80 rounded-xl border border-white/10 shadow-2xl overflow-hidden font-mono ring-1 ring-white/5">
                <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/10">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/50"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/50"></div>
                  </div>
                  <div className="text-[10px] text-muted-foreground">customer-support-widget.v1.js</div>
                </div>
                <div className="p-5 space-y-4">
                  <div className="space-y-2">
                    <div className="text-[10px] text-primary uppercase font-black">Issue Title</div>
                    <div className="bg-white/5 border border-white/10 rounded px-3 py-2 text-xs text-white/80">
                      Error en el despliegue de la API...
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-[10px] text-accent-green uppercase font-black">AI Analysis</div>
                    <div className="text-xs text-muted-foreground italic">
                      &gt; Categoría detectada: Infraestructura <br />
                      &gt; Prioridad sugerida: Alta
                    </div>
                  </div>
                  <div className="pt-4 border-t border-white/5">
                    <div className="w-full h-10 bg-primary/20 border border-primary/50 rounded flex items-center justify-center text-primary text-xs font-bold hover:bg-primary/30 transition-all cursor-pointer">
                      PUSH TO CRMDEV
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Organization & Team Section - High Tech Style */}
      <section id="teams" className="container px-4 sm:px-6 py-16 sm:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="relative order-2 lg:order-1 flex justify-center">
            {/* Team Mesh/Flow Visual */}
            <div className="relative w-full max-w-lg aspect-square">
              <div className="absolute inset-0 bg-mesh opacity-30 rounded-full blur-3xl animate-pulse" />

              {/* Central Node */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 glass-card p-6 rounded-3xl border-primary/40 shadow-2xl z-20">
                <div className="text-center">
                  <div className="text-2xl font-bold bg-gradient-to-b from-white to-white/50 bg-clip-text text-transparent">ORGANIZACIÓN</div>
                  <div className="text-[10px] text-primary tracking-widest font-black uppercase">Multi-Tenant Secure</div>
                </div>
              </div>

              {/* Floating Members with Lines */}
              {[
                { label: "Admin", pos: "top-0 left-1/4", color: "bg-primary" },
                { label: "AI Agent", pos: "top-1/4 right-0", color: "bg-neon-violet" },
                { label: "Member", pos: "bottom-1/4 right-1/4", color: "bg-accent-green" },
                { label: "AI Agent", pos: "bottom-0 left-1/2", color: "bg-neon-violet" }
              ].map((member, i) => (
                <div key={i} className={`absolute ${member.pos} glass-card p-3 rounded-2xl flex items-center gap-3 animate-float border-white/5 ring-1 ring-white/10`} style={{ animationDelay: `${i * 1.5}s` }}>
                  <div className={`w-10 h-10 rounded-full ${member.color} flex items-center justify-center font-bold text-white shadow-lg`}>
                    {member.label === "AI Agent" ? "🤖" : member.label[0]}
                  </div>
                  <div>
                    <div className="text-xs font-bold">{member.label}</div>
                    <div className="text-[9px] text-muted-foreground">Sincronizado</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-accent-orange/10 border border-accent-orange/20 px-4 py-1.5 text-xs sm:text-sm font-medium text-accent-orange mb-6">
              <Zap className="h-4 w-4" />
              Escalabilidad Infinita
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-6">
              Equipos Híbridos: <br /> <span className="text-gradient">Humanos + Agentes IA</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              CRMDev no es solo para personas. Tus agentes de IA son ciudadanos de primera clase.
              Pueden ser asignados a tareas, recibir tickets y colaborar con tu equipo en tiempo real.
            </p>

            <div className="grid gap-6">
              {[
                { title: "Aislamiento Total", text: "Espacios de trabajo 100% privados y seguros." },
                { title: "Roles Granulares", text: "Control total sobre quién ve qué en cada proyecto." },
                { title: "Auditoría de Actividad", text: "Historial completo de cambios por humano o IA." }
              ].map((feature, i) => (
                <div key={i} className="flex gap-4 p-4 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 transition-colors group">
                  <CheckCircle2 className="h-6 w-6 text-accent-green flex-shrink-0" />
                  <div>
                    <h4 className="font-bold group-hover:text-primary transition-colors">{feature.title}</h4>
                    <p className="text-sm text-muted-foreground">{feature.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Verified Developer Section - Elite Certification Style */}
      <section className="container px-4 sm:px-6 py-16 sm:py-24">
        <div className="rounded-3xl border-2 border-accent-green/30 bg-accent-green/5 p-8 md:p-16 relative overflow-hidden group">
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-accent-green/20 rounded-full blur-3xl group-hover:bg-accent-green/30 transition-all animate-pulse" />

          <div className="grid lg:grid-cols-2 gap-12 items-center relative z-10">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-accent-green/20 border border-accent-green/40 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-accent-green mb-6">
                Elite Developer Badge
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-6">
                Demuestra tu <span className="text-accent-green">estatus</span> en la comunidad
              </h2>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                No eres un freelancer más. Con el distintivo de **Desarrollador Verificado**, tus clientes
                saben que tu cuenta de GitHub está vinculada y que tus contribuciones son reales.
              </p>

              <div className="space-y-4">
                {[
                  "Validación instantánea vía GitHub OAuth",
                  "Sello visible en todas tus propuestas y facturas",
                  "Acceso a la red de desarrolladores certificados"
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-3 text-muted-foreground">
                    <div className="h-6 w-6 rounded-full bg-accent-green/20 flex items-center justify-center text-accent-green">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <span className="font-medium text-sm sm:text-base">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-center">
              <div className="relative">
                {/* 3D-ish Badge Visualization */}
                <div className="w-56 h-56 sm:w-72 sm:h-72 rounded-full bg-gradient-to-br from-accent-green/20 to-transparent border-4 border-accent-green/40 flex items-center justify-center relative shadow-[0_0_50px_rgba(34,197,94,0.2)] animate-float">
                  <div className="absolute inset-0 rounded-full border border-white/10 animate-spin-slow" />
                  <div className="text-center group-hover:scale-110 transition-transform duration-500">
                    <div className="relative inline-block mb-4">
                      <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full bg-charcoal-card border-2 border-accent-green flex items-center justify-center text-3xl sm:text-4xl font-black text-white shadow-2xl">
                        DEV
                      </div>
                      <div className="absolute -bottom-2 -right-2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-accent-green flex items-center justify-center border-4 border-charcoal-card shadow-lg">
                        <CheckCircle2 className="text-white h-5 w-5 sm:h-6 sm:w-6" />
                      </div>
                    </div>
                    <div className="font-mono text-xs uppercase tracking-[0.2em] text-accent-green font-black">Verified Elite</div>
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

      {/* CTA Section - CTR Optimized */}
      <section className="container px-4 sm:px-6 py-20 sm:py-32">
        <div className="relative rounded-[2.5rem] bg-black border-gradient-purple p-8 sm:p-12 md:p-24 text-center overflow-hidden shadow-[0_50px_100px_-20px_rgba(167,139,250,0.3)]">
          {/* Animated Background Mesh */}
          <div className="absolute inset-0 bg-mesh opacity-20 pointer-events-none" />

          <div className="relative z-10 max-w-4xl mx-auto">
            <h2 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tighter mb-8 leading-[0.9] text-white">
              DEJA DE GESTIONAR. <br /> <span className="text-gradient">EMPIEZA A CONSTRUIR.</span>
            </h2>
            <p className="text-xl sm:text-2xl text-muted-foreground max-w-2xl mx-auto mb-12 font-medium">
              Únete a la élite de desarrolladores que han automatizado su gestión de clientes con CRMDev.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/signup" className="w-full sm:w-auto">
                <Button size="lg" className="h-16 px-10 text-lg gap-3 glow-violet w-full sm:w-auto font-black uppercase tracking-widest bg-primary group hover:scale-105 transition-all">
                  <Github className="h-6 w-6" />
                  Get Started Free
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="#pricing" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="h-16 px-10 text-lg w-full sm:w-auto border-white/10 hover:bg-white/5 transition-colors">
                  Ver Planes
                </Button>
              </Link>
            </div>
            <div className="mt-12 flex items-center justify-center gap-8 grayscale opacity-50">
              <div className="text-sm font-black uppercase tracking-[0.3em] text-muted-foreground">Zero setup cost</div>
              <div className="w-1.5 h-1.5 rounded-full bg-primary/30" />
              <div className="text-sm font-black uppercase tracking-[0.3em] text-muted-foreground">GitHub Native</div>
            </div>
          </div>
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
      className={`relative rounded-2xl border p-6 sm:p-8 ${highlighted
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
