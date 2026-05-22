"use client";

import { FormEvent, useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { workingDayOptions } from "@/lib/companySchedule";
import { getSupabaseClient, type Company } from "@/lib/supabaseClient";

type CompanyForm = {
  name: string;
  slug: string;
  servicesAndPrices: string;
  businessHours: string;
  address: string;
  city: string;
  state: string;
  openingTime: string;
  closingTime: string;
  slotIntervalMinutes: string;
  workingDays: string[];
  paymentMethods: string;
  faqs: string;
  importantRules: string;
  tone: string;
  whatsapp: string;
};

const initialForm: CompanyForm = {
  name: "Clara Studio de Beleza",
  slug: "clara-studio-de-beleza",
  servicesAndPrices: "Corte feminino R$ 90; Escova R$ 70; Manicure R$ 45",
  businessHours: "Segunda a sexta, 9h as 19h. Sabado, 9h as 14h.",
  address: "Rua das Flores, 120 - Centro",
  city: "Sao Paulo",
  state: "SP",
  openingTime: "09:00",
  closingTime: "19:00",
  slotIntervalMinutes: "30",
  workingDays: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"],
  paymentMethods: "Pix, dinheiro, cartao de debito e credito",
  faqs: "Precisa agendar? Sim. Atende criancas? Sim, a partir de 8 anos.",
  importantRules:
    "Cancelamentos com menos de 2h podem ter taxa. Chegar com 10 minutos de antecedencia.",
  tone: "Amigavel, claro e objetivo",
  whatsapp: "(11) 99999-1234"
};

const fields: Array<{
  id: keyof CompanyForm;
  label: string;
  textarea?: boolean;
  type?: string;
}> = [
  { id: "name", label: "Nome da empresa" },
  { id: "slug", label: "Slug do link publico" },
  { id: "servicesAndPrices", label: "Servicos e precos", textarea: true },
  { id: "businessHours", label: "Horario de funcionamento" },
  { id: "address", label: "Endereco" },
  { id: "city", label: "Cidade" },
  { id: "state", label: "Estado" },
  { id: "openingTime", label: "Abertura para agendamentos", type: "time" },
  { id: "closingTime", label: "Fechamento para agendamentos", type: "time" },
  {
    id: "slotIntervalMinutes",
    label: "Intervalo entre horarios (minutos)",
    type: "number"
  },
  { id: "paymentMethods", label: "Formas de pagamento" },
  { id: "faqs", label: "Perguntas frequentes", textarea: true },
  { id: "importantRules", label: "Regras importantes", textarea: true },
  { id: "tone", label: "Tom da IA" },
  { id: "whatsapp", label: "WhatsApp" }
];

function buildBusinessInfo(form: CompanyForm) {
  return [
    `Nome da empresa: ${form.name}`,
    `Servicos e precos: ${form.servicesAndPrices}`,
    `Horario de funcionamento: ${form.businessHours}`,
    `Endereco: ${form.address}`,
    `Cidade: ${form.city}`,
    `Estado: ${form.state}`,
    `Formas de pagamento: ${form.paymentMethods}`,
    `Perguntas frequentes: ${form.faqs}`,
    `Regras importantes: ${form.importantRules}`
  ].join("\n");
}

function createSlug(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function readBusinessInfoValue(businessInfo: string, label: string) {
  const normalizedLabel = label.toLowerCase();
  const line = businessInfo
    .split("\n")
    .find((item) => item.toLowerCase().startsWith(`${normalizedLabel}:`));

  return line?.split(":").slice(1).join(":").trim() || "";
}

function buildFormFromCompany(company: Company): CompanyForm {
  return {
    name: company.name || initialForm.name,
    slug: company.slug || createSlug(company.name) || initialForm.slug,
    servicesAndPrices:
      readBusinessInfoValue(company.business_info, "Servicos e precos") ||
      initialForm.servicesAndPrices,
    businessHours:
      readBusinessInfoValue(company.business_info, "Horario de funcionamento") ||
      initialForm.businessHours,
    address: readBusinessInfoValue(company.business_info, "Endereco") || initialForm.address,
    city:
      company.city ||
      readBusinessInfoValue(company.business_info, "Cidade") ||
      initialForm.city,
    state:
      company.state ||
      readBusinessInfoValue(company.business_info, "Estado") ||
      initialForm.state,
    openingTime: company.opening_time?.slice(0, 5) || initialForm.openingTime,
    closingTime: company.closing_time?.slice(0, 5) || initialForm.closingTime,
    slotIntervalMinutes: String(
      company.slot_interval_minutes || initialForm.slotIntervalMinutes
    ),
    workingDays: company.working_days?.length
      ? company.working_days
      : initialForm.workingDays,
    paymentMethods:
      readBusinessInfoValue(company.business_info, "Formas de pagamento") ||
      initialForm.paymentMethods,
    faqs:
      readBusinessInfoValue(company.business_info, "Perguntas frequentes") ||
      initialForm.faqs,
    importantRules:
      readBusinessInfoValue(company.business_info, "Regras importantes") ||
      initialForm.importantRules,
    tone: company.tone || initialForm.tone,
    whatsapp: company.whatsapp || initialForm.whatsapp
  };
}

export default function ConfiguracoesPage() {
  const [form, setForm] = useState<CompanyForm>(initialForm);
  const [isSlugEdited, setIsSlugEdited] = useState(false);
  const [loadedCompanyId, setLoadedCompanyId] = useState<string | null>(null);
  const [isLoadingCompany, setIsLoadingCompany] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedCompanyId, setSavedCompanyId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [publicLink, setPublicLink] = useState("");
  const [copyMessage, setCopyMessage] = useState("");

  function updateField(field: keyof CompanyForm, value: string) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value
    }));
  }

  function updateName(value: string) {
    setForm((currentForm) => ({
      ...currentForm,
      name: value,
      slug: isSlugEdited ? currentForm.slug : createSlug(value)
    }));
  }

  function updateSlug(value: string) {
    setIsSlugEdited(true);
    updateField("slug", createSlug(value));
  }

  function toggleWorkingDay(day: string) {
    setForm((currentForm) => ({
      ...currentForm,
      workingDays: currentForm.workingDays.includes(day)
        ? currentForm.workingDays.filter((workingDay) => workingDay !== day)
        : [...currentForm.workingDays, day]
    }));
  }

  async function copyPublicLink() {
    try {
      await navigator.clipboard.writeText(publicLink);
      setCopyMessage("Link copiado.");
    } catch {
      setCopyMessage("Nao foi possivel copiar o link.");
    }
  }

  useEffect(() => {
    if (!form.slug) {
      setPublicLink("");
      return;
    }

    setPublicLink(`${window.location.origin}/chat/${form.slug}`);
  }, [form.slug]);

  useEffect(() => {
    async function loadLatestCompany() {
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
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          throw error;
        }

        if (data) {
          setLoadedCompanyId(data.id);
          setSavedCompanyId(data.id);
          setIsSlugEdited(Boolean(data.slug));
          setForm(buildFormFromCompany(data));
        }
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Nao foi possivel carregar a empresa existente.";
        setErrorMessage(message);
      } finally {
        setIsLoadingCompany(false);
      }
    }

    loadLatestCompany();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setSuccessMessage("");
    setErrorMessage("");
    setSavedCompanyId(null);

    try {
      if (!form.name.trim()) {
        throw new Error("Informe o nome da empresa antes de salvar.");
      }

      if (!form.slug.trim()) {
        throw new Error("Informe o slug do link publico antes de salvar.");
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

      const supabase = getSupabaseClient();
      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) {
        throw new Error("Sessao expirada. Entre novamente.");
      }

      const businessInfo = buildBusinessInfo(form);
      const payload = {
        name: form.name.trim(),
        slug: createSlug(form.slug),
        business_info: businessInfo,
        city: form.city.trim(),
        state: form.state.trim(),
        opening_time: form.openingTime,
        closing_time: form.closingTime,
        slot_interval_minutes: interval,
        working_days: form.workingDays,
        tone: form.tone.trim(),
        whatsapp: form.whatsapp.trim()
      };

      const query = loadedCompanyId
        ? supabase
            .from("companies")
            .update(payload)
            .eq("id", loadedCompanyId)
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
      setLoadedCompanyId(data.id);
      setSuccessMessage("Empresa salva com sucesso no Supabase.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Nao foi possivel salvar a empresa. Tente novamente.";
      setErrorMessage(message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <DashboardLayout
      title="Configuracoes da empresa"
      description="Formulario visual para preparar a base de conhecimento que sera usada pelo atendimento com IA."
    >
      <form
        onSubmit={handleSubmit}
        className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm md:p-6"
      >
        {isLoadingCompany && (
          <div className="mb-5 rounded-lg border border-ink/10 bg-cloud px-4 py-3 text-sm font-semibold text-ink/60">
            Carregando dados da empresa...
          </div>
        )}

        <div className="grid gap-5 md:grid-cols-2">
          {fields.map((field) => (
            <label
              key={field.id}
              htmlFor={field.id}
              className={field.textarea ? "md:col-span-2" : undefined}
            >
              <span className="text-sm font-bold text-ink/70">{field.label}</span>
              {field.textarea ? (
                <textarea
                  id={field.id}
                  value={form[field.id]}
                  onChange={(event) => updateField(field.id, event.target.value)}
                  rows={4}
                  className="mt-2 w-full rounded-md border border-ink/10 bg-cloud px-4 py-3 text-sm leading-6 outline-none transition focus:border-moss focus:bg-white"
                />
              ) : (
                <input
                  id={field.id}
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
                  className="mt-2 w-full rounded-md border border-ink/10 bg-cloud px-4 py-3 text-sm outline-none transition focus:border-moss focus:bg-white"
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

        {(successMessage || errorMessage || savedCompanyId) && (
          <div className="mt-6 space-y-3">
            {successMessage && (
              <div className="rounded-lg border border-moss/20 bg-mint px-4 py-3 text-sm font-semibold text-moss">
                {successMessage}
              </div>
            )}
            {errorMessage && (
              <div className="rounded-lg border border-coral/30 bg-coral/10 px-4 py-3 text-sm font-semibold text-ink">
                {errorMessage}
              </div>
            )}
            {savedCompanyId && (
              <div className="rounded-lg border border-ink/10 bg-cloud px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-ink/45">
                  ID da empresa salva
                </p>
                <p className="mt-2 break-all font-mono text-sm font-bold text-ink">
                  {savedCompanyId}
                </p>
              </div>
            )}
            {savedCompanyId && (
              <div className="rounded-lg border border-ink/10 bg-white px-4 py-4 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-coral">
                  Link público do assistente
                </p>
                <p className="mt-2 text-sm leading-6 text-ink/60">
                  Envie este link para seus clientes ou coloque na bio do Instagram.
                </p>
                {publicLink ? (
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <p className="min-w-0 flex-1 break-all rounded-md bg-cloud px-4 py-3 font-mono text-sm font-bold text-ink">
                      {publicLink}
                    </p>
                    <button
                      type="button"
                      onClick={copyPublicLink}
                      className="min-h-11 rounded-md bg-ink px-4 text-sm font-semibold text-white transition hover:bg-moss"
                    >
                      Copiar link
                    </button>
                  </div>
                ) : (
                  <p className="mt-4 rounded-md border border-coral/30 bg-coral/10 px-4 py-3 text-sm font-semibold text-ink">
                    Preencha o slug para gerar o link público.
                  </p>
                )}
                {copyMessage && (
                  <p className="mt-3 text-sm font-semibold text-moss">{copyMessage}</p>
                )}
              </div>
            )}
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3 border-t border-ink/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-ink/55">
            Os dados serao salvos na tabela companies para uso no chat demo.
          </p>
          <button
            type="submit"
            disabled={isSaving}
            className="min-h-11 rounded-md bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-moss disabled:cursor-not-allowed disabled:bg-ink/45"
          >
            {isSaving ? "Salvando..." : "Salvar configuracoes"}
          </button>
        </div>
      </form>
    </DashboardLayout>
  );
}
