"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ButtonLink } from "@/components/ButtonLink";
import { DashboardLayout } from "@/components/DashboardLayout";
import { PublicLinkQrCode } from "@/components/PublicLinkQrCode";
import { getSupabaseClient, type Company } from "@/lib/supabaseClient";

export default function EmpresasPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [origin, setOrigin] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [copiedCompanyId, setCopiedCompanyId] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);

    async function loadCompanies() {
      try {
        const supabase = getSupabaseClient();
        const { data: userData } = await supabase.auth.getUser();

        if (!userData.user) {
          throw new Error("Sessao expirada. Entre novamente.");
        }

        const { data, error } = await supabase
          .from("companies")
          .select(
            "id, user_id, name, slug, business_info, city, state, opening_time, closing_time, slot_interval_minutes, working_days, tone, whatsapp, created_at"
          )
          .eq("user_id", userData.user.id)
          .order("created_at", { ascending: false });

        if (error) {
          throw error;
        }

        setCompanies(data || []);
      } catch (error) {
        const friendlyMessage =
          error instanceof Error ? error.message : "Nao foi possivel carregar empresas.";
        setErrorMessage(friendlyMessage);
      } finally {
        setIsLoading(false);
      }
    }

    loadCompanies();
  }, []);

  const publicLinks = useMemo(
    () =>
      new Map(
        companies.map((company) => [
          company.id,
          origin && company.slug ? `${origin}/chat/${company.slug}` : ""
        ])
      ),
    [companies, origin]
  );

  async function copyLink(company: Company) {
    const publicLink = publicLinks.get(company.id);

    if (!publicLink) {
      return;
    }

    try {
      await navigator.clipboard.writeText(publicLink);
      setCopiedCompanyId(company.id);
    } catch {
      setCopiedCompanyId("");
    }
  }

  return (
    <DashboardLayout
      title="Empresas"
      description="Gerencie clientes, links publicos e cadastros do assistente."
    >
      <div className="flex justify-end">
        <ButtonLink href="/dashboard/empresas/nova">Nova empresa</ButtonLink>
      </div>

      {isLoading && (
        <div className="mt-6 rounded-lg border border-ink/10 bg-white px-5 py-6 text-sm font-semibold text-ink/60">
          Carregando empresas...
        </div>
      )}

      {errorMessage && !isLoading && (
        <div className="mt-6 rounded-lg border border-coral/30 bg-coral/10 px-5 py-6 text-sm font-semibold text-ink">
          {errorMessage}
        </div>
      )}

      {!isLoading && !errorMessage && companies.length === 0 && (
        <div className="mt-6 rounded-lg border border-dashed border-ink/20 bg-white px-5 py-12 text-center">
          <p className="text-lg font-black">Nenhuma empresa cadastrada</p>
          <p className="mt-2 text-sm text-ink/55">
            Crie a primeira empresa para gerar um link publico de atendimento.
          </p>
        </div>
      )}

      {!isLoading && !errorMessage && companies.length > 0 && (
        <div className="mt-6 grid gap-4">
          {companies.map((company) => {
            const publicLink = publicLinks.get(company.id);

            return (
              <article
                key={company.id}
                className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <h2 className="text-xl font-black tracking-tight">{company.name}</h2>
                    <p className="mt-1 text-sm font-semibold text-ink/55">
                      {[company.city, company.state].filter(Boolean).join(" - ") ||
                        "Cidade e estado nao informados"}
                    </p>
                    <p className="mt-3 break-all rounded-md bg-cloud px-3 py-2 font-mono text-sm text-ink/70">
                      {publicLink || `/chat/${company.slug}`}
                    </p>
                    <p className="mt-2 text-xs font-bold uppercase tracking-[0.14em] text-coral">
                      Slug: {company.slug}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap lg:max-w-sm lg:justify-end">
                    <Link
                      href={`/dashboard/empresas/${company.id}/editar`}
                      className="inline-flex min-h-11 items-center justify-center rounded-md bg-cloud px-4 text-sm font-semibold transition hover:bg-mint"
                    >
                      Editar
                    </Link>
                    <a
                      href={`/chat/${company.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-h-11 items-center justify-center rounded-md bg-ink px-4 text-sm font-semibold text-white transition hover:bg-moss"
                    >
                      Abrir chat publico
                    </a>
                    <button
                      type="button"
                      onClick={() => copyLink(company)}
                      disabled={!publicLink}
                      className="min-h-11 rounded-md bg-white px-4 text-sm font-semibold text-ink ring-1 ring-ink/10 transition hover:bg-mint disabled:cursor-not-allowed disabled:text-ink/35"
                    >
                      {copiedCompanyId === company.id ? "Link copiado" : "Copiar link"}
                    </button>
                    {publicLink && (
                      <PublicLinkQrCode
                        companyName={company.name}
                        publicLink={publicLink}
                      />
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
