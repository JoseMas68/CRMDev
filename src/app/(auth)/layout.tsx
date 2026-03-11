import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">


      {/* Left side - Logo only */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/80" />
        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-2 font-bold text-2xl text-primary-foreground">
            <div className="h-12 w-12 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center">
              <span className="font-bold text-xl">C</span>
            </div>
            CRMDev
          </Link>
        </div>
        {/* Decorative elements */}
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/5" />
        <div className="absolute -left-12 -bottom-12 h-64 w-64 rounded-full bg-white/5" />
      </div>

      {/* Right side - Auth form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden text-center">
            <Link href="/" className="inline-flex items-center gap-2 font-bold text-xl">
              CRMDev
            </Link>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
