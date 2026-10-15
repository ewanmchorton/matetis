import { redirect } from "next/navigation";

import { AdminLoginForm } from "@/features/admin-login";
import { getCurrentUser, isStaticPrototype } from "@/shared/auth/session";
import { routes } from "@/shared/config/routes";

export default async function AdminLoginPage() {
  const user = isStaticPrototype ? null : await getCurrentUser();
  if (user?.role === "admin") redirect(routes.admin);

  return (
    <main className="grid min-h-dvh place-items-center bg-muted/40 p-4">
      <AdminLoginForm signedInEmail={user?.email ?? null} />
    </main>
  );
}
