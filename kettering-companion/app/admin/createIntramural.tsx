import { FormErrors } from "@/lib/validateEntity";
import { validateIntramural } from "@/lib/validateIntramural";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import IntramuralForm from "../../components/IntramuralForm";
import { FitnessService } from "../../services/fitnessService";
import { Intramural } from "../../types/subscription";

export default function CreateIntramuralScreen() {
    const router = useRouter();
    
    const [errors, setErrors] = useState<FormErrors>({});
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

    const handleSubmit = async () => {
        const {errors: validationErrors, parsedStart, parsedEnd} =
            validateIntramural(values);

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setErrors({});
        await handleCreateGame(parsedStart!, parsedEnd!);
    };

    const handleCreateGame = async (parsedStart: string, parsedEnd: string) => {
        const time = values.schedule[0];
    
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
    
        await FitnessService.createGame(updatedGame);
        await FitnessService.regenerateMeetings(updatedGame);
    
        router.push("/(tabs)/fitness");
    };

    return (
        <IntramuralForm
            values={values}
            setValues={setValues}
            onSubmit={handleSubmit}
            submitLabel="Create Game"
            errors={errors}
        />
    );
}