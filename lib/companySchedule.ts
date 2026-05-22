import type { Company } from "@/lib/supabaseClient";

export const workingDayOptions = [
  { value: "monday", label: "Seg" },
  { value: "tuesday", label: "Ter" },
  { value: "wednesday", label: "Qua" },
  { value: "thursday", label: "Qui" },
  { value: "friday", label: "Sex" },
  { value: "saturday", label: "Sab" },
  { value: "sunday", label: "Dom" }
] as const;

const defaultWorkingDays = workingDayOptions.map((day) => day.value);
const weekdaysByIndex = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday"
] as const;

type ScheduleCompany = Pick<
  Company,
  "opening_time" | "closing_time" | "slot_interval_minutes" | "working_days"
>;

function readMinutes(value: string | null) {
  if (!value) {
    return null;
  }

  const [hours, minutes] = value.slice(0, 5).split(":").map(Number);

  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  return hours * 60 + minutes;
}

function formatMinutes(value: number) {
  const hours = String(Math.floor(value / 60)).padStart(2, "0");
  const minutes = String(value % 60).padStart(2, "0");

  return `${hours}:${minutes}`;
}

function readWeekday(date: string) {
  const parsedDate = new Date(`${date}T00:00:00Z`);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return weekdaysByIndex[parsedDate.getUTCDay()];
}

export function getCompanyAppointmentTimes(company: ScheduleCompany, date: string) {
  const weekday = readWeekday(date);
  const rawWorkingDays = company.working_days?.length
    ? company.working_days
    : defaultWorkingDays;

  const workingDays = rawWorkingDays.map((day) => {
    if (day === "0") return "sunday";
    if (day === "1") return "monday";
    if (day === "2") return "tuesday";
    if (day === "3") return "wednesday";
    if (day === "4") return "thursday";
    if (day === "5") return "friday";
    if (day === "6") return "saturday";
    return day;
  });

  if (!weekday || !workingDays.includes(weekday)) {
    return [];
  }

  const openingMinutes = readMinutes(company.opening_time || "09:00");
  const closingMinutes = readMinutes(company.closing_time || "18:30");
  const interval = company.slot_interval_minutes || 30;

  if (
    openingMinutes === null ||
    closingMinutes === null ||
    closingMinutes <= openingMinutes ||
    !Number.isInteger(interval) ||
    interval < 5 ||
    interval > 480
  ) {
    return [];
  }

  const times: string[] = [];

  for (
    let currentTime = openingMinutes;
    currentTime + interval <= closingMinutes;
    currentTime += interval
  ) {
    times.push(formatMinutes(currentTime));
  }

  return times;
}
