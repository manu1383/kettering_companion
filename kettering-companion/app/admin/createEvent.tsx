import ClubForm from "@/components/ClubForm";
import { parseTime } from "@/lib/time";
import { useRouter } from "expo-router";
import { useState } from "react";
import { EventService } from "../../services/eventService";
import { Event } from "../../types/subscription";

export default function CreateEventScreen() {
  const router = useRouter();
  const [timeError, setTimeError] = useState<string | null>(null);

  const [values, setValues] = useState<Event>({
    id: "",
    name: "",
    description: "",
    location: "",
    contactEmail: "",
    schedule: [
      {
        weekday: 1,
        frequency: "never",
        startDate: "",
        endDate: "",
        startTime: "",
        endTime: ""
      }
    ],
    attendees: []
  });

  const handleCreateEvent = async () => {
    const time = values.schedule[0];
    const parsedStart = parseTime(time.startTime);
    const parsedEnd = parseTime(time.endTime);

    if (!parsedStart || !parsedEnd) {
      setTimeError("Please enter valid start and end times.");
      return;
    }

    const eventId = values.name.toLowerCase().replace(/\s+/g, "-");

    const updatedEvent = {
      ...values,
      id: eventId,
      schedule: [
        {
          ...time,
          startTime: parsedStart,
          endTime: parsedEnd
        }
      ]
    };

    await EventService.createEvent(updatedEvent);
    await EventService.regenerateMeetings(updatedEvent);

    router.push("/(tabs)/events");
  };

  return (
    <ClubForm
      values={values}
      setValues={setValues}
      onSubmit={handleCreateEvent}
      submitLabel="Create Event"
      timeError={timeError}
      isEvent={true}
    />
  );
}
