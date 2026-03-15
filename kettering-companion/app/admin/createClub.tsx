import { useRouter } from "expo-router";
import { useState } from "react";
import ClubForm from "../../components/ClubForm";
import { parseTime } from "../../lib/time";
import { ClubService } from "../../services/clubService";
import { UserService } from "../../services/userService";
import { Club } from "../../types/subscription";

export default function CreateClubScreen() {

  const router = useRouter();
  const [timeError, setTimeError] = useState<string | null>(null);

  const [values, setValues] = useState<Club>({
    name: "",
    description: "",
    location: "",
    contactEmail: "",
    schedule: [
      {
        weekday: 1,
        frequency: "weekly",
        startDate: "",
        endDate: "",
        startTime: "",
        endTime: ""
      }
    ],
    officers: []
  });

  const handleCreateClub = async () => {

    const time = values.schedule[0];
    console.log("Creating club with time:", time);

    const parsedStart = parseTime(time.startTime);
    const parsedEnd = parseTime(time.endTime);

    if (!parsedStart || !parsedEnd) {
      setTimeError("Please enter valid start and end times.");
      return;
    }

    const clubId = values.name.toLowerCase().replace(/\s+/g, "-");

    const updatedClub = {
      ...values,
      id: clubId,
      schedule: [
        {
          ...time,
          startTime: parsedStart,
          endTime: parsedEnd
        }
      ]
    };
    console.log("Creating club with schedule:", updatedClub.schedule);

    await ClubService.createClub(updatedClub);
    await ClubService.regenerateMeetings(updatedClub);

    const officerEmail = values.officers?.[0] ?? "";
    // Add officer permissions
    if (officerEmail) {
      const userDoc = await UserService.findUserByEmail(officerEmail);

      if (userDoc) {
        await ClubService.addOfficer(clubId, userDoc.id);
      }
    }

    router.push("/(tabs)/clubs");
  };

  return (
    <ClubForm
      values={values}
      setValues={setValues}
      onSubmit={handleCreateClub}
      submitLabel="Create Club"
      timeError={timeError}
    />
  );
}
