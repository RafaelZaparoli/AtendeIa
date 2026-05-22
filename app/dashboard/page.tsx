"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { StatCard } from "@/components/StatCard";
import {
  getSupabaseClient,
  type Appointment,
  type Company,
  type Conversation
} from "@/lib/supabaseClient";

type DashboardCompany = Pick<Company, "id" | "name">;
type DashboardConversation = Pick<
  Conversation,
  "id" | "company_id" | "customer_message" | "ai_response" | "created_at"
>;
type DashboardAppointment = Pick<
  Appointment,
  | "id"
  | "company_id"
  | "customer_name"
  | "service"
  | "appointment_date"
  | "appointment_time"
  | "status"
  | "created_at"
>;

const quickLinks = [
  {
    href: "/dashboard/empresas",
    title: "Empresas",
    text: "Cadastros, links publicos e QR Codes."
  },
  {
    href: "/dashboard/conversas",
    title: "Conversas",
    text: "Historico completo de atendimentos."
  },
  {
    href: "/dashboard/agendamentos",
    title: "Agendamentos",
    text: "Solicitacoes, confirmacoes e cancelamentos."
  }
];

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function formatAppointmentDate(date: string, time: string) {
  const formattedDate = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(new Date(`${date}T00:00:00`));

  return `${formattedDate} as ${time.slice(0, 5)}`;
}

export default function DashboardPage() {
  const [companies, setCompanies] = useState<DashboardCompany[]>([]);
  const [conversations, setConversations] = useState<DashboardConversation[]>([]);
  const [appointments, setAppointments] = useState<DashboardAppointment[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState("todas");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const supabase = getSupabaseClient();
        const { data: userData } = await supabase.auth.getUser();

        if (!userData.user) {
          throw new Error("Sessao expirada. Entre novamente.");
        }

        const { data: companyData, error: companiesError } = await supabase
          .from("companies")
          .select("id, name")
          .eq("user_id", userData.user.id)
          .order("created_at", { ascending: false });

        if (companiesError) {
          throw companiesError;
        }

        const loadedCompanies = companyData || [];
        const companyIds = loadedCompanies.map((company) => company.id);

        setCompanies(loadedCompanies);

        if (companyIds.length === 0) {
          setConversations([]);
          setAppointments([]);
          return;
        }

        const [conversationResponse, appointmentResponse] = await Promise.all([
          supabase
            .from("conversations")
            .select("id, company_id, customer_message, ai_response, created_at")
            .in("company_id", companyIds)
            .order("created_at", { ascending: false }),
          supabase
            .from("appointments")
            .select(
              "id, company_id, customer_name, service, appointment_date, appointment_time, status, created_at"
            )
            .in("company_id", companyIds)
            .order("created_at", { ascending: false })
        ]);

        if (conversationResponse.error) {
          throw conversationResponse.error;
        }

        if (appointmentResponse.error) {
          throw appointmentResponse.error;
        }

        setConversations(conversationResponse.data || []);
        setAppointments(appointmentResponse.data || []);
      } catch (error) {
        const friendlyMessage =
          error instanceof Error
            ? error.message
            : "Nao foi possivel carregar o resumo do dashboard.";
        setErrorMessage(friendlyMessage);
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const companyNames = useMemo(
    () => new Map(companies.map((company) => [company.id, company.name])),
    [companies]
  );

  const filteredConversations = useMemo(
    () =>
      selectedCompanyId === "todas"
        ? conversations
        : conversations.filter(
            (conversation) => conversation.company_id === selectedCompanyId
          ),
    [conversations, selectedCompanyId]
  );

  const filteredAppointments = useMemo(
    () =>
      selectedCompanyId === "todas"
        ? appointments
        : appointments.filter(
            (appointment) => appointment.company_id === selectedCompanyId
          ),
    [appointments, selectedCompanyId]
  );

  const recentConversations = filteredConversations.slice(0, 4);
  const recentAppointments = filteredAppointments.slice(0, 4);
  const pendingAppointments = filteredAppointments.filter(
    (appointment) => appointment.status === "pendente"
  ).length;
  const confirmedAppointments = filteredAppointments.filter(
    (appointment) => appointment.status === "confirmado"
  ).length;
  return (
    <DashboardLayout
      title="Resumo do atendimento"
      description="Dados reais de empresas, conversas e agendamentos salvos no Supabase."
    >
      <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-xl font-black tracking-tight">Relatorio simples</h2>
            <p className="mt-1 text-sm leading-6 text-ink/55">
              Acompanhe o movimento recente do atendimento e dos horarios.
            </p>
          </div>
          <label className="w-full md:max-w-xs">
            <span className="text-sm font-bold text-ink/70">Empresa</span>
            <select
              value={selectedCompanyId}
              onChange={(event) => setSelectedCompanyId(event.target.value)}
              disabled={companies.length === 0}
              className="mt-2 min-h-11 w-full rounded-md border border-ink/10 bg-cloud px-4 text-sm font-semibold outline-none transition focus:border-moss focus:bg-white disabled:cursor-not-allowed disabled:text-ink/35"
            >
              <option value="todas">Todas as empresas</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        {isLoading && (
          <div className="mt-5 rounded-lg border border-ink/10 bg-cloud px-4 py-5 text-sm font-semibold text-ink/60">
            Carregando resumo...
          </div>
        )}

        {errorMessage && !isLoading && (
          <div className="mt-5 rounded-lg border border-coral/30 bg-coral/10 px-4 py-5 text-sm font-semibold text-ink">
            {errorMessage}
          </div>
        )}

        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard
            label="Total de empresas"
            value={isLoading ? "..." : String(companies.length)}
            detail="Cadastros do usuario"
          />
          <StatCard
            label="Total de conversas"
            value={isLoading ? "..." : String(filteredConversations.length)}
            detail="Atendimentos salvos"
          />
          <StatCard
            label="Total de agendamentos"
            value={isLoading ? "..." : String(filteredAppointments.length)}
            detail="Solicitacoes registradas"
          />
          <StatCard
            label="Pendentes"
            value={isLoading ? "..." : String(pendingAppointments)}
            detail="Aguardam confirmacao"
          />
          <StatCard
            label="Confirmados"
            value={isLoading ? "..." : String(confirmedAppointments)}
            detail="Horarios reservados"
          />
        </div>
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-2">
        <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm md:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-black tracking-tight">Ultimas conversas</h2>
              <p className="mt-1 text-sm text-ink/55">
                Perguntas recentes feitas no chat.
              </p>
            </div>
            <Link
              href="/dashboard/conversas"
              className="rounded-md bg-cloud px-3 py-2 text-xs font-bold transition hover:bg-mint"
            >
              Ver todas
            </Link>
          </div>

          {!isLoading && !errorMessage && recentConversations.length === 0 && (
            <div className="mt-5 rounded-lg border border-dashed border-ink/20 bg-cloud px-4 py-8 text-center">
              <p className="font-black">Nenhuma conversa neste filtro</p>
              <p className="mt-2 text-sm text-ink/55">
                Envie uma mensagem pelo chat publico ou demo para criar historico.
              </p>
            </div>
          )}

          {recentConversations.length > 0 && (
            <div className="mt-5 grid gap-3">
              {recentConversations.map((conversation) => (
                <article
                  key={conversation.id}
                  className="rounded-lg border border-ink/10 bg-cloud p-4"
                >
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-coral">
                      {companyNames.get(conversation.company_id) ||
                        conversation.company_id}
                    </p>
                    <p className="text-xs font-semibold text-ink/45">
                      {formatDateTime(conversation.created_at)}
                    </p>
                  </div>
                  <p className="mt-3 line-clamp-2 break-words text-sm font-semibold text-ink">
                    {conversation.customer_message}
                  </p>
                  <p className="mt-2 line-clamp-2 break-words text-sm leading-6 text-ink/60">
                    {conversation.ai_response}
                  </p>
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm md:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-black tracking-tight">
                Ultimos agendamentos
              </h2>
              <p className="mt-1 text-sm text-ink/55">
                Solicitacoes recentes dos clientes.
              </p>
            </div>
            <Link
              href="/dashboard/agendamentos"
              className="rounded-md bg-cloud px-3 py-2 text-xs font-bold transition hover:bg-mint"
            >
              Ver todos
            </Link>
          </div>

          {!isLoading && !errorMessage && recentAppointments.length === 0 && (
            <div className="mt-5 rounded-lg border border-dashed border-ink/20 bg-cloud px-4 py-8 text-center">
              <p className="font-black">Nenhum agendamento neste filtro</p>
              <p className="mt-2 text-sm text-ink/55">
                As solicitacoes feitas no chat aparecerao aqui.
              </p>
            </div>
          )}

          {recentAppointments.length > 0 && (
            <div className="mt-5 grid gap-3">
              {recentAppointments.map((appointment) => (
                <article
                  key={appointment.id}
                  className="rounded-lg border border-ink/10 bg-cloud p-4"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-coral">
                        {companyNames.get(appointment.company_id) ||
                          appointment.company_id}
                      </p>
                      <p className="mt-2 break-words font-black">
                        {appointment.customer_name}
                      </p>
                    </div>
                    <span className="w-fit rounded-full border border-ink/10 bg-white px-3 py-1 text-xs font-bold capitalize text-ink/65">
                      {appointment.status}
                    </span>
                  </div>
                  <div className="mt-3 grid gap-1 text-sm text-ink/60">
                    <p className="break-words font-semibold text-ink">
                      {appointment.service}
                    </p>
                    <p>
                      {formatAppointmentDate(
                        appointment.appointment_date,
                        appointment.appointment_time
                      )}
                    </p>
                    <p>Solicitado em {formatDateTime(appointment.created_at)}</p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="mt-6 rounded-lg border border-ink/10 bg-white p-5 shadow-sm md:p-6">
        <h2 className="text-xl font-black tracking-tight">Acessos rapidos</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg border border-ink/10 p-4 transition hover:border-moss hover:bg-mint"
            >
              <p className="font-black">{link.title}</p>
              <p className="mt-1 text-sm leading-6 text-ink/60">{link.text}</p>
            </Link>
          ))}
        </div>
      </section>
    </DashboardLayout>
  );
}
