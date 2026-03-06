import * as admin from "firebase-admin";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { google } from "googleapis";

admin.initializeApp();

export const copyCalendarEvents = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }

  const { accessToken, date } = request.data;

  if (!accessToken) {
    throw new HttpsError("invalid-argument", "Missing Google access token");
  }

  if (!date) {
    throw new HttpsError("invalid-argument", "Missing date parameter");
  }

  const start = `${date}T00:00:00-05:00`;
  const end = `${date}T23:59:59-05:00`;

  try {
    // Use OAuth2 client (NOT service account)
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });

    const calendar = google.calendar({ version: "v3", auth });

    const response = await calendar.events.list({
      calendarId: "primary",
      timeMin: start,
      timeMax: end,
      singleEvents: true,
      orderBy: "startTime",
      timeZone: "America/New_York",
    });

    return response.data.items || [];

  } catch (error: any) {
    console.error("GOOGLE ERROR:", error);
    throw new HttpsError("internal", error.message);
  }
});