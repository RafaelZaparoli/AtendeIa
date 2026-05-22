import { NextResponse } from "next/server";
import { getCompanyAppointmentTimes } from "@/lib/companySchedule";
import { getSupabaseClient } from "@/lib/supabaseClient";

type AvailabilityTime = {
  time: string;
  available: boolean;
};

type CompanySchedule = {
  opening_time: string | null;
  closing_time: string | null;
  slot_interval_minutes: number | null;
  working_days: string[] | null;
};

const defaultCompanySchedule: CompanySchedule = {
  opening_time: null,
  closing_time: null,
  slot_interval_minutes: null,
  working_days: null
};

function buildAvailabilityResponse(
  date: string,
  times: AvailabilityTime[],
  status = 200,
  error?: string
) {
  return NextResponse.json(
    {
      date,
      times,
      ...(error ? { error } : {})
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
      "O parametro companyId e obrigatorio."
    );
  }

  if (!date) {
    return buildAvailabilityResponse(
      date,
      [],
      400,
      "O parametro date e obrigatorio."
    );
  }

  if (!isUUID(companyId)) {
    return buildAvailabilityResponse(
      date,
      [],
      400,
      "Formato de ID de empresa invalido."
    );
  }

  if (!isDateValue(date)) {
    return buildAvailabilityResponse(
      date,
      [],
      400,
      "Envie a data no formato YYYY-MM-DD."
    );
  }

  try {
    const supabase = getSupabaseClient();
    const { data: configuredCompany, error: companyError } = await supabase
      .from("companies")
      .select("opening_time, closing_time, slot_interval_minutes, working_days")
      .eq("id", companyId)
      .maybeSingle();

    let company = configuredCompany;

    if (companyError) {
      console.error("Failed to load company schedule:", companyError.message);

      const { data: fallbackCompany, error: fallbackCompanyError } = await supabase
        .from("companies")
        .select("id")
        .eq("id", companyId)
        .maybeSingle();

      if (fallbackCompanyError) {
        console.error(
          "Failed to load fallback company schedule:",
          fallbackCompanyError.message
        );
        return buildAvailabilityResponse(
          date,
          [],
          500,
          "Nao foi possivel carregar a agenda da empresa."
        );
      }

      company = fallbackCompany ? defaultCompanySchedule : null;
    }

    if (!company) {
      return buildAvailabilityResponse(date, [], 404, "Empresa nao encontrada.");
    }

    const appointmentTimes = getCompanyAppointmentTimes(company, date);

    if (appointmentTimes.length === 0) {
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
      return buildAvailabilityResponse(
        date,
        [],
        500,
        "Nao foi possivel carregar os horarios."
      );
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
      appointmentTimes.map((time) => ({
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
      "Erro inesperado ao buscar disponibilidade."
    );
  }
}
