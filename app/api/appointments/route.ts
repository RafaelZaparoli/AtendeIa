import { NextResponse } from "next/server";
import { getCompanyAppointmentTimes } from "@/lib/companySchedule";
import { getSupabaseClient } from "@/lib/supabaseClient";

type AppointmentRequest = {
  companyId?: unknown;
  customerName?: unknown;
  customerPhone?: unknown;
  service?: unknown;
  appointmentDate?: unknown;
  appointmentTime?: unknown;
  notes?: unknown;
};

const requiredFields: Array<{
  requestKey: keyof AppointmentRequest;
  label: string;
}> = [
  { requestKey: "companyId", label: "companyId" },
  { requestKey: "customerName", label: "customerName" },
  { requestKey: "customerPhone", label: "customerPhone" },
  { requestKey: "service", label: "service" },
  { requestKey: "appointmentDate", label: "appointmentDate" },
  { requestKey: "appointmentTime", label: "appointmentTime" }
];

function getStringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function buildErrorResponse(message: string, status = 500) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  let body: AppointmentRequest;

  try {
    body = (await request.json()) as AppointmentRequest;
  } catch {
    return buildErrorResponse(
      "Envie um JSON valido com os dados do agendamento.",
      400
    );
  }

  const missingFields = requiredFields
    .filter(({ requestKey }) => !getStringValue(body[requestKey]))
    .map(({ label }) => label);

  if (missingFields.length > 0) {
    return buildErrorResponse(
      `Campos obrigatorios ausentes: ${missingFields.join(", ")}.`,
      400
    );
  }

  const companyId = getStringValue(body.companyId);
  const customerName = getStringValue(body.customerName);
  const customerPhone = getStringValue(body.customerPhone);
  const service = getStringValue(body.service);
  const appointmentDate = getStringValue(body.appointmentDate);
  const appointmentTime = getStringValue(body.appointmentTime);
  const notes = getStringValue(body.notes) || null;

  try {
    const supabase = getSupabaseClient();
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("opening_time, closing_time, slot_interval_minutes, working_days")
      .eq("id", companyId)
      .maybeSingle();

    if (companyError) {
      console.error("Failed to load company schedule:", companyError.message);
      return buildErrorResponse("Nao foi possivel validar a agenda da empresa.");
    }

    if (!company) {
      return buildErrorResponse("Empresa nao encontrada.", 404);
    }

    if (!getCompanyAppointmentTimes(company, appointmentDate).includes(appointmentTime)) {
      return buildErrorResponse("Selecione um horario disponivel.", 400);
    }

    const { data: occupiedAppointments, error: availabilityError } = await supabase
      .from("appointments")
      .select("id")
      .eq("company_id", companyId)
      .eq("appointment_date", appointmentDate)
      .eq("appointment_time", appointmentTime)
      .neq("status", "cancelado")
      .limit(1);

    if (availabilityError) {
      console.error("Failed to validate appointment availability:", availabilityError.message);
      return buildErrorResponse("Nao foi possivel validar a disponibilidade.");
    }

    if (occupiedAppointments.length > 0) {
      return buildErrorResponse(
        "Este horário já está indisponível. Escolha outro horário.",
        409
      );
    }

    const { data, error } = await supabase
      .from("appointments")
      .insert({
        company_id: companyId,
        customer_name: customerName,
        customer_phone: customerPhone,
        service,
        appointment_date: appointmentDate,
        appointment_time: appointmentTime,
        notes,
        status: "pendente"
      })
      .select("id")
      .single();

    if (error) {
      console.error("Failed to save appointment:", error.message);
      return buildErrorResponse("Nao foi possivel salvar o agendamento.");
    }

    return NextResponse.json(
      {
        message: "Agendamento criado com sucesso.",
        appointmentId: data.id
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Unexpected appointment error:", error);
    return buildErrorResponse("Erro inesperado ao criar agendamento.");
  }
}
