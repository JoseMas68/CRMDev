import { Metadata } from "next";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = {
  title: "Crear cuenta",
  description: "Crea tu cuenta gratuita de CRMDev",
};

export default function SignupPage() {
  return <SignupForm />;
}
