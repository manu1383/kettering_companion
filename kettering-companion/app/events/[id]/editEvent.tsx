import { useLocalSearchParams, useRouter } from "expo-router";
import { deleteDoc, doc } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity
} from "react-native";
import { db } from "../../../lib/firebase";
import { EventService } from "../../../services/eventService";
import { Event } from "../../../types/subscription";


export default function EditEventScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [event, setEvent] = useState<Event | null>(null);
  const [day, setDay] = useState("");
  const [time, setTime] = useState("");

  useEffect(() => {
    const loadEvent = async () => {
      const data = await EventService.getEvent(id as string);
      if (data) {
        setEvent(data);
      }
      if (data?.schedule && data.schedule.length > 0) {
        setDay(data.schedule[0].day);
        setTime(data.schedule[0].time);
      }
    };
    loadEvent();
  }, [id]);

  const handleSave = async () => {
    const updatedEvent: Event = {
      ...event!,
      schedule:
        day.trim() && time.trim()
          ? [{ day: day.trim(), time: time.trim() }]
          : []
    };

    await EventService.updateEvent(id as string, updatedEvent);

    router.replace(`/events/${id}`);
  };

  const handleDeleteEvent = async () => {
    await deleteDoc(doc(db, "events", id as string));
    router.replace("/events");
  }

  if(!event) return null;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Edit Event</Text>

      <Text style={styles.label}>Event Name</Text>
      <TextInput
        value={event.name}
        onChangeText={(text) => setEvent({ ...event, name: text })}
        style={styles.input}
      />

      <Text style={styles.label}>Description</Text>
      <TextInput
        value={event.description}
        onChangeText={(text) => setEvent({ ...event, description: text })}
        style={styles.input}
        multiline
      />

      <Text style={styles.label}>Location</Text>
      <TextInput
        value={event.location}
        onChangeText={(text) => setEvent({ ...event, location: text })}
        style={styles.input}
      />

      <Text style={styles.label}>Contact Email (publicly visible, also sets officer permissions)</Text>
      <TextInput
        value={event.contactEmail}
        onChangeText={(text) => setEvent({ ...event, contactEmail: text })}
        style={styles.input}
      />

      <Text style={styles.label}>Event Day</Text>
      <TextInput
        value={day}
        onChangeText={setDay}
        style={styles.input}
      />

      <Text style={styles.label}>Event Time</Text>
      <TextInput
        value={time}
        onChangeText={setTime}
        style={styles.input}
      />

      <TouchableOpacity style={styles.button} onPress={handleSave}>
        <Text style={styles.buttonText}>Save Changes</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteEvent}>
          <Text style={styles.buttonText}>Delete Event</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E6F0F3",
    padding: 20
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  header: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 20
  },
  label: {
    fontWeight: "600",
    marginBottom: 5
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 15
  },
  button: {
    backgroundColor: "#4BA3C7",
    padding: 15,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 10
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16
  },
  officerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    marginBottom: 10
  },

  officerName: {
    fontWeight: "700",
    color: "#1D3D47"
  },

  officerEmail: {
    color: "#4BA3C7"
  },

  removeOfficer: {
    color: "#D64545",
    fontWeight: "600"
  },

  deleteButton: {
    backgroundColor: "#D64545",
    padding: 15,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 15
  },
});