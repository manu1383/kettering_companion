import IntramuralForm from "@/components/IntramuralForm";
import { parseTime, to12Hour } from "@/lib/time";
import { useLocalSearchParams, useRouter } from "expo-router";
import { collection, deleteDoc, doc, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
    View
} from "react-native";
import { db } from "../../../lib/firebase";
import { IMService } from "../../../services/imService";
import { Intramural } from "../../../types/subscription";


export default function EditEventScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [timeError, setTimeError] = useState<string | null>(null);
  const [values, setValues] = useState<Intramural | null>(null);

  useEffect(() => {
    const loadGame = async () => {
      const game = await IMService.getGame(id as string);
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
    const time = values.schedule[0];
    const parsedStart = parseTime(time.startTime);
    const parsedEnd = parseTime(time.endTime);
    if (!parsedStart || !parsedEnd) {
      setTimeError("Please enter valid start and end times.");
      return;
    }
    if(!values.id) return
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
    await IMService.updateGame(values.id, updatedGame);
    await IMService.regenerateMeetings(updatedGame);

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
        timeError={timeError}
        onDelete={handleDeleteGame}
      />

    </View>
  );
}
