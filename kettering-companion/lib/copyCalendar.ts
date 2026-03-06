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
  date: string,
  accessToken: string
) {
  const copyFn = httpsCallable(functions, "copyCalendarEvents");

  const result = await copyFn({
    date,
    accessToken,
  });

  return result.data as any[];
}