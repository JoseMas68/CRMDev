"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Github } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

import { signIn } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Esquema de validación de login
const loginSchema = z.object({
  email: z.string().email("Por favor ingresa un email válido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

type LoginInput = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const [isLoading, setIsLoading] = useState(false);
  const [isGitHubLoading, setIsGitHubLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginInput) {
    setIsLoading(true);

    try {
      const result = await signIn.email({
        email: data.email,
        password: data.password,
        callbackURL: callbackUrl,
      });

      if (result.error) {
        toast.error(result.error.message || "Error al iniciar sesión");
        return;
      }

      toast.success("Sesión iniciada correctamente");
      router.push(callbackUrl);
      router.refresh();
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Error al iniciar sesión. Intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGitHubSignIn() {
    setIsGitHubLoading(true);
    try {
      await signIn.social({
        provider: "github",
        callbackURL: callbackUrl,
      });
    } catch (error) {
      console.error("GitHub login error:", error);
      toast.error("Error al iniciar sesión con GitHub");
      setIsGitHubLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div className="space-y-2 text-center">
        <div className="flex justify-center items-center gap-2 mb-4">
          <span className="font-mono text-2xl font-semibold text-neon-violet tech-glow-text tracking-tight">
            {"{ √ }"}
          </span>
          <span className="font-mono text-2xl font-semibold text-gradient tech-glow-text">
            CRMDev
          </span>
          <span className="font-mono text-2xl font-semibold text-neon-violet terminal-cursor">|</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Bienvenido de nuevo</h1>
        <p className="text-muted-foreground">
          Inicia sesión en tu cuenta de CRMDev
        </p>
      </div>

      {/* Botón de GitHub OAuth */}
      <Button
        type="button"
        variant="outline"
        className="w-full gap-2 h-11"
        onClick={handleGitHubSignIn}
        disabled={isGitHubLoading || isLoading}
      >
        {isGitHubLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Github className="h-4 w-4" />
        )}
        Continuar con GitHub
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            O continúa con email
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="tu@ejemplo.com"
            autoComplete="email"
            disabled={isLoading || isGitHubLoading}
            {...register("email")}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Contraseña</Label>
            <Link
              href="/forgot-password"
              className="text-sm text-primary hover:underline"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            placeholder="********"
            autoComplete="current-password"
            disabled={isLoading || isGitHubLoading}
            {...register("password")}
          />
          {errors.password && (
            <p className="text-sm text-destructive">{errors.password.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isLoading || isGitHubLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Iniciar Sesión
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        ¿No tienes una cuenta?{" "}
        <Link href="/signup" className="text-primary hover:underline font-medium">
          Regístrate gratis
        </Link>
      </p>
    </motion.div>
  );
}
