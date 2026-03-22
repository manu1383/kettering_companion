import ClubForm from "@/components/ClubForm";
import { useRouter } from "expo-router";
import { useState } from "react";
import { FormErrors, validateEntity } from "../../lib/validateEntity";
import { EventService } from "../../services/eventService";
import { Event } from "../../types/subscription";

export default function CreateEventScreen() {
  const router = useRouter();
  const [errors, setErrors] = useState<FormErrors>({});

  const [values, setValues] = useState<Event>({
    id: "",
    name: "",
    description: "",
    location: "",
    contactEmail: "",
    schedule: [
      {
        weekdays: [],
        frequency: "never",
        startDate: "",
        endDate: "",
        startTime: "",
        endTime: ""
      }
    ],
    attendees: []
  });

  const handleSubmit = async () => {
    const {errors: validationErrors, parsedStart, parsedEnd} = 
      validateEntity(values, "event");

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    await handleCreateEvent(parsedStart!, parsedEnd!);
  };


  const handleCreateEvent = async (parsedStart:string, parsedEnd:string) => {
    const eventId = values.name.toLowerCase().replace(/\s+/g, "-");
    const time = values.schedule[0];
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
      onSubmit={handleSubmit}
      submitLabel="Create Event"
      errors={errors}
      isEvent={true}
    />
  );
}
