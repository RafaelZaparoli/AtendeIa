import type { Company } from "@/lib/supabaseClient";

export type CompanyFormData = {
  name: string;
  slug: string;
  city: string;
  state: string;
  whatsapp: string;
  openingTime: string;
  closingTime: string;
  slotIntervalMinutes: string;
  workingDays: string[];
  servicesAndPrices: string;
  businessHours: string;
  address: string;
  paymentMethods: string;
  faqs: string;
  importantRules: string;
  tone: string;
};

export const emptyCompanyForm: CompanyFormData = {
  name: "",
  slug: "",
  city: "",
  state: "",
  whatsapp: "",
  openingTime: "09:00",
  closingTime: "18:00",
  slotIntervalMinutes: "30",
  workingDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
  servicesAndPrices: "",
  businessHours: "",
  address: "",
  paymentMethods: "",
  faqs: "",
  importantRules: "",
  tone: ""
};

export const companyFields: Array<{
  id: keyof CompanyFormData;
  label: string;
  textarea?: boolean;
  type?: string;
}> = [
  { id: "name", label: "Nome da empresa" },
  { id: "slug", label: "Slug" },
  { id: "city", label: "Cidade" },
  { id: "state", label: "Estado" },
  { id: "whatsapp", label: "WhatsApp" },
  { id: "openingTime", label: "Abertura para agendamentos", type: "time" },
  { id: "closingTime", label: "Fechamento para agendamentos", type: "time" },
  {
    id: "slotIntervalMinutes",
    label: "Intervalo entre horarios (minutos)",
    type: "number"
  },
  { id: "servicesAndPrices", label: "Servicos e precos", textarea: true },
  { id: "businessHours", label: "Horario de funcionamento" },
  { id: "address", label: "Endereco" },
  { id: "paymentMethods", label: "Formas de pagamento" },
  { id: "faqs", label: "Perguntas frequentes", textarea: true },
  { id: "importantRules", label: "Regras importantes", textarea: true },
  { id: "tone", label: "Tom da IA" }
];

export function createCompanySlug(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function buildCompanyBusinessInfo(form: CompanyFormData) {
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

function readBusinessInfoValue(businessInfo: string, label: string) {
  const normalizedLabel = label.toLowerCase();
  const line = businessInfo
    .split("\n")
    .find((item) => item.toLowerCase().startsWith(`${normalizedLabel}:`));

  return line?.split(":").slice(1).join(":").trim() || "";
}

export function buildCompanyForm(company: Company): CompanyFormData {
  return {
    name: company.name || "",
    slug: company.slug || createCompanySlug(company.name),
    city: company.city || readBusinessInfoValue(company.business_info, "Cidade"),
    state: company.state || readBusinessInfoValue(company.business_info, "Estado"),
    whatsapp: company.whatsapp || "",
    openingTime: company.opening_time?.slice(0, 5) || emptyCompanyForm.openingTime,
    closingTime: company.closing_time?.slice(0, 5) || emptyCompanyForm.closingTime,
    slotIntervalMinutes: String(
      company.slot_interval_minutes || emptyCompanyForm.slotIntervalMinutes
    ),
    workingDays: company.working_days?.length
      ? company.working_days
      : emptyCompanyForm.workingDays,
    servicesAndPrices: readBusinessInfoValue(company.business_info, "Servicos e precos"),
    businessHours: readBusinessInfoValue(
      company.business_info,
      "Horario de funcionamento"
    ),
    address: readBusinessInfoValue(company.business_info, "Endereco"),
    paymentMethods: readBusinessInfoValue(company.business_info, "Formas de pagamento"),
    faqs: readBusinessInfoValue(company.business_info, "Perguntas frequentes"),
    importantRules: readBusinessInfoValue(company.business_info, "Regras importantes"),
    tone: company.tone || ""
  };
}
