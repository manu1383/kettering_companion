import { Officer } from "@/types/subscription";
import { arrayRemove, arrayUnion, doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

export class OfficerService {

    static async getOfficersFromIds(ids: string[]): Promise<Officer[]> {
        const officers = await Promise.all(
            ids.map(async (uid) => {
                const userDoc = await getDoc(doc(db,"users",uid));
                if (!userDoc.exists()) return null;
                return {
                uid,
                ...(userDoc.data() as Omit<Officer,"uid">)
                };
            })
        );
        return officers.filter(Boolean) as Officer[];
    };
    

    static async addOfficer(id: string, uid: string) {
        const ref = doc(db, "clubs", id);
        await updateDoc(ref, {
            officers: arrayUnion(uid)
        });
    };

    static async addFitnessInstructor(id: string, uid: string) {
        const ref = doc(db, "fitnessClasses", id);
        await updateDoc(ref, {
            officers: arrayUnion(uid)
        });
    };

    static async removeOfficer(id: string, uid: string) {
        const ref = doc(db, "clubs", id);
        await updateDoc(ref, {
            officers: arrayRemove(uid)
        });
    };

    static async removeFitnessInstructor(id: string, uid: string) {
        const ref = doc(db, "fitnessClasses", id);
        await updateDoc(ref, {
            officers: arrayRemove(uid)
        });
    };
}