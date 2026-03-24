import { generateMeetingDates } from "@/lib/generateEvents";
import {
    arrayRemove,
    arrayUnion,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    query,
    setDoc,
    updateDoc,
    where
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { Event } from "../types/subscription";

export class EventService {
    static getAllEvents = async (): Promise<Event[]> => {
        const snapshot = await getDocs(collection(db, "events"));

        return snapshot.docs.map(
            doc => ({ id: doc.id, ...doc.data() })
        ) as Event[];
    };

    static getEvent = async (id: string): Promise<Event | null> => {
        const ref = doc(db, "events", id);
        const snapshot = await getDoc(ref);

        if (!snapshot.exists()) return null;

        return { id: snapshot.id, ...snapshot.data() } as Event;
    };

    static async createEvent(event: Event) {
        if (!event.id) {
            throw new Error("Event must have an id");
        }
        await setDoc(doc(db, "events", event.id), event);
    };

    static async updateEvent(id: string, data: Partial<Event>) {
        const ref = doc(db, "events", id);
        await updateDoc(ref, data);
    };

    static async deleteEvent(id: string) {
        const q = query(
            collection(db, "meetings"),
            where("id", "==", id)
        );
        const snapshot = await getDocs(q);

        snapshot.forEach(async (doc) => {
            await deleteDoc(doc.ref);
        });

    
    };
    // User subscribes to club event
    static async addAttendee(eventId: string, uid: string) {
        const ref = doc(db, "events", eventId);
        await updateDoc(ref, {
            attendees: arrayUnion(uid)
        });
    };
    // User unsubscribes from club event
    static async removeAttendee(eventId: string, uid: string) {
        const ref = doc(db, "events", eventId);
        await updateDoc(ref, {
            attendees: arrayRemove(uid)
        });
    };

    static async createMeetings(event: any, meetings: any[]) {
        for (const meeting of meetings) {
            const dateString =
                meeting.date.getFullYear() +
                "-" +
                String(meeting.date.getMonth() + 1).padStart(2, "0") +
                "-" +
                String(meeting.date.getDate()).padStart(2, "0");
            const ref = doc(collection(db, "meetings"), `${event.id}-${dateString}`);
            await setDoc(ref, {
                id: event.id,
                name: event.name,
                date: dateString,
                startTime: meeting.startTime,
                endTime: meeting.endTime,
                location: event.location ?? ""
            });
        }
    };

    static async regenerateMeetings(event: Event) {
        const meetings = generateMeetingDates(event.schedule ?? []);
        console.log("Generated meetings in regenerateMeetings: ", meetings);
        // Remove existing meetings for this club
        const snapshot = await getDocs(collection(db, "meetings"));
        for (const meetingDoc of snapshot.docs) {
            if (meetingDoc.data().id === event.id) {
                await deleteDoc(meetingDoc.ref);
            }
        }
        // Create new meetings
        await EventService.createMeetings(event, meetings);
    };
}
