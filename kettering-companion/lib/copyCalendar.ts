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
  sourceId: string
): Promise<GoogleCalendarEvent[]> {
  const copyFn = httpsCallable(functions, "copyCalendarEvents");

  const result = await copyFn({
    sourceCalendarId: sourceId,
  });

  return result.data as GoogleCalendarEvent[];
}