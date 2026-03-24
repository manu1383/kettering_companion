import { generateMeetingDates } from "@/lib/generateEvents";
import { Intramural } from "@/types/subscription";
import { collection, deleteDoc, doc, getDoc, getDocs, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";


export class FitnessService {
    static getAllGames = async (): Promise<Intramural[]> => {
        const snapshot = await getDocs(collection(db, "intramurals"));

        return snapshot.docs.map(
            doc => ({ id: doc.id, ...doc.data() })
        ) as Intramural[];
    };
    
    static getGame = async (id: string): Promise<Intramural | null> => {
        const docRef = doc(db, "intramurals", id);
        const docSnap = await getDoc(docRef);
        console.log("Document snapshot:", docSnap);

        if (!docSnap.exists()) { return null; }

        return { id: docSnap.id, ...docSnap.data() } as Intramural;
    };

    static createGame = async (game: Intramural) => {
        await setDoc(doc(db, "intramurals", game.id), game);

        const meetings = generateMeetingDates(game.schedule ?? []);
        console.log("Generated meetings: ", meetings);
        console.log("Game schedule: ", game.schedule);
        await FitnessService.createMeetings(game, meetings);
    };

    static updateGame = async (id: string, game: Partial<Intramural>) => {
        const docRef = doc(db, "intramurals", id);
        await updateDoc(docRef, game);
    };

    static deleteGame = async (id: string) => {
        const docRef = doc(db, "intramurals", id);
        await deleteDoc(docRef);
    };

    static async createMeetings(intramural: any, games: any[]) {
        for (const game of games) {
            const dateString =
                game.date.getFullYear() +
                "-" +
                String(game.date.getMonth() + 1).padStart(2, "0") +
                "-" +
                String(game.date.getDate()).padStart(2, "0");
            const ref = doc(collection(db, "meetings"), `${intramural.id}-${dateString}-${intramural.team1Id}-${intramural.team2Id}`);
            await setDoc(ref, {
                id: intramural.id,
                team1: intramural.team1,
                team2: intramural.team2,
                name: intramural.name,
                sport: intramural.sport,
                tourney: intramural.tourney,
                date: dateString,
                startTime: game.startTime,
                endTime: game.endTime,
                location: intramural.location ?? ""
            });
        }
    };

    static async regenerateMeetings(game: Intramural) {
        const meetings = generateMeetingDates(game.schedule ?? []);
        console.log("Generated meetings in regenerateMeetings: ", meetings);
        // Remove existing meetings for this club
        const snapshot = await getDocs(collection(db, "meetings"));
        for (const meetingDoc of snapshot.docs) {
            if (meetingDoc.data().id === game.id) {
                await deleteDoc(meetingDoc.ref);
            }
        }
        // Create new meetings
        await FitnessService.createMeetings(game, meetings);
    };
}


