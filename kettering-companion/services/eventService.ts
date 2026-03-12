import {
    arrayRemove,
    arrayUnion,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc
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
        const ref = doc(db, "events", id);
        await deleteDoc(ref);
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
}
