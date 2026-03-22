import { FormErrors, validateEntity } from "@/lib/validateEntity";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";
import ClubForm from "../../../components/ClubForm";
import { to12Hour } from "../../../lib/time";
import { ClubService } from "../../../services/clubService";
import { UserService } from "../../../services/userService";
import { Club } from "../../../types/subscription";


export default function EditClubScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [errors, setErrors] = useState<FormErrors>({});
  const [timeError, setTimeError] = useState<string | null>(null);
  const [values, setValues] = useState<Club | null>(null);


  useEffect(() => {
    const loadClub = async () => {  
      const club = await ClubService.getClub(id as string);
      if (club && club.schedule?.length) {
        const time = club.schedule?.[0];
        setValues({
          ...club,
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
    loadClub();
  }, [id]);

  const handleUpdateClub = async () => {
    if (!values) return;

    const {errors: validationErrors, parsedStart, parsedEnd} = 
      validateEntity(values, "club");

    const time = values.schedule[0];

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    if (!parsedStart || !parsedEnd) { return; }

    setErrors({});

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

    await ClubService.updateClub(values.id, updatedClub);
    await ClubService.regenerateMeetings(updatedClub);

    const officerEmail = values.officers?.[0];
  
    if (officerEmail) {
      const userDoc = await UserService.findUserByEmail(officerEmail);

      if (userDoc) {
        await ClubService.addOfficer(values.id, userDoc.id);
      }
    }

    router.push("/(tabs)/clubs");
  };

  const handleDeleteClub = async () => {
    if (!values) return;
    if (!values.id) return;
    await ClubService.deleteClub(values!.id);
    router.replace("/clubs");
  }

  if(!values) return null;

  return (
    <View style={{ flex: 1 }}>

      <ClubForm
        values={values}
        setValues={setValues as React.Dispatch<React.SetStateAction<Club>>}
        onSubmit={handleUpdateClub}
        submitLabel="Update Club"
        errors={errors}
        onDelete={handleDeleteClub}
      />

    </View>
  );
}
