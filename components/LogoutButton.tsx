"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabaseClient";

export function LogoutButton() {
  const router = useRouter();
  const [isLeaving, setIsLeaving] = useState(false);

  async function logout() {
    setIsLeaving(true);
    const supabase = getSupabaseClient();
    await supabase.auth.signOut({ scope: "local" });
    router.replace("/login");
  }

  return (
    <button
      type="button"
      onClick={logout}
      disabled={isLeaving}
      className="rounded-md bg-cloud px-3 py-2 text-xs font-semibold text-ink transition hover:bg-mint disabled:cursor-not-allowed disabled:text-ink/40"
    >
      {isLeaving ? "Saindo..." : "Sair"}
    </button>
  );
}
