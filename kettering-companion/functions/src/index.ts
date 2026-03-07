import cors from "cors";
import * as admin from "firebase-admin";
import { onRequest } from "firebase-functions/v2/https";
import { google } from "googleapis";

admin.initializeApp();
const db = admin.firestore();
const corsHandler = cors({ origin: true });

const auth = new google.auth.GoogleAuth({
  scopes: ["https://www.googleapis.com/auth/calendar.readonly"],
});

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

    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      res.status(404).send("User not found");
      return;
    }

    const email = userDoc.data()?.email;

    if (!email) {
      res.status(400).send("User has no calendar email");
      return;
    }

    const cacheRef = userRef.collection("calendarCache").doc(month);
    const cacheDoc = await cacheRef.get();

    const now = Date.now();

    if (cacheDoc.exists) {
      const lastUpdated = cacheDoc.data()?.lastUpdated?.toMillis?.();

      if (lastUpdated && now - lastUpdated < 10 * 60 * 1000) {
        res.json(cacheDoc.data());
        return;
      }
    }

    const calendar = google.calendar({ version: "v3", auth });

    const start = new Date(`${month}-01`);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);

    try {

      const events = await calendar.events.list({
        calendarId: email,
        timeMin: start.toISOString(),
        timeMax: end.toISOString(),
        singleEvents: true,
        orderBy: "startTime",
      });

      await cacheRef.set({
        events: events.data.items,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      });

      res.json(events.data.items);

    } catch (error) {
      console.error("Calendar fetch failed:", error);
      res.status(500).send("Calendar fetch failed");
    }
  });
});