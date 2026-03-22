import IntramuralForm from "@/components/IntramuralForm";
import { to12Hour } from "@/lib/time";
import { FormErrors } from "@/lib/validateEntity";
import { validateIntramural } from "@/lib/validateIntramural";
import { useLocalSearchParams, useRouter } from "expo-router";
import { collection, deleteDoc, doc, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { db } from "../../../lib/firebase";
import { FitnessService } from "../../../services/fitnessService";
import { Intramural } from "../../../types/subscription";


export default function EditEventScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [errors, setErrors] = useState<FormErrors>({});
  const [values, setValues] = useState<Intramural | null>(null);

  useEffect(() => {
    const loadGame = async () => {
      const game = await FitnessService.getGame(id as string);
      if (game && game.schedule?.length) {
        const time = game.schedule?.[0];
        setValues({
          ...game,
          schedule: [
            {
              ...time,
              startTime: to12Hour(time.startTime),
              endTime: to12Hour(time.endTime)
            }
          ]
        });
      }
    };
    loadGame();
  }, [id]);

  const handleUpdateGame = async () => {
    if (!values) return;

    const {errors: validationErrors, parsedStart, parsedEnd} =
      validateIntramural(values);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});

    const time = values.schedule[0];
    if (!parsedStart || !parsedEnd) { return; }

    const updatedGame = {
      ...values,
      schedule: [
        {
          ...time,
          startTime: parsedStart,
          endTime: parsedEnd
        }
      ]
    };
    await FitnessService.updateGame(values.id, updatedGame);
    await FitnessService.regenerateMeetings(updatedGame);

    router.push("/(tabs)/fitness");
  };

  const handleDeleteGame = async () => {
    const gameId = id as string;

    // delete game
    await deleteDoc(doc(db, "intramurals", gameId));

    // delete generated meetings
    const snapshot = await getDocs(collection(db, "intramurals"));

    for (const game of snapshot.docs) {
      if (game.data().id === gameId) {
        await deleteDoc(game.ref);
      }
    }

    router.replace("/(tabs)/fitness");
  };

  if(!values) return null;

  return (
    <View style={{ flex: 1 }}>
    
      <IntramuralForm
        values={values}
        setValues={setValues as React.Dispatch<React.SetStateAction<Intramural>>}
        onSubmit={handleUpdateGame}
        submitLabel="Update Game"
        errors={errors}
        onDelete={handleDeleteGame}
      />

    </View>
  );
}
