"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

import { signIn } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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
  const [showVerificationHelp, setShowVerificationHelp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
        // Detectar si el error es por email no verificado
        if (result.error.message?.toLowerCase().includes("email not verified") ||
            result.error.message?.toLowerCase().includes("email not confirmed")) {
          setShowVerificationHelp(true);
          toast.error("Email no verificado. Por favor revisa tu correo electrónico.");
        } else {
          toast.error(result.error.message || "Error al iniciar sesión");
        }
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



      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="tu@ejemplo.com"
            autoComplete="email"
            disabled={isLoading}
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
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="********"
              autoComplete="current-password"
              disabled={isLoading}
              className="pr-10"
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              disabled={isLoading}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-sm text-destructive">{errors.password.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Iniciar Sesión
        </Button>
      </form>

      {/* Ayuda de email no verificado */}
      {showVerificationHelp && (
        <Alert variant="destructive" className="border-red-200 bg-red-50 dark:bg-red-900/20">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Email no verificado</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>
              Tu cuenta aún no ha sido verificada. Por favor:
            </p>
            <ol className="text-xs space-y-1 list-decimal list-inside text-muted-foreground ml-4">
              <li>Revisa tu bandeja de entrada y carpeta SPAM</li>
              <li>Busca el email de verificación de CRMDev</li>
              <li>Haz clic en el enlace de verificación del email</li>
              <li>Si no encuentras el email, intenta iniciar sesión nuevamente para recibir otro</li>
            </ol>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => setShowVerificationHelp(false)}
            >
              Entendido
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <p className="text-center text-sm text-muted-foreground">
        ¿No tienes una cuenta?{" "}
        <Link href="/signup" className="text-primary hover:underline font-medium">
          Regístrate gratis
        </Link>
      </p>
    </motion.div>
  );
}
