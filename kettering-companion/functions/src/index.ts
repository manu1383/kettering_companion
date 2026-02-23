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

  const response = await calendar.events.list({
    calendarId: sourceCalendarId,
    timeMin: new Date().toISOString(),
    maxResults: 50,
    singleEvents: true,
    orderBy: "startTime",
  });

  return response.data.items || [];
});