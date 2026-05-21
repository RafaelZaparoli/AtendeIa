"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";

type ChatMessage = {
  id: string;
  author: "Cliente" | "AtendeAI";
  time: string;
  text: string;
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
    </main>
  );
}
