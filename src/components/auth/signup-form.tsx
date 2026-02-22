"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Github, Mail, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

import { signUp, signIn } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Esquema de validación de registro
const signupSchema = z
  .object({
    name: z
      .string()
      .min(2, "El nombre debe tener al menos 2 caracteres")
      .max(100, "El nombre es muy largo"),
    email: z.string().email("Por favor ingresa un email válido"),
    password: z
      .string()
      .min(8, "La contraseña debe tener al menos 8 caracteres")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "La contraseña debe incluir mayúsculas, minúsculas y números"
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

type SignupInput = z.infer<typeof signupSchema>;

export function SignupForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isGitHubLoading, setIsGitHubLoading] = useState(false);
  const [showVerificationInfo, setShowVerificationInfo] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
  });

  async function onSubmit(data: SignupInput) {
    setIsLoading(true);

    try {
      const result = await signUp.email({
        email: data.email,
        password: data.password,
        name: data.name,
        callbackURL: "/select-org",
      });

      if (result.error) {
        toast.error(result.error.message || "Error al crear la cuenta");
        return;
      }

      // Mostrar información de verificación
      setShowVerificationInfo(true);
      toast.success(
        "¡Cuenta creada! Revisa tu email para verificar tu cuenta.",
        {
          duration: 6000,
        }
      );
    } catch (error) {
      console.error("Signup error:", error);
      toast.error("Error al crear la cuenta. Intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGitHubSignUp() {
    setIsGitHubLoading(true);
    try {
      await signIn.social({
        provider: "github",
        callbackURL: "/select-org",
      });
    } catch (error) {
      console.error("GitHub signup error:", error);
      toast.error("Error al registrarse con GitHub");
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
        <h1 className="text-2xl font-bold tracking-tight">Crea tu cuenta</h1>
        <p className="text-muted-foreground">
          Comienza a gestionar tus proyectos de forma inteligente
        </p>
      </div>

      {/* Botón de GitHub OAuth */}
      <Button
        type="button"
        variant="outline"
        className="w-full gap-2 h-11"
        onClick={handleGitHubSignUp}
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
          <Label htmlFor="name">Nombre completo</Label>
          <Input
            id="name"
            type="text"
            placeholder="Juan Developer"
            autoComplete="name"
            disabled={isLoading || isGitHubLoading}
            {...register("name")}
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>

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
          <Label htmlFor="password">Contraseña</Label>
          <Input
            id="password"
            type="password"
            placeholder="********"
            autoComplete="new-password"
            disabled={isLoading || isGitHubLoading}
            {...register("password")}
          />
          {errors.password && (
            <p className="text-sm text-destructive">{errors.password.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="********"
            autoComplete="new-password"
            disabled={isLoading || isGitHubLoading}
            {...register("confirmPassword")}
          />
          {errors.confirmPassword && (
            <p className="text-sm text-destructive">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isLoading || isGitHubLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Crear Cuenta
        </Button>
      </form>

      {/* Información de verificación de email */}
      {showVerificationInfo && (
        <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
          <Mail className="h-4 w-4" />
          <AlertTitle>Verifica tu email</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>
              Hemos enviado un email de verificación a <strong>tu correo electrónico</strong>.
            </p>
            <p className="text-xs">
              Por favor revisa:
            </p>
            <ul className="text-xs space-y-1 list-disc list-inside text-muted-foreground ml-4">
              <li>Tu bandeja de entrada principal</li>
              <li>La carpeta <strong>SPAM</strong> o correo no deseado</li>
            </ul>
            <p className="text-xs font-semibold">
              Haz clic en el enlace de verificación para activar tu cuenta.
            </p>
            <p className="text-[10px] text-muted-foreground">
              Si no recibes el email en 5 minutos, revisa que hayas escrito correctamente tu dirección de correo.
            </p>
          </AlertDescription>
        </Alert>
      )}

      <p className="text-center text-xs text-muted-foreground">
        Al crear una cuenta, aceptas nuestros{" "}
        <Link href="/terms" className="text-primary hover:underline">
          Términos de Servicio
        </Link>{" "}
        y{" "}
        <Link href="/privacy" className="text-primary hover:underline">
          Política de Privacidad
        </Link>
      </p>

      <p className="text-center text-sm text-muted-foreground">
        ¿Ya tienes una cuenta?{" "}
        <Link href="/login" className="text-primary hover:underline font-medium">
          Iniciar sesión
        </Link>
      </p>
    </motion.div>
  );
}
