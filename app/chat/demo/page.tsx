"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";

type ChatMessage = {
  id: string;
  author: "Cliente" | "AtendeAI";
  time: string;
  text: string;
};

type AppointmentForm = {
  customerName: string;
  customerPhone: string;
  service: string;
  notes: string;
};

type AvailabilityTime = {
  time: string;
  available: boolean;
};

const initialAppointmentForm: AppointmentForm = {
  customerName: "",
  customerPhone: "",
  service: "",
  notes: ""
};

const initialMessages: ChatMessage[] = [
  {
    id: "welcome",
    author: "AtendeAI",
    time: "Agora",
    text: "Informe o ID da empresa salva e envie uma pergunta para testar a API."
  }
];

const suggestions = [
  "Quais serviços vocês oferecem?",
  "Qual o horário de funcionamento?",
  "Aceitam Pix?",
  "Qual o endereço?"
];

function getCurrentTime() {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date());
}

function extractWhatsapp(text: string) {
  const whatsappLine = text
    .split("\n")
    .find((line) => line.toLowerCase().includes("whatsapp:"));

  if (!whatsappLine) {
    return null;
  }

  const phone = whatsappLine.split(":").slice(1).join(":").trim();
  const digits = phone.replace(/\D/g, "");

  if (!digits) {
    return null;
  }

  return {
    label: phone,
    href: `https://wa.me/${digits.startsWith("55") ? digits : `55${digits}`}`
  };
}

export default function ChatDemoPage() {
  const [companyId, setCompanyId] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isAppointmentOpen, setIsAppointmentOpen] = useState(false);
  const [appointmentForm, setAppointmentForm] = useState<AppointmentForm>(
    initialAppointmentForm
  );
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [isScheduling, setIsScheduling] = useState(false);
  const [loadingTimes, setLoadingTimes] = useState(false);
  const [timeSlots, setTimeSlots] = useState<AvailabilityTime[]>([]);
  const [availabilityError, setAvailabilityError] = useState("");
  const [appointmentMessage, setAppointmentMessage] = useState("");
  const [appointmentError, setAppointmentError] = useState("");

  const whatsapp = useMemo(() => {
    for (const chatMessage of [...messages].reverse()) {
      if (chatMessage.author === "AtendeAI") {
        const detectedWhatsapp = extractWhatsapp(chatMessage.text);

        if (detectedWhatsapp) {
          return detectedWhatsapp;
        }
      }
    }

    return null;
  }, [messages]);

  const selectedAvailability = timeSlots.find(
    (slot) => slot.time === selectedTime
  );
  const hasAvailableAppointmentTime = timeSlots.some(
    (slot) => slot.available
  );
  const canSubmitAppointment =
    Boolean(appointmentForm.customerName.trim()) &&
    Boolean(appointmentForm.customerPhone.trim()) &&
    Boolean(appointmentForm.service.trim()) &&
    Boolean(selectedDate) &&
    Boolean(selectedAvailability?.available) &&
    !isScheduling;

  useEffect(() => {
    async function loadAvailability() {
      const trimmedCompanyId = companyId.trim();
      const date = selectedDate;

      setTimeSlots([]);
      setAvailabilityError("");

      if (!isAppointmentOpen || !date) {
        return;
      }

      if (!trimmedCompanyId) {
        setAvailabilityError("Informe o ID da empresa para ver os horarios.");
        return;
      }

      setLoadingTimes(true);

      try {
        const response = await fetch(
          `/api/appointments/availability?companyId=${encodeURIComponent(
            trimmedCompanyId
          )}&date=${encodeURIComponent(date)}`
        );
        const data = (await response.json()) as {
          times?: AvailabilityTime[];
          error?: string;
        };

        if (!response.ok) {
          throw new Error(data.error || "Nao foi possivel carregar os horarios.");
        }

        setTimeSlots(data.times || []);
      } catch (error) {
        const friendlyMessage =
          error instanceof Error
            ? error.message
            : "Nao foi possivel carregar a disponibilidade.";
        setAvailabilityError(friendlyMessage);
      } finally {
        setLoadingTimes(false);
      }
    }

    loadAvailability();
  }, [companyId, isAppointmentOpen, selectedDate]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedCompanyId = companyId.trim();
    const trimmedMessage = message.trim();

    if (!trimmedCompanyId) {
      setErrorMessage("Informe o ID da empresa para testar o chat.");
      return;
    }

    if (!trimmedMessage) {
      setErrorMessage("Digite uma mensagem antes de enviar.");
      return;
    }

    const customerMessage: ChatMessage = {
      id: crypto.randomUUID(),
      author: "Cliente",
      time: getCurrentTime(),
      text: trimmedMessage
    };

    setMessages((currentMessages) => [...currentMessages, customerMessage]);
    setMessage("");
    setIsSending(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          companyId: trimmedCompanyId,
          message: trimmedMessage
        })
      });

      const data = (await response.json()) as {
        answer?: string;
        error?: string;
        details?: string;
      };

      if (!response.ok) {
        throw new Error(data.error || "Nao foi possivel enviar a mensagem.");
      }

      const aiMessage: ChatMessage = {
        id: crypto.randomUUID(),
        author: "AtendeAI",
        time: getCurrentTime(),
        text: data.answer || "A API nao retornou uma resposta."
      };

      setMessages((currentMessages) => [...currentMessages, aiMessage]);
    } catch (error) {
      const friendlyMessage =
        error instanceof Error
          ? error.message
          : "Nao foi possivel falar com a API agora.";

      setErrorMessage(friendlyMessage);
      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: crypto.randomUUID(),
          author: "AtendeAI",
          time: getCurrentTime(),
          text: "Nao consegui responder agora. Verifique o ID da empresa e tente novamente."
        }
      ]);
    } finally {
      setIsSending(false);
    }
  }

  function updateAppointmentField(field: keyof AppointmentForm, value: string) {
    setAppointmentForm((currentForm) => ({
      ...currentForm,
      [field]: value
    }));
  }

  async function handleAppointmentSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedCompanyId = companyId.trim();

    if (!trimmedCompanyId) {
      setAppointmentError("Informe o ID da empresa antes de agendar.");
      return;
    }

    if (!appointmentForm.customerName.trim()) {
      setAppointmentError("Informe o nome para solicitar o agendamento.");
      return;
    }

    if (!appointmentForm.customerPhone.trim()) {
      setAppointmentError("Informe o telefone para solicitar o agendamento.");
      return;
    }

    if (!appointmentForm.service.trim()) {
      setAppointmentError("Informe o servico desejado.");
      return;
    }

    if (!selectedDate) {
      setAppointmentError("Escolha uma data para solicitar o agendamento.");
      return;
    }

    if (!selectedAvailability?.available) {
      setAppointmentError("Escolha um horario disponivel antes de solicitar.");
      return;
    }

    setIsScheduling(true);
    setAppointmentMessage("");
    setAppointmentError("");

    try {
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          companyId: trimmedCompanyId,
          customerName: appointmentForm.customerName,
          customerPhone: appointmentForm.customerPhone,
          service: appointmentForm.service,
          appointmentDate: selectedDate,
          appointmentTime: selectedTime,
          notes: appointmentForm.notes
        })
      });

      const data = (await response.json()) as {
        message?: string;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error || "Nao foi possivel solicitar o agendamento.");
      }

      const successMessage =
        "Solicitação de agendamento enviada. A empresa entrará em contato para confirmar.";

      setAppointmentMessage(successMessage);
      setAppointmentForm(initialAppointmentForm);
      setSelectedDate("");
      setSelectedTime("");
      setTimeSlots([]);
      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: crypto.randomUUID(),
          author: "AtendeAI",
          time: getCurrentTime(),
          text: successMessage
        }
      ]);
    } catch (error) {
      const friendlyMessage =
        error instanceof Error
          ? error.message
          : "Nao foi possivel solicitar o agendamento agora.";
      setAppointmentError(friendlyMessage);
    } finally {
      setIsScheduling(false);
    }
  }

  return (
    <main className="min-h-screen bg-cloud text-ink">
      <header className="border-b border-ink/10 bg-white px-5 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link href="/" className="text-xl font-black tracking-tight">
            AtendeAI
          </Link>
          <Link
            href="/dashboard"
            className="rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white"
          >
            Entrar no painel
          </Link>
        </div>
      </header>

      <section className="mx-auto flex max-w-5xl flex-col px-5 py-8">
        <div className="mb-5">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-coral">
            Chat demo
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">
            Simulacao de atendimento
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/60">
            Use o ID exibido apos salvar a empresa em configuracoes para testar
            respostas baseadas no cadastro.
          </p>
        </div>

        <div className="overflow-hidden rounded-lg border border-ink/10 bg-white shadow-soft">
          <div className="flex flex-col gap-4 border-b border-ink/10 px-5 py-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-black">Cliente via WhatsApp</p>
              <p className="text-sm text-ink/55">Atendimento conectado a API</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={() => {
                  setAppointmentMessage("");
                  setAppointmentError("");
                  setIsAppointmentOpen(true);
                }}
                className="rounded-md bg-ink px-3 py-2 text-xs font-bold text-white transition hover:bg-moss"
              >
                Agendar horário
              </button>
              {whatsapp && (
                <a
                  href={whatsapp.href}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-md bg-mint px-3 py-2 text-xs font-bold text-moss transition hover:bg-moss hover:text-white"
                >
                  Abrir WhatsApp
                </a>
              )}
              <span className="w-fit rounded-full bg-mint px-3 py-1 text-xs font-bold text-moss">
                Demo
              </span>
            </div>
          </div>

          <div className="border-b border-ink/10 bg-white px-4 py-4 md:px-8">
            <label htmlFor="companyId" className="text-sm font-bold text-ink/70">
              ID da empresa
            </label>
            <input
              id="companyId"
              value={companyId}
              onChange={(event) => setCompanyId(event.target.value)}
              placeholder="Cole aqui o UUID da empresa salva"
              className="mt-2 min-h-11 w-full rounded-md border border-ink/10 bg-cloud px-4 text-sm outline-none transition focus:border-moss focus:bg-white"
            />
          </div>

          <div className="min-h-[480px] space-y-4 bg-cloud px-4 py-5 md:px-8">
            {messages.map((message) => {
              const isAi = message.author === "AtendeAI";

              return (
                <div
                  key={message.id}
                  className={`flex ${isAi ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`max-w-[82%] break-words whitespace-pre-line rounded-lg px-4 py-3 text-sm leading-6 ${
                      isAi ? "bg-white text-ink" : "bg-ink text-white"
                    }`}
                  >
                    <div className="mb-1 flex items-center gap-2 text-xs font-bold opacity-65">
                      <span>{message.author}</span>
                      <span>{message.time}</span>
                    </div>
                    <p>{message.text}</p>
                  </div>
                </div>
              );
            })}
            {isSending && (
              <div className="flex justify-start">
                <div className="rounded-lg bg-white px-4 py-3 text-sm font-semibold text-ink/60">
                  AtendeAI esta pensando...
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="border-t border-ink/10 bg-white p-4">
            <div className="mb-3 flex flex-wrap gap-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => setMessage(suggestion)}
                  className="rounded-md border border-ink/10 bg-cloud px-3 py-2 text-xs font-semibold text-ink/70 transition hover:border-moss hover:bg-mint hover:text-moss"
                >
                  {suggestion}
                </button>
              ))}
            </div>

            {errorMessage && (
              <div className="mb-3 rounded-lg border border-coral/30 bg-coral/10 px-4 py-3 text-sm font-semibold text-ink">
                {errorMessage}
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Digite uma mensagem para testar..."
                className="min-h-11 flex-1 rounded-md border border-ink/10 bg-cloud px-4 text-sm outline-none transition focus:border-moss focus:bg-white"
              />
              <button
                disabled={isSending}
                className="min-h-11 rounded-md bg-ink px-5 text-sm font-semibold text-white transition hover:bg-moss disabled:cursor-not-allowed disabled:bg-ink/45"
              >
                {isSending ? "Enviando..." : "Enviar"}
              </button>
            </div>
          </form>
        </div>
      </section>

      {isAppointmentOpen && (
        <div className="fixed inset-0 z-50 flex items-end bg-ink/45 px-4 py-4 sm:items-center sm:justify-center">
          <div className="max-h-[92vh] w-full overflow-y-auto rounded-lg bg-white shadow-soft sm:max-w-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-ink/10 px-5 py-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-coral">
                  Solicitar agendamento
                </p>
                <h2 className="mt-1 text-xl font-black tracking-tight">
                  Agendar horário
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsAppointmentOpen(false)}
                className="rounded-md bg-cloud px-3 py-2 text-sm font-bold text-ink/70 transition hover:bg-mint hover:text-moss"
              >
                Fechar
              </button>
            </div>

            <form onSubmit={handleAppointmentSubmit} className="px-5 py-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <label>
                  <span className="text-sm font-bold text-ink/70">Nome</span>
                  <input
                    value={appointmentForm.customerName}
                    onChange={(event) =>
                      updateAppointmentField("customerName", event.target.value)
                    }
                    className="mt-2 min-h-11 w-full rounded-md border border-ink/10 bg-cloud px-4 text-sm outline-none transition focus:border-moss focus:bg-white"
                  />
                </label>
                <label>
                  <span className="text-sm font-bold text-ink/70">Telefone</span>
                  <input
                    value={appointmentForm.customerPhone}
                    onChange={(event) =>
                      updateAppointmentField("customerPhone", event.target.value)
                    }
                    className="mt-2 min-h-11 w-full rounded-md border border-ink/10 bg-cloud px-4 text-sm outline-none transition focus:border-moss focus:bg-white"
                  />
                </label>
                <label className="sm:col-span-2">
                  <span className="text-sm font-bold text-ink/70">
                    Serviço desejado
                  </span>
                  <input
                    value={appointmentForm.service}
                    onChange={(event) =>
                      updateAppointmentField("service", event.target.value)
                    }
                    className="mt-2 min-h-11 w-full rounded-md border border-ink/10 bg-cloud px-4 text-sm outline-none transition focus:border-moss focus:bg-white"
                  />
                </label>
                <label className="sm:col-span-2">
                  <span className="text-sm font-bold text-ink/70">Data</span>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(event) => {
                      setSelectedDate(event.target.value);
                      setSelectedTime("");
                    }}
                    className="mt-2 min-h-11 w-full rounded-md border border-ink/10 bg-cloud px-4 text-sm outline-none transition focus:border-moss focus:bg-white"
                  />
                </label>
                <div className="sm:col-span-2">
                  <p className="text-sm font-bold text-ink/70">Horários</p>
                  {!selectedDate && (
                    <p className="mt-2 rounded-md bg-cloud px-4 py-3 text-sm text-ink/55">
                      Escolha uma data para ver os horários disponíveis.
                    </p>
                  )}
                  {loadingTimes && (
                    <p className="mt-2 rounded-md bg-cloud px-4 py-3 text-sm font-semibold text-ink/60">
                      Carregando horários...
                    </p>
                  )}
                  {availabilityError && !loadingTimes && (
                    <p className="mt-2 rounded-md border border-coral/30 bg-coral/10 px-4 py-3 text-sm font-semibold text-ink">
                      {availabilityError}
                    </p>
                  )}
                  {timeSlots.length > 0 &&
                    !hasAvailableAppointmentTime &&
                    !loadingTimes &&
                    !availabilityError && (
                      <p className="mt-2 rounded-md border border-coral/30 bg-coral/10 px-4 py-3 text-sm font-semibold text-ink">
                        Não há horários disponíveis para esta data. Escolha outro dia.
                      </p>
                    )}
                  {timeSlots.length > 0 && !loadingTimes && (
                    <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {timeSlots.map((slot) => {
                        const isSelected = selectedTime === slot.time;

                        return (
                          <button
                            key={slot.time}
                            type="button"
                            disabled={!slot.available}
                            onClick={() => setSelectedTime(slot.time)}
                            className={`min-h-14 rounded-md border px-3 py-2 text-left text-sm font-bold transition ${
                              slot.available
                                ? isSelected
                                  ? "border-moss bg-moss text-white shadow-sm"
                                  : "border-ink/10 bg-cloud text-ink hover:border-moss hover:bg-mint"
                                : "cursor-not-allowed border-ink/5 bg-ink/5 text-ink/35"
                            }`}
                          >
                            <span className="block">{slot.time}</span>
                            <span className="block text-xs font-semibold">
                              {isSelected
                                ? "Selecionado"
                                : slot.available
                                  ? "Disponível"
                                  : "Indisponível"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
                <label className="sm:col-span-2">
                  <span className="text-sm font-bold text-ink/70">Observações</span>
                  <textarea
                    value={appointmentForm.notes}
                    onChange={(event) =>
                      updateAppointmentField("notes", event.target.value)
                    }
                    rows={3}
                    className="mt-2 w-full rounded-md border border-ink/10 bg-cloud px-4 py-3 text-sm outline-none transition focus:border-moss focus:bg-white"
                  />
                </label>
              </div>

              {appointmentMessage && (
                <div className="mt-4 rounded-lg border border-moss/20 bg-mint px-4 py-3 text-sm font-semibold text-moss">
                  {appointmentMessage}
                </div>
              )}

              {appointmentError && (
                <div className="mt-4 rounded-lg border border-coral/30 bg-coral/10 px-4 py-3 text-sm font-semibold text-ink">
                  {appointmentError}
                </div>
              )}

              <div className="mt-5 flex flex-col gap-3 border-t border-ink/10 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setIsAppointmentOpen(false)}
                  className="min-h-11 rounded-md bg-cloud px-5 text-sm font-semibold text-ink transition hover:bg-mint"
                >
                  Cancelar
                </button>
                <button
                  disabled={!canSubmitAppointment}
                  className="min-h-11 rounded-md bg-ink px-5 text-sm font-semibold text-white transition hover:bg-moss disabled:cursor-not-allowed disabled:bg-ink/45"
                >
                  {isScheduling ? "Solicitando..." : "Solicitar agendamento"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
