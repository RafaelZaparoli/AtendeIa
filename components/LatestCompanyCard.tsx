"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient, type Company } from "@/lib/supabaseClient";

export function LatestCompanyCard() {
  const [company, setCompany] = useState<Company | null>(null);

  useEffect(() => {
    async function loadCompany() {
      try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
          .from("companies")
          .select("id, name, business_info, city, state, tone, whatsapp, created_at")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          throw error;
        }

        setCompany(data);
      } catch {
        setCompany(null);
      }
    }

    loadCompany();
  }, []);

  if (!company?.city && !company?.state) {
    return null;
  }

  return (
    <div className="mt-5 rounded-lg border border-ink/10 bg-cloud p-4">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-coral">
        Empresa configurada
      </p>
      <p className="mt-2 font-black text-ink">{company.name}</p>
      <p className="mt-1 text-sm font-semibold text-ink/60">
        {[company.city, company.state].filter(Boolean).join(" - ")}
      </p>
    </div>
  );
}
