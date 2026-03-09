import cors from "cors";
import * as admin from "firebase-admin";
import { onRequest } from "firebase-functions/v2/https";
import { google } from "googleapis";

admin.initializeApp();
const db = admin.firestore();

const corsHandler = cors({ origin: true });

class CalendarService {

  private calendar;

  constructor() {
    const auth = new google.auth.GoogleAuth({
      scopes: ["https://www.googleapis.com/auth/calendar.readonly"],
    });

    this.calendar = google.calendar({ version: "v3", auth });
  }

  async getUserEmail(userId: string) {

    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      throw new Error("User not found");
    }

    const email = userDoc.data()?.email;

    if (!email) {
      throw new Error("User has no calendar email");
    }

    return email;
  }

  async getCachedCalendar(userId: string, month: string) {

    const cacheRef = db
      .collection("users")
      .doc(userId)
      .collection("calendarCache")
      .doc(month);

    const cacheDoc = await cacheRef.get();

    if (!cacheDoc.exists) return null;

    const lastUpdated = cacheDoc.data()?.lastUpdated?.toMillis?.();

    if (!lastUpdated) return null;

    const now = Date.now();

    if (now - lastUpdated < 10 * 60 * 1000) {
      return cacheDoc.data();
    }

    return null;
  }

  async fetchCalendarEvents(email: string, month: string) {

    const start = new Date(`${month}-01`);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);

    const events = await this.calendar.events.list({
      calendarId: email,
      timeMin: start.toISOString(),
      timeMax: end.toISOString(),
      singleEvents: true,
      orderBy: "startTime",
    });

    return events.data.items;
  }

  async cacheCalendar(userId: string, month: string, events: any) {

    const cacheRef = db
      .collection("users")
      .doc(userId)
      .collection("calendarCache")
      .doc(month);

    await cacheRef.set({
      events,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

}

const calendarService = new CalendarService();

export const refreshCalendar = onRequest((req, res) => {
  corsHandler(req, res, async () => {

    const userId =
      typeof req.query.userId === "string" ? req.query.userId : undefined;

    const month =
      typeof req.query.month === "string" ? req.query.month : undefined;

    if (!userId || !month) {
      res.status(400).send("Missing parameters");
      return;
    }

    try {

      const cached = await calendarService.getCachedCalendar(userId, month);

      if (cached) {
        res.json(cached);
        return;
      }

      const email = await calendarService.getUserEmail(userId);

      const events = await calendarService.fetchCalendarEvents(email, month);

      await calendarService.cacheCalendar(userId, month, events);

      res.json(events);

    } catch (error) {
      console.error("Calendar fetch failed:", error);
      res.status(500).send("Calendar fetch failed");
    }

  });
});