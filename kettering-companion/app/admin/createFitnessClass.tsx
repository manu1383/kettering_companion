import { FormErrors, validateEntity } from "@/lib/validateEntity";
import { useRouter } from "expo-router";
import { useState } from "react";
import ClubForm from "../../components/ClubForm";
import { ClubService } from "../../services/clubService";
import { UserService } from "../../services/userService";
import { Club } from "../../types/subscription";

export default function CreateFitnessClassScreen() {

  const router = useRouter();
  const [errors, setErrors] = useState<FormErrors>({});
  const [timeError, setTimeError] = useState<string | null>(null);

  const [values, setValues] = useState<Club>({
    id: "",
    name: "",
    description: "",
    location: "",
    contactEmail: "",
    schedule: [
      {
        weekdays: [],
        frequency: "weekly",
        startDate: "",
        endDate: "",
        startTime: "",
        endTime: ""
      }
    ],
    officers: []
  });
  
  const handleSubmit = async () => {
    const {errors: validationErrors, parsedStart, parsedEnd} = 
      validateEntity(values, "fitness");

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    await handleCreateClub(parsedStart!, parsedEnd!);
  };

  const handleCreateClub = async (parsedStart: string, parsedEnd: string) => {
    const time = values.schedule[0];

    const id = values.name.toLowerCase().replace(/\s+/g, "-");

    const updatedClub = {
      ...values,
      id: id,
      schedule: [
        {
          ...time,
          startTime: parsedStart,
          endTime: parsedEnd
        }
      ]
    };

    await ClubService.createFitnessClass(updatedClub);
    await ClubService.regenerateMeetings(updatedClub);

    const officerEmail = values.officers?.[0] ?? "";
    // Add officer permissions
    if (officerEmail) {
      const userDoc = await UserService.findUserByEmail(officerEmail);

      if (userDoc) {
        await ClubService.addFitnessInstructor(id, userDoc.id);
      }
    }

    router.push("/(tabs)/fitness");
  };

  return (
    <ClubForm
      values={values}
      setValues={setValues}
      onSubmit={handleSubmit}
      submitLabel="Create Fitness Class"
      errors={errors}
      isFitnessClass={true}
    />
  );
}
