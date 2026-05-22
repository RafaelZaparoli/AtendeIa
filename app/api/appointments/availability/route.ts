import { NextResponse } from "next/server";
import { getCompanyAppointmentTimes } from "@/lib/companySchedule";
import { getSupabaseClient } from "@/lib/supabaseClient";

function buildErrorResponse(message: string, status = 500) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get("companyId")?.trim() || "";
  const date = searchParams.get("date")?.trim() || "";

  if (!companyId) {
    return buildErrorResponse("O parametro companyId e obrigatorio.", 400);
  }

  if (!date) {
    return buildErrorResponse("O parametro date e obrigatorio.", 400);
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
      return buildErrorResponse("Nao foi possivel carregar a agenda da empresa.");
    }

    if (!company) {
      return buildErrorResponse("Empresa nao encontrada.", 404);
    }

    const appointmentTimes = getCompanyAppointmentTimes(company, date);

    if (appointmentTimes.length === 0) {
      return NextResponse.json({
        date,
        times: []
      });
    }

    const { data, error } = await supabase
      .from("appointments")
      .select("appointment_time")
      .eq("company_id", companyId)
      .eq("appointment_date", date)
      .neq("status", "cancelado");

    if (error) {
      console.error("Failed to load appointment availability:", error.message);
      return buildErrorResponse("Nao foi possivel carregar os horarios.");
    }

    const unavailableTimes = new Set(
      (data || []).map((appointment) => {
        return typeof appointment.appointment_time === "string"
          ? appointment.appointment_time.slice(0, 5)
          : appointment.appointment_time;
      })
    );

    return NextResponse.json({
      date,
      times: appointmentTimes.map((time) => ({
        time,
        available: !unavailableTimes.has(time)
      }))
    });
  } catch (error) {
    console.error("Unexpected availability error:", error);
    return buildErrorResponse("Erro inesperado ao buscar disponibilidade.");
  }
}
