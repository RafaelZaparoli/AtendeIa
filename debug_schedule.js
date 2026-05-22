//("./lib/companySchedule");

// A module export may be ES module. Let's write the code directly to test it.
const workingDayOptions = [
  { value: "monday", label: "Seg" },
  { value: "tuesday", label: "Ter" },
  { value: "wednesday", label: "Qua" },
  { value: "thursday", label: "Qui" },
  { value: "friday", label: "Sex" },
  { value: "saturday", label: "Sab" },
  { value: "sunday", label: "Dom" }
];

const defaultWorkingDays = workingDayOptions.map((day) => day.value);
const weekdaysByIndex = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday"
];

function readMinutes(value) {
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

function formatMinutes(value) {
  const hours = String(Math.floor(value / 60)).padStart(2, "0");
  const minutes = String(value % 60).padStart(2, "0");

  return `${hours}:${minutes}`;
}

function readWeekday(date) {
  const parsedDate = new Date(`${date}T00:00:00Z`);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return weekdaysByIndex[parsedDate.getUTCDay()];
}

function testGetTimes(company, date) {
  const weekday = readWeekday(date);
  console.log("Weekday:", weekday);
  
  const workingDays = company.working_days?.length
    ? company.working_days
    : defaultWorkingDays;

  console.log("Working days:", workingDays);

  if (!weekday || !workingDays.includes(weekday)) {
    console.log("Failed weekday check");
    return [];
  }

  const openingMinutes = readMinutes(company.opening_time || "09:00");
  const closingMinutes = readMinutes(company.closing_time || "18:30");
  const interval = company.slot_interval_minutes || 30;

  console.log("Times:", { openingMinutes, closingMinutes, interval });

  if (
    openingMinutes === null ||
    closingMinutes === null ||
    closingMinutes <= openingMinutes ||
    !Number.isInteger(interval) ||
    interval < 5 ||
    interval > 480
  ) {
    console.log("Failed validation check");
    return [];
  }

  const times = [];

  for (
    let currentTime = openingMinutes;
    currentTime + interval <= closingMinutes;
    currentTime += interval
  ) {
    times.push(formatMinutes(currentTime));
  }

  return times;
}

const company = {
  opening_time: null,
  closing_time: null,
  slot_interval_minutes: null,
  working_days: null
};

console.log("Result:", testGetTimes(company, "2026-06-05"));
