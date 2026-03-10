/**
 * Public Layout
 * Used for pages accessible without authentication (client portal, support forms, etc.)
 */

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
