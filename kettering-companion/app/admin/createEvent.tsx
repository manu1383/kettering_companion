import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity
} from "react-native";
import { EventService } from "../../services/eventService";

export default function CreateEventScreen() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [officerEmail, setOfficerEmail] = useState("");

  const router = useRouter();

  const handleCreateEvent = async () => {
    console.log ("Event date: ", date);
    console.log ("Event time: ", time);
    const eventId = name.toLowerCase().replace(/\s+/g, "-");
    await EventService.createEvent({
      id: eventId,
      name,
      description,
      location,
      contactEmail,
      schedule: date && time ? [{ day: date, time: time }] : [],
      attendees: []
    });
    router.push(`/(tabs)/events`);
    // Note: We don't set attendees here since the creator may not necessarily be an attendee, and we don't want to assume that.
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Create New Event</Text>

      <TextInput
        placeholder="Event Name"
        placeholderTextColor="#888"
        value={name}
        onChangeText={setName}
        style={styles.input}
      />

      <TextInput
        placeholder="Description"
        placeholderTextColor="#888"
        value={description}
        onChangeText={setDescription}
        style={styles.input}
        multiline
      />

      <TextInput
        placeholder="Location"
        placeholderTextColor="#888"
        value={location}
        onChangeText={setLocation}
        style={styles.input}
      />

      <TextInput
        placeholder="Contact Email (publicly visible, also sets officer permissions)"
        placeholderTextColor="#888"
        value={contactEmail}
        onChangeText={setContactEmail}
        style={styles.input}
      />

      <Text style={styles.subHeader}>Event Time</Text>

      <TextInput
        placeholder="Date (ex: 10/15/2023)"
        placeholderTextColor="#888"
        value={date}
        onChangeText={setDate}
        style={styles.input}
      />

      <TextInput
        placeholder="Time (ex: 6:00 PM)"
        placeholderTextColor="#888"
        value={time}
        onChangeText={setTime}
        style={styles.input}
      />

      <TouchableOpacity style={styles.button} onPress={handleCreateEvent}>
        <Text style={styles.buttonText}>Create Event</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E6F0F3",
    padding: 20,
  },
  header: {
    fontSize: 26,
    fontWeight: "700",
    color: "#1D3D47",
    marginBottom: 20,
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#4BA3C7",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  subHeader: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
  }
});