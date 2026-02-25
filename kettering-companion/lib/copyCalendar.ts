import { httpsCallable } from "firebase/functions";
import { functions } from "./firebaseConfig";

export interface GoogleCalendarEvent {
  id: string;
  summary?: string;
  start?: {
    dateTime?: string;
  };
  end?: {
    dateTime?: string;
  };
}

export async function copyCalendar(
  date: Date,
  accessToken: string
) {
  const copyFn = httpsCallable(functions, "copyCalendarEvents");

  const formattedDate = date.toISOString().split("T")[0];

  const result = await copyFn({
    date: formattedDate,
    accessToken,
  });

  return result.data as any[];
}