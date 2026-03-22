import ClubForm from "@/components/ClubForm";
import { to12Hour } from "@/lib/time";
import { FormErrors, validateEntity } from "@/lib/validateEntity";
import { useLocalSearchParams, useRouter } from "expo-router";
import { collection, deleteDoc, doc, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { db } from "../../../lib/firebase";
import { EventService } from "../../../services/eventService";
import { Event } from "../../../types/subscription";


export default function EditEventScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  // State for form errors and values
  const [errors, setErrors] = useState<FormErrors>({});
  const [values, setValues] = useState<Event | null>(null);
  // Load event data on component mount
  useEffect(() => {
    const loadEvent = async () => {
      const event = await EventService.getEvent(id as string);
      if (event && event.schedule?.length) {
        const time = event.schedule?.[0];
        setValues({
          ...event,
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
    loadEvent();
  }, [id]);
  // Handle event update
  const handleUpdateEvent = async () => {
    if (!values) return;
    const {errors: validationErrors, parsedStart, parsedEnd} = 
      validateEntity(values, "event");
    
    const time = values.schedule[0];
    // Validate form values
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    if (!parsedStart || !parsedEnd) { return; }

    setErrors({});
    // Create updated event object
    const updatedEvent = {
      ...values,
      schedule: [
        {
          ...time,
          startTime: parsedStart,
          endTime: parsedEnd
        }
      ]
    };
    // Update event and regenerate meetings
    await EventService.updateEvent(values.id, updatedEvent);
    await EventService.regenerateMeetings(updatedEvent);

    router.push("/(tabs)/events");
  };
  // Handle event deletion
  const handleDeleteEvent = async () => {
    const eventId = id as string;

    // delete event
    await deleteDoc(doc(db, "events", eventId));

    // delete generated meetings
    const snapshot = await getDocs(collection(db, "meetings"));

    for (const meeting of snapshot.docs) {
      if (meeting.data().id === eventId) {
        await deleteDoc(meeting.ref);
      }
    }

    router.replace("/(tabs)/events");
  };

  if(!values) return null;
  // Load event data on component mount
  return (
    <View style={{ flex: 1 }}>
      <ClubForm
        values={values}
        setValues={setValues as React.Dispatch<React.SetStateAction<Event>>}
        onSubmit={handleUpdateEvent}
        submitLabel="Update Event"
        errors={errors}
        onDelete={handleDeleteEvent}
        isEvent={true}
      />
    </View>
  );
}
