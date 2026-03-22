// Utility functions for time formatting and parsing, as well as date formatting and weekday handling

// Converts 24-hour time to 12-hour format with AM/PM
export function to12Hour(time?: string) {
  if (!time) return "";

  const [hour, minute] = time.split(":").map(Number);

  const period = hour >= 12 ? "PM" : "AM";
  const adjustedHour = hour % 12 || 12;

  return `${adjustedHour}:${minute.toString().padStart(2, "0")} ${period}`;
}
// Parses a time string in 12-hour format and converts it to 24-hour format
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
// Array of weekday names for easy lookup
export const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday"
];
// Returns the name of the weekday given its numeric representation (0-6)
export function getWeekdayName(day: number) {
  return WEEKDAYS[day] ?? "Unknown";
}
// Formats a frequency string (e.g. "weekly") into a more user-friendly format (e.g. "Weekly")
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
// Formats a date string (YYYY-MM-DD) into a more readable format (e.g. "Monday, January 1, 2024")
export function formatDate(dateString: string) {
  const [y, m, d] = dateString.split("-").map(Number);
  const date = new Date(y, m - 1, d);

  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  });
};