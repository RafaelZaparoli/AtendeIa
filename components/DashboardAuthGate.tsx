"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabaseClient";

export function DashboardAuthGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseClient();

    async function checkUser() {
      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        router.replace(`/login?next=${encodeURIComponent(pathname)}`);
        return;
      }

      setIsAuthenticated(true);
      setIsChecking(false);
    }

    checkUser();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        router.replace("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [pathname, router]);

  if (isChecking || !isAuthenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-cloud px-5 text-ink">
        <div className="rounded-lg border border-ink/10 bg-white px-6 py-5 text-sm font-semibold text-ink/60 shadow-sm">
          Verificando acesso...
        </div>
      </main>
    );
  }

  return children;
}
