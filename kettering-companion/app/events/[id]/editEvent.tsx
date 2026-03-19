import ClubForm from "@/components/ClubForm";
import { parseTime, to12Hour } from "@/lib/time";
import { useLocalSearchParams, useRouter } from "expo-router";
import { collection, deleteDoc, doc, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  View
} from "react-native";
import { db } from "../../../lib/firebase";
import { EventService } from "../../../services/eventService";
import { Event } from "../../../types/subscription";


export default function EditEventScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [timeError, setTimeError] = useState<string | null>(null);
  const [values, setValues] = useState<Event | null>(null);

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

  const handleUpdateEvent = async () => {
    if (!values) return;
    const time = values.schedule[0];
    const parsedStart = parseTime(time.startTime);
    const parsedEnd = parseTime(time.endTime);
    if (!parsedStart || !parsedEnd) {
      setTimeError("Please enter valid start and end times.");
      return;
    }
    if(!values.id) return
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
    await EventService.updateEvent(values.id, updatedEvent);
    await EventService.regenerateMeetings(updatedEvent);

    router.push("/(tabs)/events");
  };

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

  return (
    <View style={{ flex: 1 }}>
    
      <ClubForm
        values={values}
        setValues={setValues as React.Dispatch<React.SetStateAction<Event>>}
        onSubmit={handleUpdateEvent}
        submitLabel="Update Event"
        timeError={timeError}
        onDelete={handleDeleteEvent}
        isEvent={true}
      />

    </View>
  );
}
