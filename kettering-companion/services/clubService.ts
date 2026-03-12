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
}
