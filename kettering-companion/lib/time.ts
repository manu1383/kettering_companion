export function to24Hour(time12h: string): string {
  if (!time12h) return "";

  const match = time12h.trim().match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i);

  if (!match) return "";

  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const modifier = match[3].toUpperCase();

  if (modifier === "PM" && hours !== 12) {
    hours += 12;
  }

  if (modifier === "AM" && hours === 12) {
    hours = 0;
  }

  return `${hours.toString().padStart(2, "0")}:${minutes}`;
}

export function to12Hour(time?: string) {
  if (!time) return "";

  const [hour, minute] = time.split(":").map(Number);

  const period = hour >= 12 ? "PM" : "AM";
  const adjustedHour = hour % 12 || 12;

  return `${adjustedHour}:${minute.toString().padStart(2, "0")} ${period}`;
}

export function parseTime(time: string): string | null {
  const match = time.trim().match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i);

  if (!match) return null;

  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const modifier = match[3].toUpperCase();

  if (hours < 1 || hours > 12) return null;
  if (parseInt(minutes) > 59) return null;

  if (modifier === "PM" && hours !== 12) hours += 12;
  if (modifier === "AM" && hours === 12) hours = 0;

  return `${hours.toString().padStart(2, "0")}:${minutes}`;
}

export const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday"
];

export function getWeekdayName(day: number) {
  return WEEKDAYS[day] ?? "Unknown";
}

export function formatFrequency(freq: string) {
  switch (freq) {
    case "weekly":
      return "Weekly";
    case "biweekly":
      return "Biweekly";
    case "monthly":
      return "Monthly";
    default:
      return freq;
  }
};

export function getPluralWeekday(weekday: number) {
  const days = [
    "Sundays",
    "Mondays",
    "Tuesdays",
    "Wednesdays",
    "Thursdays",
    "Fridays",
    "Saturdays"
  ];

  return days[weekday] ?? "";
};