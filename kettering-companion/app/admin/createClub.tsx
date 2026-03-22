import { FormErrors, validateEntity } from "@/lib/validateEntity";
import { useRouter } from "expo-router";
import { useState } from "react";
import ClubForm from "../../components/ClubForm";
import { ClubService } from "../../services/clubService";
import { UserService } from "../../services/userService";
import { Club } from "../../types/subscription";

export default function CreateClubScreen() {
  // Router for navigation
  const router = useRouter();
  // State for form errors
  const [errors, setErrors] = useState<FormErrors>({});
  // State for form values
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

  // Handle form submission
  const handleSubmit = async () => {
    const {errors: validationErrors, parsedStart, parsedEnd} = 
      validateEntity(values, "club");

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    await handleCreateClub(parsedStart!, parsedEnd!);
  };

  // Create club and handle officer assignment
  const handleCreateClub = async (parsedStart: string, parsedEnd: string) => {
    const id = values.name.toLowerCase().replace(/\s+/g, "-");
    const time = values.schedule[0];


    const updatedClub = {
      ...values,
      id,
      schedule: [
        {
          ...time,
          startTime: parsedStart,
          endTime: parsedEnd
        }
      ]
    };

    await ClubService.createClub(updatedClub);
    await ClubService.regenerateMeetings(updatedClub);

    const officerEmail = values.officers?.[0] ?? "";

    if (officerEmail) {
      const userDoc = await UserService.findUserByEmail(officerEmail);

      if (userDoc) {
        await ClubService.addOfficer(id, userDoc.id);
      }
    }

    router.push("/(tabs)/clubs");
  };
  
  // Render the club form with current values, errors, and submit handler
  return (
    <ClubForm
      values={values}
      setValues={setValues}
      onSubmit={handleSubmit}
      submitLabel="Create Club"
      errors={errors}
    />
  );
}