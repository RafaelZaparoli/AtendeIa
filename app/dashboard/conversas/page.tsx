"use client";

import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { StatCard } from "@/components/StatCard";
import { getSupabaseClient, type Conversation } from "@/lib/supabaseClient";

type ConversationWithCompany = Conversation & {
  companies?: {
    name: string | null;
  } | null;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function isToday(value: string) {
  const date = new Date(value);
  const today = new Date();

  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

function getCompanyLabel(conversation: ConversationWithCompany) {
  return conversation.companies?.name || conversation.company_id;
}

export default function ConversasPage() {
  const [conversations, setConversations] = useState<ConversationWithCompany[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadConversations() {
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
          setConversations([]);
          return;
        }

        const responseWithCompany = await supabase
          .from("conversations")
          .select(
            "id, company_id, customer_message, ai_response, created_at, companies(name)"
          )
          .in("company_id", companyIds)
          .order("created_at", { ascending: false });

        if (!responseWithCompany.error) {
          setConversations((responseWithCompany.data || []) as ConversationWithCompany[]);
          return;
        }

        console.warn(
          "Could not load related company names:",
          responseWithCompany.error.message
        );

        const responseWithoutCompany = await supabase
          .from("conversations")
          .select("id, company_id, customer_message, ai_response, created_at")
          .in("company_id", companyIds)
          .order("created_at", { ascending: false });

        if (responseWithoutCompany.error) {
          throw responseWithoutCompany.error;
        }

        setConversations((responseWithoutCompany.data || []) as ConversationWithCompany[]);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Nao foi possivel carregar as conversas.";
        setErrorMessage(message);
      } finally {
        setIsLoading(false);
      }
    }

    loadConversations();
  }, []);

  const filteredConversations = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return conversations;
    }

    return conversations.filter((conversation) => {
      const searchableText = [
        conversation.customer_message,
        conversation.ai_response,
        conversation.company_id,
        conversation.companies?.name || ""
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedSearch);
    });
  }, [conversations, search]);

  const conversationsToday = conversations.filter((conversation) =>
    isToday(conversation.created_at)
  ).length;

  const lastConversation = conversations[0];

  return (
    <DashboardLayout
      title="Historico de conversas"
      description="Lista real de atendimentos salvos no Supabase pela API de chat."
    >
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Total de conversas"
          value={String(conversations.length)}
          detail="Registros salvos no Supabase"
        />
        <StatCard
          label="Conversas hoje"
          value={String(conversationsToday)}
          detail="Criadas na data atual"
        />
        <StatCard
          label="Ultima conversa"
          value={lastConversation ? formatDate(lastConversation.created_at) : "-"}
          detail={lastConversation ? getCompanyLabel(lastConversation) : "Sem registros"}
        />
      </div>

      <section className="mt-8 rounded-lg border border-ink/10 bg-white p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-xl font-black tracking-tight">Conversas salvas</h2>
            <p className="mt-1 text-sm text-ink/55">
              Filtre por mensagem, resposta, empresa ou ID.
            </p>
          </div>
          <label className="w-full md:max-w-sm">
            <span className="text-sm font-bold text-ink/70">Buscar</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Digite um termo..."
              className="mt-2 min-h-11 w-full rounded-md border border-ink/10 bg-cloud px-4 text-sm outline-none transition focus:border-moss focus:bg-white"
            />
          </label>
        </div>

        {isLoading && (
          <div className="mt-6 rounded-lg border border-ink/10 bg-cloud px-4 py-5 text-sm font-semibold text-ink/60">
            Carregando conversas...
          </div>
        )}

        {errorMessage && !isLoading && (
          <div className="mt-6 rounded-lg border border-coral/30 bg-coral/10 px-4 py-5 text-sm font-semibold text-ink">
            {errorMessage}
          </div>
        )}

        {!isLoading && !errorMessage && filteredConversations.length === 0 && (
          <div className="mt-6 rounded-lg border border-dashed border-ink/20 bg-cloud px-4 py-10 text-center">
            <p className="font-black">
              {conversations.length === 0
                ? "Nenhuma conversa salva ainda"
                : "Nenhuma conversa encontrada"}
            </p>
            <p className="mt-2 text-sm text-ink/55">
              {conversations.length === 0
                ? "Envie mensagens pelo chat demo para criar historico real."
                : "Tente buscar por outro termo."}
            </p>
          </div>
        )}

        {!isLoading && !errorMessage && filteredConversations.length > 0 && (
          <div className="mt-6 grid gap-4">
            {filteredConversations.map((conversation) => (
              <article
                key={conversation.id}
                className="rounded-lg border border-ink/10 bg-cloud p-5"
              >
                <div className="flex flex-col gap-2 border-b border-ink/10 pb-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-coral">
                      <span className="break-words">{getCompanyLabel(conversation)}</span>
                    </p>
                    <p className="mt-1 break-all text-xs font-semibold text-ink/45">
                      ID: {conversation.id}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-ink/55">
                    {formatDate(conversation.created_at)}
                  </p>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg bg-white p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink/45">
                      Mensagem do cliente
                    </p>
                    <p className="mt-2 whitespace-pre-line text-sm leading-6 text-ink">
                      <span className="break-words">{conversation.customer_message}</span>
                    </p>
                  </div>
                  <div className="rounded-lg bg-white p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink/45">
                      Resposta da IA
                    </p>
                    <p className="mt-2 whitespace-pre-line text-sm leading-6 text-ink">
                      <span className="break-words">{conversation.ai_response}</span>
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </DashboardLayout>
  );
}
