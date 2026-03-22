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
  // State for form errors
  const [errors, setErrors] = useState<FormErrors>({});
  const [values, setValues] = useState<Club | null>(null);

  // Load club data on component mount
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
  // Handle club update
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
    // Update club and regenerate meetings
    await ClubService.updateClub(values.id, updatedClub);
    await ClubService.regenerateMeetings(updatedClub);

    const officerEmail = values.officers?.[0];
    // Add officer permissions if an email is provided
    if (officerEmail) {
      const userDoc = await UserService.findUserByEmail(officerEmail);

      if (userDoc) {
        await ClubService.addOfficer(values.id, userDoc.id);
      }
    }

    router.push("/(tabs)/clubs");
  };
  // Handle club deletion
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
