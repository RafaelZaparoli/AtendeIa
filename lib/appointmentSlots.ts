export const appointmentTimes = [
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00"
] as const;

export type AppointmentTime = (typeof appointmentTimes)[number];

export function isAppointmentTime(value: string): value is AppointmentTime {
  return appointmentTimes.includes(value as AppointmentTime);
}
