import { db } from "@/lib/firebase";
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
import { Club } from "../types/club";

export const getAllClubs = async (): Promise<Club[]> => {
    const snapshot = await getDocs(collection(db, "clubs"));

    return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Club, "id">),
    }));
};

export const getClub = async (id: string): Promise<Club | null> => {
    const snapshot = await getDoc(doc(db, "clubs", id));

    if (!snapshot.exists()) return null;

    return {
        id: snapshot.id,
        ...(snapshot.data() as Omit<Club, "id">),
    };
};

export const findUserByEmail = async (email: string) => {
    const q = query(
        collection(db, "users"),
        where("email", "==", email.toLowerCase())
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) return null;

    return snapshot.docs[0];
};

export const createClub = async (club: Club) => {
    const clubId = club.name.toLowerCase().replace(/\s+/g, "-");

    await setDoc(doc(db, "clubs", clubId), club);
};

export const updateClub = async (id: string, club: Partial<Club>) => {
    await updateDoc(doc(db, "clubs", id), club);
};

export const deleteClub = async (id: string) => {
    await deleteDoc(doc(db, "clubs", id));
};

export const addOfficer = async (clubId: string, uid: string) => {
    await updateDoc(doc(db, "clubs", clubId), {
        officers: arrayUnion(uid)
    });
};

export const removeOfficer = async (clubId: string, uid: string) => {
    await updateDoc(doc(db, "clubs", clubId), {
        officers: arrayRemove(uid)
    });
};