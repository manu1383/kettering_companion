import { useRouter } from "expo-router";
import React, { useState } from "react";
import IntramuralForm from "../../components/IntramuralForm";
import { parseTime } from "../../lib/time";
import { IMService } from "../../services/imService";
import { Intramural } from "../../types/subscription";

export default function CreateIntramuralScreen() {
    const router = useRouter();
    const [timeError, setTimeError] = useState<string | null>(null);
    const [values, setValues] = useState<Intramural>({
        id: "",
        team1: "",
        team2: "",
        team1Id: "",
        team2Id: "",
        name: "",
        location: "",
        schedule: [
            {
                startDate: "",
                startTime: "",
                endTime: ""
            }
        ],
        sport: "",
        tourney: "",
    });

    const handleCreateGame = async () => {
        const time = values.schedule[0];
        const parsedStart = parseTime(time.startTime);
        const parsedEnd = parseTime(time.endTime);
    
        if (!parsedStart || !parsedEnd) {
            setTimeError("Please enter valid start and end times.");
            return;
        }
        values.name = `${values.team1} vs ${values.team2} ${values.sport}`;
    
        const gameId = values.name.toLowerCase().replace(/\s+/g, "-");
        const team1Id = (values.sport+"_"+values.tourney+"_"+values.team1).toLowerCase().replace(/\s+/g, "-");;
        const team2Id = (values.sport+"_"+values.tourney+"_"+values.team2).toLowerCase().replace(/\s+/g, "-");;

        const updatedGame = {
            ...values,
            id: gameId,
            name: values.name,
            team1Id: team1Id,
            team2Id: team2Id,
            schedule: [
            {
                ...time,
                startTime: parsedStart,
                endTime: parsedEnd
            }
            ]
        };
        console.log("Creating game with values:", updatedGame);
    
        await IMService.createGame(updatedGame);
        await IMService.regenerateMeetings(updatedGame);
    
        router.push("/(tabs)/fitness");
    };

    return (
        <IntramuralForm
            values={values}
            setValues={setValues}
            onSubmit={handleCreateGame}
            timeError={timeError}
            submitLabel="Create Game"
        />
    );
}