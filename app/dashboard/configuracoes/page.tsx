"use client";

import { FormEvent, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { getSupabaseClient } from "@/lib/supabaseClient";

type CompanyForm = {
  name: string;
  servicesAndPrices: string;
  businessHours: string;
  address: string;
  paymentMethods: string;
  faqs: string;
  importantRules: string;
  tone: string;
  whatsapp: string;
};

const initialForm: CompanyForm = {
  name: "Clara Studio de Beleza",
  servicesAndPrices: "Corte feminino R$ 90; Escova R$ 70; Manicure R$ 45",
  businessHours: "Segunda a sexta, 9h as 19h. Sabado, 9h as 14h.",
  address: "Rua das Flores, 120 - Centro",
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
}> = [
  { id: "name", label: "Nome da empresa" },
  { id: "servicesAndPrices", label: "Servicos e precos", textarea: true },
  { id: "businessHours", label: "Horario de funcionamento" },
  { id: "address", label: "Endereco" },
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
    `Formas de pagamento: ${form.paymentMethods}`,
    `Perguntas frequentes: ${form.faqs}`,
    `Regras importantes: ${form.importantRules}`
  ].join("\n");
}

export default function ConfiguracoesPage() {
  const [form, setForm] = useState<CompanyForm>(initialForm);
  const [isSaving, setIsSaving] = useState(false);
  const [savedCompanyId, setSavedCompanyId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  function updateField(field: keyof CompanyForm, value: string) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value
    }));
  }

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

      const supabase = getSupabaseClient();
      const businessInfo = buildBusinessInfo(form);

      const { data, error } = await supabase
        .from("companies")
        .insert({
          name: form.name.trim(),
          business_info: businessInfo,
          tone: form.tone.trim(),
          whatsapp: form.whatsapp.trim()
        })
        .select("id")
        .single();

      if (error) {
        throw error;
      }

      setSavedCompanyId(data.id);
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
                  value={form[field.id]}
                  onChange={(event) => updateField(field.id, event.target.value)}
                  className="mt-2 w-full rounded-md border border-ink/10 bg-cloud px-4 py-3 text-sm outline-none transition focus:border-moss focus:bg-white"
                />
              )}
            </label>
          ))}
        </div>

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
