import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">


      {/* Auth form */}
      <div className="w-full flex items-center justify-center p-8">
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
