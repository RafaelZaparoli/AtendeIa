import { NextResponse } from "next/server";
import { getSupabaseClient, type Company } from "@/lib/supabaseClient";

type ChatRequest = {
  companyId?: unknown;
  message?: unknown;
};

const fallbackAnswer =
  "Não tenho essa informação no momento. Recomendo falar com um atendente humano.";

const intentLabels = {
  price: ["Servicos e precos"],
  service: ["Servicos e precos"],
  hours: ["Horario de funcionamento"],
  address: ["Endereco", "Cidade", "Estado"],
  payment: ["Formas de pagamento"],
  whatsapp: ["WhatsApp"]
};

function buildErrorResponse(message: string, status = 500) {
  return NextResponse.json({ error: message }, { status });
}

function normalizeText(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function detectRequestedInfo(message: string) {
  const normalizedMessage = normalizeText(message);
  const requestedLabels = new Set<string>();

  if (
    /\b(preco|precos|valor|valores|custa|custo|quanto|orcamento)\b/.test(
      normalizedMessage
    )
  ) {
    intentLabels.price.forEach((label) => requestedLabels.add(label));
  }

  if (/\b(servico|servicos|fazem|atendem|oferecem)\b/.test(normalizedMessage)) {
    intentLabels.service.forEach((label) => requestedLabels.add(label));
  }

  if (/\b(horario|horarios|funciona|funcionamento|abrem|abre|fecha)\b/.test(normalizedMessage)) {
    intentLabels.hours.forEach((label) => requestedLabels.add(label));
  }

  if (/\b(endereco|local|localizacao|onde|rua|bairro|cidade|estado)\b/.test(normalizedMessage)) {
    intentLabels.address.forEach((label) => requestedLabels.add(label));
  }

  if (/\b(pagamento|pagamentos|pagar|pix|cartao|dinheiro|debito|credito)\b/.test(normalizedMessage)) {
    intentLabels.payment.forEach((label) => requestedLabels.add(label));
  }

  if (/\b(whatsapp|zap|telefone|contato|numero)\b/.test(normalizedMessage)) {
    intentLabels.whatsapp.forEach((label) => requestedLabels.add(label));
  }

  return [...requestedLabels];
}

function getBusinessInfoLines(company: Company) {
  const lines = company.business_info
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (company.whatsapp) {
    lines.push(`WhatsApp: ${company.whatsapp}`);
  }

  return lines;
}

function findRelevantLines(company: Company, labels: string[]) {
  const businessInfoLines = getBusinessInfoLines(company);

  return labels
    .map((label) => {
      const normalizedLabel = normalizeText(label);

      return businessInfoLines.find((line) =>
        normalizeText(line).startsWith(`${normalizedLabel}:`)
      );
    })
    .filter((line): line is string => Boolean(line));
}

function generateSimulatedAnswer(company: Company, message: string) {
  const requestedLabels = detectRequestedInfo(message);

  if (requestedLabels.length === 0) {
    return fallbackAnswer;
  }

  const relevantLines = findRelevantLines(company, requestedLabels);

  if (relevantLines.length === 0) {
    return fallbackAnswer;
  }

  return [
    "Encontrei informações no cadastro da empresa:",
    ...relevantLines,
    "Se quiser, posso ajudar com outra dúvida sobre o atendimento."
  ].join("\n");
}

export async function POST(request: Request) {
  let body: ChatRequest;

  try {
    body = (await request.json()) as ChatRequest;
  } catch {
    return NextResponse.json(
      { error: "Envie um JSON valido com companyId e message." },
      { status: 400 }
    );
  }

  const companyId =
    typeof body.companyId === "string" ? body.companyId.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";

  if (!companyId) {
    return buildErrorResponse("O campo companyId e obrigatorio.", 400);
  }

  if (!message) {
    return buildErrorResponse("O campo message e obrigatorio.", 400);
  }

  try {
    const supabase = getSupabaseClient();

    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("id, name, business_info, city, state, tone, whatsapp, created_at")
      .eq("id", companyId)
      .maybeSingle();

    if (companyError) {
      console.error("Failed to load company:", companyError.message);
      return buildErrorResponse("Erro ao buscar empresa no Supabase.");
    }

    if (!company) {
      return buildErrorResponse(
        "Empresa nao encontrada para o companyId informado.",
        404
      );
    }

    const answer = generateSimulatedAnswer(company, message);

    const { error: conversationError } = await supabase
      .from("conversations")
      .insert({
        company_id: company.id,
        customer_message: message,
        ai_response: answer
      });

    if (conversationError) {
      console.error("Failed to save conversation:", conversationError.message);
      return buildErrorResponse(
        "Resposta gerada, mas nao foi possivel salvar a conversa."
      );
    }

    return NextResponse.json({ answer });
  } catch (error) {
    console.error("Unexpected chat error:", error);
    return buildErrorResponse("Erro inesperado ao processar o chat.");
  }
}
