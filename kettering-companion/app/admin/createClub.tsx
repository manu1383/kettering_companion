import { useRouter } from "expo-router";
import { doc, setDoc } from "firebase/firestore";
import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity
} from "react-native";
import { db } from "../../lib/firebase";

export default function CreateClubScreen() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [meetingDay, setMeetingDay] = useState("");
  const [meetingTime, setMeetingTime] = useState("");
  const [location, setLocation] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  const router = useRouter();

  const handleCreateClub = async () => {
    if (!name) {
      Alert.alert("Club name is required.");
      return;
    }

    try {
      // Create slug-style ID
      const clubId = name.toLowerCase().replace(/\s+/g, "-");

      await setDoc(doc(db, "clubs", clubId), {
        name,
        description,
        schedule: [{ day: meetingDay, time: meetingTime }],
        location,
        contactEmail,
        officers: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      Alert.alert("Club created successfully!");
      router.replace("/(tabs)/clubs");

    } catch (error: any) {
      console.error(error);
      Alert.alert("Error creating club.");
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Create New Club</Text>

      <TextInput
        placeholder="Club Name"
        value={name}
        onChangeText={setName}
        style={styles.input}
      />

      <TextInput
        placeholder="Description"
        value={description}
        onChangeText={setDescription}
        style={styles.input}
        multiline
      />

      <TextInput
        placeholder="Location"
        value={location}
        onChangeText={setLocation}
        style={styles.input}
      />

      <TextInput
        placeholder="Contact Email"
        value={contactEmail}
        onChangeText={setContactEmail}
        style={styles.input}
      />

      <Text style={styles.subHeader}>Meeting Time</Text>

      <TextInput
        placeholder="Day (ex: Odd Mondays)"
        value={meetingDay}
        onChangeText={setMeetingDay}
        style={styles.input}
      />

      <TextInput
        placeholder="Time (ex: 6:00 PM)"
        value={meetingTime}
        onChangeText={setMeetingTime}
        style={styles.input}
      />

      <TouchableOpacity style={styles.button} onPress={handleCreateClub}>
        <Text style={styles.buttonText}>Create Club</Text>
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