import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import { Providers } from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "CRMDev - CRM para Desarrolladores",
    template: "%s | CRMDev",
  },
  description:
    "CRM diseñado para desarrolladores, freelancers y agencias tech. Gestiona proyectos, tareas, tiempo y sincroniza con GitHub.",
  keywords: [
    "CRM",
    "desarrolladores",
    "GitHub",
    "proyectos",
    "tareas",
    "tiempo",
    "freelancer",
    "agencias tech",
  ],
  authors: [{ name: "CRMDev Team" }],
  creator: "CRMDev",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  ),
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: "/",
    title: "CRMDev - CRM para Desarrolladores",
    description:
      "CRM diseñado para desarrolladores, freelancers y agencias tech. Gestiona proyectos, tareas, tiempo y sincroniza con GitHub.",
    siteName: "CRMDev",
  },
  twitter: {
    card: "summary_large_image",
    title: "CRMDev - CRM para Desarrolladores",
    description:
      "CRM diseñado para desarrolladores, freelancers y agencias tech. Gestiona proyectos, tareas, tiempo y sincroniza con GitHub.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <Providers>
          {children}
          <Toaster
            position="top-right"
            richColors
            closeButton
            toastOptions={{
              duration: 4000,
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
