import * as admin from "firebase-admin";
import { onRequest } from "firebase-functions/v2/https";
import { google } from "googleapis";

admin.initializeApp();
const db = admin.firestore();

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

  async getUserSubscriptions(userId: string) {
    const snapshot = await db
      .collection("users")
      .doc(userId)
      .collection("subscriptions")
      .get();
    const ids: string[] = [];
    snapshot.forEach(doc => {
      ids.push(doc.id);
    });
    console.log("User subscriptions:", ids);
    return ids;
  }

  async getCachedCalendar(userId: string, month: string, force = false) {
    if (force) return null;
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

  async fetchMeetings(userId: string, month: string) {
    const start = new Date(`${month}-01`);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);
    const subscriptions = await this.getUserSubscriptions(userId);
    if (subscriptions.length === 0) return [];
    const snapshot = await db.collection("meetings").get();
    const meetings: any[] = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      const subSet = new Set(subscriptions);
      if (
        !subSet.has(data.id)
      ) return;
      if (!data.date) return;
      const meetingDate = new Date(data.date);
      if (meetingDate >= start && meetingDate < end) {
        meetings.push({
          id: doc.id,
          summary: `${data.name}`,
          start: {
            dateTime: `${data.date}T${data.startTime}:00`,
          },
          end: {
            dateTime: `${data.date}T${data.endTime}:00`,
          },
        });
      }
    });
    return meetings;
  }

  async fetchFitnessEvents(userId: string, month: string) {
    const start = new Date(`${month}-01`);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);
    const subscriptions = await this.getUserSubscriptions(userId);
    if (subscriptions.length === 0) return [];
    const snapshot = await db.collection("intramurals").get();
    const fitnessEvents: any[] = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      const subSet = new Set(subscriptions);
      if (
        !subSet.has(data.id)
      ) return;
      if (!data.startDate) return;
      const meetingDate = new Date(data.startDate);
      if (meetingDate >= start && meetingDate < end) {
        fitnessEvents.push({
          id: doc.id,
          summary: `${data.name}`,
          start: {
            dateTime: `${data.startDate}T${data.startTime}:00`,
          },
          end: {
            dateTime: `${data.startDate}T${data.endTime}:00`,
          },
        });
      }
    });
    return fitnessEvents;
  }
}

export const refreshCalendar = onRequest(
  { region: "us-central1" },
  async (req, res) => {

    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    const userId =
      typeof req.query.userId === "string" ? req.query.userId : undefined;

    const month =
      typeof req.query.month === "string" ? req.query.month : undefined;

    if (!userId || !month) {
      res.status(400).send("Missing parameters");
      return;
    }

    try {
      const force = req.query.force === "true";

      const calendarService = new CalendarService();

      const cached = await calendarService.getCachedCalendar(userId, month, force);

      if (cached) {
        res.json(cached);
        return;
      }

      const email = await calendarService.getUserEmail(userId);

      const googleEvents =
        await calendarService.fetchCalendarEvents(email, month) || [];

      const meetings =
        await calendarService.fetchMeetings(userId, month);

      const fitness =
        await calendarService.fetchFitnessEvents(userId, month);

      const events = [...googleEvents, ...meetings, ...fitness];

      await calendarService.cacheCalendar(userId, month, events);

      res.json({ events });

    } catch (error) {
      console.error("Calendar fetch failed:", error);
      res.status(500).send("Calendar fetch failed");
    }
  }
);