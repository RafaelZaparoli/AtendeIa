import { NextResponse } from "next/server";
import { getCompanyAppointmentSchedule } from "@/lib/companySchedule";
import { getSupabaseClient } from "@/lib/supabaseClient";

type AvailabilityTime = {
  time: string;
  available: boolean;
};

function buildAvailabilityResponse(
  date: string,
  times: AvailabilityTime[],
  status = 200,
  extra?: {
    error?: string;
    message?: string;
    reason?: string;
  }
) {
  return NextResponse.json(
    {
      date,
      times,
      ...extra
    },
    { status }
  );
}

function isDateValue(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isUUID(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get("companyId")?.trim() || "";
  const date = searchParams.get("date")?.trim() || "";

  if (!companyId) {
    return buildAvailabilityResponse(
      date,
      [],
      400,
      { error: "O parametro companyId e obrigatorio." }
    );
  }

  if (!date) {
    return buildAvailabilityResponse(
      date,
      [],
      400,
      { error: "O parametro date e obrigatorio." }
    );
  }

  if (!isUUID(companyId)) {
    return buildAvailabilityResponse(
      date,
      [],
      400,
      { error: "Formato de ID de empresa invalido." }
    );
  }

  if (!isDateValue(date)) {
    return buildAvailabilityResponse(
      date,
      [],
      400,
      { error: "Envie a data no formato YYYY-MM-DD." }
    );
  }

  try {
    const supabase = getSupabaseClient();
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("opening_time, closing_time, slot_interval_minutes, working_days")
      .eq("id", companyId)
      .maybeSingle();

    if (companyError) {
      console.error("Failed to load company schedule:", companyError.message);
      return buildAvailabilityResponse(date, [], 500, {
        error: "Nao foi possivel carregar a agenda da empresa."
      });
    }

    if (!company) {
      return buildAvailabilityResponse(date, [], 404, {
        error: "Empresa nao encontrada."
      });
    }

    const schedule = getCompanyAppointmentSchedule(company, date);

    if (schedule.reason === "closed_day") {
      return buildAvailabilityResponse(date, [], 200, {
        reason: "closed_day",
        message: "A empresa não atende neste dia da semana. Escolha outro dia."
      });
    }

    if (schedule.times.length === 0) {
      return buildAvailabilityResponse(date, []);
    }

    const { data, error } = await supabase
      .from("appointments")
      .select("appointment_time")
      .eq("company_id", companyId)
      .eq("appointment_date", date)
      .neq("status", "cancelado");

    if (error) {
      console.error("Failed to load appointment availability:", error.message);
      return buildAvailabilityResponse(date, [], 500, {
        error: "Nao foi possivel carregar os horarios."
      });
    }

    const unavailableTimes = new Set(
      (data || []).map((appointment) => {
        return typeof appointment.appointment_time === "string"
          ? appointment.appointment_time.slice(0, 5)
          : appointment.appointment_time;
      })
    );

    return buildAvailabilityResponse(
      date,
      schedule.times.map((time) => ({
        time,
        available: !unavailableTimes.has(time)
      }))
    );
  } catch (error) {
    console.error("Unexpected availability error:", error);
    return buildAvailabilityResponse(
      date,
      [],
      500,
      { error: "Erro inesperado ao buscar disponibilidade." }
    );
  }
}
