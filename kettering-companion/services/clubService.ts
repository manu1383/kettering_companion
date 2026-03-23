import { generateMeetingDates } from "@/lib/generateEvents";
import {
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
import { Club } from "../types/subscription";


export class ClubService {
    static getAllClubs = async (): Promise<Club[]> => {
        const snapshot = await getDocs(collection(db, "clubs"));

        return snapshot.docs.map(
            doc => ({ id: doc.id, ...doc.data() })
        ) as Club[];
    };

    static getAllFitnessClasses = async (): Promise<Club[]> => {
        const snapshot = await getDocs(collection(db, "fitnessClasses"));

        return snapshot.docs.map(
            doc => ({ id: doc.id, ...doc.data() })
        ) as Club[];
    };

    static getClub = async (id: string): Promise<Club | null> => {
        const ref = doc(db, "clubs", id);
        const snapshot = await getDoc(ref);

        if (!snapshot.exists()) return null;

        return { id: snapshot.id, ...snapshot.data() } as Club;
    };

    static getFitnessClass = async (id: string): Promise<Club | null> => {
        const ref = doc(db, "fitnessClasses", id);
        const snapshot = await getDoc(ref);
        
        if (!snapshot.exists()) return null;
        return { id: snapshot.id, ...snapshot.data() } as Club;
    };

    static async createClub(club: Club) {
        if (!club.id) {
            throw new Error("Club must have an id");
        }
        await setDoc(doc(db, "clubs", club.id), club);
    };

    static async createFitnessClass(club: Club) {
        if (!club.id) {
            throw new Error("Fitness class must have an id");
        }
        await setDoc(doc(db, "fitnessClasses", club.id), club);
    };

    static async updateClub(id: string, data: Partial<Club>) {
        const ref = doc(db, "clubs", id);
        await updateDoc(ref, data);
    };

    static async updateFitnessClass(id: string, data: Partial<Club>) {
        const ref = doc(db, "fitnessClasses", id);
        await updateDoc(ref, data);
    };

    static async deleteClub(id: string) {
        const q = query(
            collection(db, "meetings"),
            where("id", "==", id)
        );

        const snapshot = await getDocs(q);

        for (const meetingDoc of snapshot.docs) {
            await deleteDoc(meetingDoc.ref);
        }

        // 2. delete the club
        await deleteDoc(doc(db, "clubs", id));
    };

    static async deleteFitnessClass(id: string) {
        const q = query(
            collection(db, "meetings"),
            where("id", "==", id)
        );

        const snapshot = await getDocs(q);
        
        for (const meetingDoc of snapshot.docs) {
            await deleteDoc(meetingDoc.ref);
        }

        await deleteDoc(doc(db, "fitnessClasses", id));
    };

    static async createMeetings(club: any, meetings: any[]) {
        for (const meeting of meetings) {
            const dateString =
                meeting.date.getFullYear() +
                "-" +
                String(meeting.date.getMonth() + 1).padStart(2, "0") +
                "-" +
                String(meeting.date.getDate()).padStart(2, "0");
            const ref = doc(collection(db, "meetings"), `${club.id}-${dateString}`);
            await setDoc(ref, {
                id: club.id,
                name: club.name,
                date: dateString,
                startTime: meeting.startTime,
                endTime: meeting.endTime,
                location: club.location ?? ""
            });
        }
    };

    static async regenerateMeetings(club: Club) {
        const meetings = generateMeetingDates(club.schedule ?? []);
        // Remove existing meetings for this club
        const snapshot = await getDocs(collection(db, "meetings"));
        for (const meetingDoc of snapshot.docs) {
            if (meetingDoc.data().id === club.id) {
                await deleteDoc(meetingDoc.ref);
            }
        }
        // Create new meetings
        await ClubService.createMeetings(club, meetings);
    };

    static subscribeToClub = async (uid: string, id: string) => {
        await setDoc(
            doc(db, "users", uid, "subscriptions", id),
            { id }
        );
    };

    static unsubscribeFromClub = async (uid: string, id: string) => {
        await deleteDoc(
            doc(db, "users", uid, "subscriptions", id)
        );
    };

    static async getUserSubscribedClubs(uid: string): Promise<string[]> {
        const snapshot = await getDocs(
            collection(db, "users", uid, "subscriptions")
        );
        return snapshot.docs.map(doc => doc.id);
    };
}
