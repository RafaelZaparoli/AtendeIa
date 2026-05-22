"use client";

import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { getSupabaseClient, type Appointment } from "@/lib/supabaseClient";

type AppointmentStatus = Appointment["status"];
type StatusFilter = "todos" | AppointmentStatus;
type AppointmentUpdate = {
  id: string;
  status: Extract<AppointmentStatus, "confirmado" | "cancelado">;
};

type AppointmentWithCompany = Appointment & {
  companies?: {
    name: string | null;
  } | null;
};

const statusOptions: Array<{ value: StatusFilter; label: string }> = [
  { value: "todos", label: "Todos" },
  { value: "pendente", label: "Pendente" },
  { value: "confirmado", label: "Confirmado" },
  { value: "cancelado", label: "Cancelado" }
];

const statusClasses: Record<AppointmentStatus, string> = {
  pendente: "bg-coral/10 text-coral border-coral/20",
  confirmado: "bg-mint text-moss border-moss/20",
  cancelado: "bg-ink/10 text-ink/60 border-ink/10"
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(new Date(`${value}T00:00:00`));
}

function formatCreatedAt(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function getCompanyLabel(appointment: AppointmentWithCompany) {
  return appointment.companies?.name || appointment.company_id;
}

function formatWhatsappPhone(value: string) {
  const digits = value.replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  return digits.startsWith("55") ? digits : `55${digits}`;
}

function buildWhatsappLink(appointment: AppointmentWithCompany) {
  const phone = formatWhatsappPhone(appointment.customer_phone);

  if (!phone) {
    return "";
  }

  const message = `Olá, ${appointment.customer_name}. Recebemos sua solicitação de agendamento para ${appointment.service} no dia ${formatDate(
    appointment.appointment_date
  )} às ${appointment.appointment_time.slice(
    0,
    5
  )}. Podemos confirmar esse horário?`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export default function AgendamentosPage() {
  const [appointments, setAppointments] = useState<AppointmentWithCompany[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todos");
  const [isLoading, setIsLoading] = useState(true);
  const [updatingAppointment, setUpdatingAppointment] =
    useState<AppointmentUpdate | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    async function loadAppointments() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const supabase = getSupabaseClient();
        const { data: userData } = await supabase.auth.getUser();

        if (!userData.user) {
          throw new Error("Sessao expirada. Entre novamente.");
        }

        const { data: userCompanies, error: companiesError } = await supabase
          .from("companies")
          .select("id")
          .eq("user_id", userData.user.id);

        if (companiesError) {
          throw companiesError;
        }

        const companyIds = (userCompanies || []).map((company) => company.id);

        if (companyIds.length === 0) {
          setAppointments([]);
          return;
        }

        const responseWithCompany = await supabase
          .from("appointments")
          .select(
            "id, company_id, customer_name, customer_phone, service, appointment_date, appointment_time, notes, status, created_at, companies(name)"
          )
          .in("company_id", companyIds)
          .order("created_at", { ascending: false });

        if (!responseWithCompany.error) {
          setAppointments((responseWithCompany.data || []) as AppointmentWithCompany[]);
          return;
        }

        console.warn(
          "Could not load related company names:",
          responseWithCompany.error.message
        );

        const responseWithoutCompany = await supabase
          .from("appointments")
          .select(
            "id, company_id, customer_name, customer_phone, service, appointment_date, appointment_time, notes, status, created_at"
          )
          .in("company_id", companyIds)
          .order("created_at", { ascending: false });

        if (responseWithoutCompany.error) {
          throw responseWithoutCompany.error;
        }

        setAppointments((responseWithoutCompany.data || []) as AppointmentWithCompany[]);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Nao foi possivel carregar os agendamentos.";
        setErrorMessage(message);
      } finally {
        setIsLoading(false);
      }
    }

    loadAppointments();
  }, []);

  const filteredAppointments = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return appointments.filter((appointment) => {
      const matchesStatus =
        statusFilter === "todos" || appointment.status === statusFilter;

      if (!matchesStatus) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const searchableText = [
        appointment.customer_name,
        appointment.customer_phone,
        appointment.service,
        appointment.company_id,
        appointment.companies?.name || ""
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedSearch);
    });
  }, [appointments, search, statusFilter]);

  async function updateAppointmentStatus(
    appointment: AppointmentWithCompany,
    status: AppointmentUpdate["status"]
  ) {
    if (appointment.status !== "pendente") {
      return;
    }

    setUpdatingAppointment({
      id: appointment.id,
      status
    });
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from("appointments")
        .update({ status })
        .eq("id", appointment.id)
        .eq("company_id", appointment.company_id)
        .eq("status", "pendente")
        .select("id, status")
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error("Este agendamento ja foi atualizado. Recarregue a lista.");
      }

      setAppointments((currentAppointments) =>
        currentAppointments.map((appointment) =>
          appointment.id === data.id
            ? { ...appointment, status: data.status }
            : appointment
        )
      );
      setSuccessMessage(
        status === "confirmado"
          ? "Agendamento confirmado com sucesso."
          : "Agendamento cancelado com sucesso."
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Nao foi possivel atualizar o agendamento.";
      setErrorMessage(message);
    } finally {
      setUpdatingAppointment(null);
    }
  }

  return (
    <DashboardLayout
      title="Agendamentos"
      description="Solicitacoes de horario enviadas pelos clientes pelo chat demo."
    >
      <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-xl font-black tracking-tight">
              Agendamentos solicitados
            </h2>
            <p className="mt-1 text-sm text-ink/55">
              Busque por nome, telefone ou servico e filtre por status.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-[1fr_auto] lg:min-w-[560px]">
            <label>
              <span className="text-sm font-bold text-ink/70">Buscar</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Nome, telefone ou servico..."
                className="mt-2 min-h-11 w-full rounded-md border border-ink/10 bg-cloud px-4 text-sm outline-none transition focus:border-moss focus:bg-white"
              />
            </label>
            <label>
              <span className="text-sm font-bold text-ink/70">Status</span>
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as StatusFilter)
                }
                className="mt-2 min-h-11 w-full rounded-md border border-ink/10 bg-cloud px-4 text-sm font-semibold outline-none transition focus:border-moss focus:bg-white sm:w-44"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {isLoading && (
          <div className="mt-6 rounded-lg border border-ink/10 bg-cloud px-4 py-5 text-sm font-semibold text-ink/60">
            Carregando agendamentos...
          </div>
        )}

        {errorMessage && !isLoading && (
          <div className="mt-6 rounded-lg border border-coral/30 bg-coral/10 px-4 py-5 text-sm font-semibold text-ink">
            {errorMessage}
          </div>
        )}

        {successMessage && !isLoading && (
          <div className="mt-6 rounded-lg border border-moss/20 bg-mint px-4 py-5 text-sm font-semibold text-moss">
            {successMessage}
          </div>
        )}

        {!isLoading && !errorMessage && filteredAppointments.length === 0 && (
          <div className="mt-6 rounded-lg border border-dashed border-ink/20 bg-cloud px-4 py-10 text-center">
            <p className="font-black">
              {appointments.length === 0
                ? "Nenhum agendamento solicitado ainda"
                : "Nenhum agendamento encontrado"}
            </p>
            <p className="mt-2 text-sm text-ink/55">
              {appointments.length === 0
                ? "Quando um cliente solicitar horario pelo chat, ele aparecera aqui."
                : "Tente mudar a busca ou o filtro de status."}
            </p>
          </div>
        )}

        {!isLoading && !errorMessage && filteredAppointments.length > 0 && (
          <div className="mt-6 grid gap-4">
            {filteredAppointments.map((appointment) => {
              const whatsappLink = buildWhatsappLink(appointment);

              return (
                <article
                  key={appointment.id}
                  className="rounded-lg border border-ink/10 bg-cloud p-5"
                >
                <div className="flex flex-col gap-3 border-b border-ink/10 pb-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-coral">
                      <span className="break-words">{getCompanyLabel(appointment)}</span>
                    </p>
                    <h3 className="mt-2 text-lg font-black tracking-tight">
                      {appointment.customer_name}
                    </h3>
                    <p className="mt-1 break-all text-sm font-semibold text-ink/55">
                      {appointment.customer_phone}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <span
                      className={`w-fit rounded-full border px-3 py-1 text-xs font-bold capitalize ${
                        statusClasses[appointment.status]
                      }`}
                    >
                      {appointment.status}
                    </span>
                    {whatsappLink && (
                      <a
                        href={whatsappLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex min-h-9 items-center justify-center rounded-md bg-ink px-3 text-xs font-bold text-white transition hover:bg-moss"
                      >
                        Chamar no WhatsApp
                      </a>
                    )}
                    {appointment.status === "pendente" && (
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={updatingAppointment?.id === appointment.id}
                          onClick={() =>
                            updateAppointmentStatus(appointment, "confirmado")
                          }
                          className="min-h-9 rounded-md bg-moss px-3 text-xs font-bold text-white transition hover:bg-ink disabled:cursor-not-allowed disabled:bg-ink/25"
                        >
                          {updatingAppointment?.id === appointment.id &&
                          updatingAppointment.status === "confirmado"
                            ? "Atualizando..."
                            : "Confirmar"}
                        </button>
                        <button
                          type="button"
                          disabled={updatingAppointment?.id === appointment.id}
                          onClick={() =>
                            updateAppointmentStatus(appointment, "cancelado")
                          }
                          className="min-h-9 rounded-md bg-white px-3 text-xs font-bold text-ink ring-1 ring-ink/10 transition hover:bg-coral/10 hover:text-coral disabled:cursor-not-allowed disabled:bg-ink/5 disabled:text-ink/35"
                        >
                          {updatingAppointment?.id === appointment.id &&
                          updatingAppointment.status === "cancelado"
                            ? "Atualizando..."
                            : "Cancelar"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  <div className="rounded-lg bg-white p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink/45">
                      Serviço
                    </p>
                    <p className="mt-2 break-words text-sm font-semibold text-ink">
                      {appointment.service}
                    </p>
                  </div>
                  <div className="rounded-lg bg-white p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink/45">
                      Data e horário
                    </p>
                    <p className="mt-2 text-sm font-semibold text-ink">
                      {formatDate(appointment.appointment_date)} às{" "}
                      {appointment.appointment_time}
                    </p>
                  </div>
                  <div className="rounded-lg bg-white p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink/45">
                      Solicitado em
                    </p>
                    <p className="mt-2 text-sm font-semibold text-ink">
                      {formatCreatedAt(appointment.created_at)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-lg bg-white p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink/45">
                    Observações
                  </p>
                  <p className="mt-2 whitespace-pre-line text-sm leading-6 text-ink">
                    <span className="break-words">
                      {appointment.notes || "Sem observações."}
                    </span>
                  </p>
                </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </DashboardLayout>
  );
}
