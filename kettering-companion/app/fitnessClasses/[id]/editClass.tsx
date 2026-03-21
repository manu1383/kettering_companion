import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    View
} from "react-native";
import ClubForm from "../../../components/ClubForm";
import { parseTime, to12Hour } from "../../../lib/time";
import { ClubService } from "../../../services/clubService";
import { UserService } from "../../../services/userService";
import { Club } from "../../../types/subscription";


export default function EditFitnessClassScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [timeError, setTimeError] = useState<string | null>(null);
  const [values, setValues] = useState<Club | null>(null);

  useEffect(() => {
    const loadFitnessClass = async () => {
      const fitnessClass = await ClubService.getFitnessClass(id as string);
      if (fitnessClass && fitnessClass.schedule?.length) {
        const time = fitnessClass.schedule?.[0];
        setValues({
          ...fitnessClass,
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
    loadFitnessClass();
  }, [id]);

  const handleUpdateFitnessClass = async () => {
    if (!values) return;
    const time = values.schedule[0];
    const parsedStart = parseTime(time.startTime);
    const parsedEnd = parseTime(time.endTime);
    if (!parsedStart || !parsedEnd) {
      setTimeError("Please enter valid start and end times.");
      return;
    }
    if(!values.id) return
    const updatedClub = {
      ...values,
      schedule: [
        {
          ...time,
          startTime: parsedStart,
          endTime: parsedEnd
        }
      ]
    };
    await ClubService.updateFitnessClass(values.id, updatedClub);
    await ClubService.regenerateMeetings(updatedClub);
    console.log(values.officers);
    const officerEmail = values.officers?.[0];
  
    if (officerEmail) {
      const userDoc = await UserService.findUserByEmail(officerEmail);

      if (userDoc) {
        await ClubService.addOfficer(values.id, userDoc.id);
      }
    }

    router.push("/(tabs)/fitness");
  };

  const handleDeleteFitnessClass = async () => {
    if (!values) return;
    if (!values.id) return;
    await ClubService.deleteFitnessClass(values!.id);
    router.replace("/fitness");
  }

  if(!values) return null;

  return (
    <View style={{ flex: 1 }}>

      <ClubForm
        values={values}
        setValues={setValues as React.Dispatch<React.SetStateAction<Club>>}
        onSubmit={handleUpdateFitnessClass}
        submitLabel="Update Fitness Class"
        timeError={timeError}
        onDelete={handleDeleteFitnessClass}
      />

    </View>
  );
}
