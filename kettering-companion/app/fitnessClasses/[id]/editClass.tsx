import { FormErrors, validateEntity } from "@/lib/validateEntity";
import { OfficerService } from "@/services/OfficerService";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";
import ClubForm from "../../../components/ClubForm";
import { to12Hour } from "../../../lib/time";
import { ClubService } from "../../../services/clubService";
import { UserService } from "../../../services/userService";
import { Club } from "../../../types/subscription";


export default function EditFitnessClassScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  // State for form errors
  const [errors, setErrors] = useState<FormErrors>({});
  const [values, setValues] = useState<Club | null>(null);
  // Load fitness class data on component mount
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
  // Handle fitness class update
  const handleUpdateFitnessClass = async () => {
    if (!values) return;
    const time = values.schedule[0];
    // Validate form values
    const {errors: validationErrors, parsedStart, parsedEnd} = 
          validateEntity(values, "club");
    
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
    // Update fitness class and regenerate meetings
    await ClubService.updateFitnessClass(values.id, updatedClub);
    await ClubService.regenerateMeetings(updatedClub);
    const officerEmail = values.officers?.[0];
    // Handle officer assignment
    if (officerEmail) {
      const userDoc = await UserService.findUserByEmail(officerEmail);
      if (userDoc) {
        await OfficerService.addOfficer(values.id, userDoc.id);
      }
    }

    router.push("/(tabs)/fitness");
  };
  // Handle fitness class deletion
  const handleDeleteFitnessClass = async () => {
    if (!values) return;
    if (!values.id) return;
    await ClubService.deleteFitnessClass(values!.id);
    router.replace("/fitness");
  }

  if(!values) return null;
  // Render form with current fitness class values
  return (
    <View style={{ flex: 1 }}>
      <ClubForm
        values={values}
        setValues={setValues as React.Dispatch<React.SetStateAction<Club>>}
        onSubmit={handleUpdateFitnessClass}
        submitLabel="Update Fitness Class"
        errors={errors}
        onDelete={handleDeleteFitnessClass}
      />
    </View>
  );
}
