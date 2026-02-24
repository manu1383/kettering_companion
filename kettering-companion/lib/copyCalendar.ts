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
  sourceId: string,
  date: Date
): Promise<GoogleCalendarEvent[]> {
  const copyFn = httpsCallable(functions, "copyCalendarEvents");

  const result = await copyFn({
    sourceCalendarId: sourceId,
    date: date.toISOString(),
  });

  return result.data as GoogleCalendarEvent[];
}