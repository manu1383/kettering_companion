import { generateMeetingDates } from "@/lib/generateEvents";
import { Intramural } from "@/types/subscription";
import { collection, deleteDoc, doc, getDoc, getDocs, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";


export class IMService {
    static getAllGames = async (): Promise<Intramural[]> => {
        const snapshot = await getDocs(collection(db, "intramurals"));

        const meetings: Intramural[] = [];
        snapshot.docs.forEach(doc => {
            const data = doc.data();
            if (data.team1 && data.team2 && data.location && data.schedule && data.sport) {
                meetings.push({
                    id: data.id,
                    team1: data.team1,
                    team2: data.team2,
                    team1Id: data.team1Id,
                    team2Id: data.team2Id,
                    name: `${data.team1} vs ${data.team2}`,
                    location: data.location,
                    schedule: data.schedule,
                    sport: data.sport,
                    tourney: data.tourney
                });
            }
        });

        return meetings;
    };
    
    static getGame = async (id: string): Promise<Intramural | null> => {
        const docRef = doc(db, "intramurals", id);
        const docSnap = await getDoc(docRef);
        console.log("Document snapshot:", docSnap);

        if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.team1 && data.team2 && data.location && data.schedule && data.sport) {
                return {
                    id: data.id,
                    team1: data.team1,
                    team2: data.team2,
                    team1Id: data.team1Id,
                    team2Id: data.team2Id,
                    name: `${data.team1} vs ${data.team2}`,
                    location: data.location,
                    schedule: data.schedule,
                    sport: data.sport,
                    tourney: data.tourney
                };
            }
        }

        return null;
    };

    static createGame = async (game: Intramural) => {
        await setDoc(doc(db, "intramurals", game.id), game);
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
                team1Id: intramural.team1Id,
                team2Id: intramural.team2Id,
                name: intramural.name,
                sport: intramural.sport,
                tourney: intramural.tourney,
                schedule: intramural.schedule,
                location: intramural.location ?? ""
            });
        }
    };

    static async regenerateMeetings(game: Intramural) {
        const meetings = generateMeetingDates(game.schedule ?? []);
        // Remove existing meetings for this club
        const snapshot = await getDocs(collection(db, "meetings"));
        for (const meetingDoc of snapshot.docs) {
            if (meetingDoc.data().id === game.id) {
                await deleteDoc(meetingDoc.ref);
            }
        }
        // Create new meetings
        await IMService.createMeetings(game, meetings);
    };
}


