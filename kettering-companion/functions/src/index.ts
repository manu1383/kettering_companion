import * as admin from "firebase-admin";
import { onCall } from "firebase-functions/v2/https";
import { google } from "googleapis";

admin.initializeApp();

export const copyCalendarEvents = onCall(async (request) => {
  const { sourceCalendarId } = request.data;

  if (!sourceCalendarId) {
    throw new Error("Missing sourceCalendarId");
  }

  const auth = new google.auth.GoogleAuth({
    keyFile: "serviceAccountKey.json",
    scopes: ["https://www.googleapis.com/auth/calendar.readonly"],
  });

  const calendar = google.calendar({ version: "v3", auth });

  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const response = await calendar.events.list({
    calendarId: sourceCalendarId,
    timeMin: start.toISOString(),
    timeMax: end.toISOString(),
    maxResults: 100,
    singleEvents: true,
    orderBy: "startTime",
    timeZone: "America/New_York",
  });

  console.log(
    "EVENTS RETURNED:",
    response.data.items?.map((e) => ({
      id: e.id,
      summary: e.summary,
      start: e.start,
      end: e.end,
      recurringEventId: e.recurringEventId
    }))
  );

  return response.data.items || [];
});