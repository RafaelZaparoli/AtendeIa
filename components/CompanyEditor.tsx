"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  buildCompanyBusinessInfo,
  buildCompanyForm,
  companyFields,
  createCompanySlug,
  emptyCompanyForm,
  type CompanyFormData
} from "@/lib/companyForm";
import { workingDayOptions } from "@/lib/companySchedule";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { PublicLinkQrCode } from "@/components/PublicLinkQrCode";

export function CompanyEditor({ companyId }: { companyId?: string }) {
  const [form, setForm] = useState<CompanyFormData>(emptyCompanyForm);
  const [savedCompanyId, setSavedCompanyId] = useState(companyId || "");
  const [isSlugEdited, setIsSlugEdited] = useState(false);
  const [isLoading, setIsLoading] = useState(Boolean(companyId));
  const [isSaving, setIsSaving] = useState(false);
  const [publicLink, setPublicLink] = useState("");
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [copyMessage, setCopyMessage] = useState("");

  useEffect(() => {
    if (!form.slug) {
      setPublicLink("");
      return;
    }

    setPublicLink(`${window.location.origin}/chat/${form.slug}`);
  }, [form.slug]);

  useEffect(() => {
    async function loadCompany() {
      if (!companyId) {
        return;
      }

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
          .eq("id", companyId)
          .eq("user_id", userData.user.id)
          .maybeSingle();

        if (error) {
          throw error;
        }

        if (!data) {
          throw new Error("Empresa nao encontrada.");
        }

        setSavedCompanyId(data.id);
        setIsSlugEdited(Boolean(data.slug));
        setForm(buildCompanyForm(data));
      } catch (error) {
        const friendlyMessage =
          error instanceof Error ? error.message : "Nao foi possivel carregar a empresa.";
        setErrorMessage(friendlyMessage);
      } finally {
        setIsLoading(false);
      }
    }

    loadCompany();
  }, [companyId]);

  function updateField(field: keyof CompanyFormData, value: string) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value
    }));
  }

  function updateName(value: string) {
    setForm((currentForm) => ({
      ...currentForm,
      name: value,
      slug: isSlugEdited ? currentForm.slug : createCompanySlug(value)
    }));
  }

  function updateSlug(value: string) {
    setIsSlugEdited(true);
    updateField("slug", createCompanySlug(value));
  }

  function toggleWorkingDay(day: string) {
    setForm((currentForm) => ({
      ...currentForm,
      workingDays: currentForm.workingDays.includes(day)
        ? currentForm.workingDays.filter((workingDay) => workingDay !== day)
        : [...currentForm.workingDays, day]
    }));
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(publicLink);
      setCopyMessage("Link copiado.");
    } catch {
      setCopyMessage("Nao foi possivel copiar o link.");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");
    setErrorMessage("");

    try {
      if (!form.name.trim()) {
        throw new Error("Informe o nome da empresa.");
      }

      if (!form.slug.trim()) {
        throw new Error("Informe o slug da empresa.");
      }

      const interval = Number(form.slotIntervalMinutes);

      if (!form.workingDays.length) {
        throw new Error("Selecione ao menos um dia de atendimento.");
      }

      if (!form.openingTime || !form.closingTime || form.closingTime <= form.openingTime) {
        throw new Error("Informe um horario de abertura e fechamento validos.");
      }

      if (!Number.isInteger(interval) || interval < 5) {
        throw new Error("Informe um intervalo valido entre horarios.");
      }

      const payload = {
        name: form.name.trim(),
        slug: createCompanySlug(form.slug),
        city: form.city.trim(),
        state: form.state.trim(),
        whatsapp: form.whatsapp.trim(),
        tone: form.tone.trim(),
        opening_time: form.openingTime,
        closing_time: form.closingTime,
        slot_interval_minutes: interval,
        working_days: form.workingDays,
        business_info: buildCompanyBusinessInfo(form)
      };
      const supabase = getSupabaseClient();
      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) {
        throw new Error("Sessao expirada. Entre novamente.");
      }

      const query = companyId
        ? supabase
            .from("companies")
            .update(payload)
            .eq("id", companyId)
            .eq("user_id", userData.user.id)
        : supabase.from("companies").insert({
            ...payload,
            user_id: userData.user.id
          });
      const { data, error } = await query.select("id").single();

      if (error) {
        throw error;
      }

      setSavedCompanyId(data.id);
      setForm((currentForm) => ({
        ...currentForm,
        slug: payload.slug
      }));
      setMessage(companyId ? "Empresa atualizada com sucesso." : "Empresa criada com sucesso.");
    } catch (error) {
      const friendlyMessage =
        error instanceof Error ? error.message : "Nao foi possivel salvar a empresa.";
      setErrorMessage(friendlyMessage);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm md:p-6"
    >
      {isLoading && (
        <div className="mb-5 rounded-lg border border-ink/10 bg-cloud px-4 py-3 text-sm font-semibold text-ink/60">
          Carregando empresa...
        </div>
      )}
      <div className="grid gap-5 md:grid-cols-2">
        {companyFields.map((field) => (
          <label
            key={field.id}
            htmlFor={`company-${field.id}`}
            className={field.textarea ? "md:col-span-2" : undefined}
          >
            <span className="text-sm font-bold text-ink/70">{field.label}</span>
            {field.textarea ? (
              <textarea
                id={`company-${field.id}`}
                value={form[field.id]}
                onChange={(event) => updateField(field.id, event.target.value)}
                rows={4}
                className="mt-2 w-full rounded-md border border-ink/10 bg-cloud px-4 py-3 text-sm leading-6 outline-none transition focus:border-moss focus:bg-white"
              />
            ) : (
              <input
                id={`company-${field.id}`}
                type={field.type || "text"}
                min={field.type === "number" ? 5 : undefined}
                step={field.type === "number" ? 5 : undefined}
                value={form[field.id]}
                onChange={(event) => {
                  if (field.id === "name") {
                    updateName(event.target.value);
                    return;
                  }

                  if (field.id === "slug") {
                    updateSlug(event.target.value);
                    return;
                  }

                  updateField(field.id, event.target.value);
                }}
                className="mt-2 min-h-11 w-full rounded-md border border-ink/10 bg-cloud px-4 text-sm outline-none transition focus:border-moss focus:bg-white"
              />
            )}
          </label>
        ))}
      </div>

      <fieldset className="mt-5 rounded-lg border border-ink/10 bg-cloud p-4">
        <legend className="px-1 text-sm font-bold text-ink/70">
          Dias atendidos para agendamento
        </legend>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {workingDayOptions.map((day) => {
            const checked = form.workingDays.includes(day.value);

            return (
              <label
                key={day.value}
                className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-md border px-3 text-sm font-semibold transition ${
                  checked
                    ? "border-moss bg-mint text-moss"
                    : "border-ink/10 bg-white text-ink/60"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleWorkingDay(day.value)}
                  className="accent-moss"
                />
                {day.label}
              </label>
            );
          })}
        </div>
      </fieldset>

      {(message || errorMessage || savedCompanyId) && (
        <div className="mt-6 space-y-3">
          {message && (
            <div className="rounded-lg border border-moss/20 bg-mint px-4 py-3 text-sm font-semibold text-moss">
              {message}
            </div>
          )}
          {errorMessage && (
            <div className="rounded-lg border border-coral/30 bg-coral/10 px-4 py-3 text-sm font-semibold text-ink">
              {errorMessage}
            </div>
          )}
          {savedCompanyId && (
            <div className="rounded-lg border border-ink/10 bg-cloud px-4 py-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-coral">
                Link publico
              </p>
              {publicLink ? (
                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <p className="min-w-0 flex-1 break-all rounded-md bg-white px-4 py-3 font-mono text-sm font-bold">
                    {publicLink}
                  </p>
                  <button
                    type="button"
                    onClick={copyLink}
                    className="min-h-11 rounded-md bg-ink px-4 text-sm font-semibold text-white transition hover:bg-moss"
                  >
                    Copiar link
                  </button>
                  <PublicLinkQrCode
                    companyName={form.name || "Empresa"}
                    publicLink={publicLink}
                  />
                </div>
              ) : (
                <p className="mt-2 text-sm font-semibold text-ink/60">
                  Preencha o slug para gerar o link.
                </p>
              )}
              {copyMessage && (
                <p className="mt-2 text-sm font-semibold text-moss">{copyMessage}</p>
              )}
            </div>
          )}
        </div>
      )}

      <div className="mt-6 flex justify-end border-t border-ink/10 pt-5">
        <button
          disabled={isSaving || isLoading}
          className="min-h-11 rounded-md bg-ink px-5 text-sm font-semibold text-white transition hover:bg-moss disabled:cursor-not-allowed disabled:bg-ink/45"
        >
          {isSaving ? "Salvando..." : companyId ? "Salvar alteracoes" : "Criar empresa"}
        </button>
      </div>
    </form>
  );
}
