import { generateMeetingDates } from "@/lib/generateEvents";
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
import { Club } from "../types/subscription";


export class ClubService {
    static getAllClubs = async (): Promise<Club[]> => {
        const snapshot = await getDocs(collection(db, "clubs"));

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

    static async createClub(club: Club) {
        if (!club.id) {
            throw new Error("Club must have an id");
        }
        await setDoc(doc(db, "clubs", club.id), club);
    };

    static async updateClub(id: string, data: Partial<Club>) {
        const ref = doc(db, "clubs", id);
        await updateDoc(ref, data);
    };

    static async deleteClub(id: string) {
        const ref = doc(db, "clubs", id);
        await deleteDoc(ref);
    };

    static async addOfficer(clubId: string, uid: string) {
        const ref = doc(db, "clubs", clubId);
        await updateDoc(ref, {
            officers: arrayUnion(uid)
        });
    };

    static async removeOfficer(clubId: string, uid: string) {
        const ref = doc(db, "clubs", clubId);
        await updateDoc(ref, {
            officers: arrayRemove(uid)
        });
    };

    static async createMeetings(club: any, meetings: any[]) {
        for (const meeting of meetings) {
            console.log("Creating meeting for club:", club.id, "on date:", meeting.date, "with time:", meeting.startTime, "-", meeting.endTime);
            const dateString =
                meeting.date.getFullYear() +
                "-" +
                String(meeting.date.getMonth() + 1).padStart(2, "0") +
                "-" +
                String(meeting.date.getDate()).padStart(2, "0");
            const ref = doc(collection(db, "meetings"), `${club.id}-${dateString}`);
            console.log("Start time:", meeting.startTime, "End time:", meeting.endTime);
            await setDoc(ref, {
                clubId: club.id,
                clubName: club.name,
                date: dateString,
                startTime: meeting.startTime,
                endTime: meeting.endTime,
                location: club.location ?? ""
            });
        }
    };

    static async regenerateMeetings(club: Club) {
        console.log("REGENERATING MEETINGS FOR:", club.id);
        const meetings = generateMeetingDates(club.schedule ?? []);
        // Remove existing meetings for this club
        const snapshot = await getDocs(collection(db, "meetings"));
        for (const meetingDoc of snapshot.docs) {
            if (meetingDoc.data().clubId === club.id) {
            await deleteDoc(meetingDoc.ref);
            }
        }
        // Create new meetings
        await ClubService.createMeetings(club, meetings);
    };
}
