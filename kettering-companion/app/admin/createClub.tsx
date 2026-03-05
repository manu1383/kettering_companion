import { useRouter } from "expo-router";
import { arrayUnion, collection, doc, getDocs, query, setDoc, updateDoc, where } from "firebase/firestore";
import React, { useState } from "react";
import {
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
  const [instagram, setInstagram] = useState("");
  const [officerEmail, setOfficerEmail] = useState("");

  const router = useRouter();

  const handleCreateClub = async () => {
    try {

      const clubId = name.toLowerCase().replace(/\s+/g, "-");

      let officerId = null;

      // Find officer by email
      if (officerEmail) {
        const q = query(
          collection(db, "users"),
          where("email", "==", officerEmail.toLowerCase())
        );

        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          officerId = snapshot.docs[0].id;
        } else {
          alert("Officer email not found.");
          return;
        }
      }

      // Create club
      await setDoc(doc(db, "clubs", clubId), {
        name,
        description,
        location,
        instagram,
        contactEmail: officerEmail,
        schedule: [{ day: meetingDay, time: meetingTime }],
        officers: officerId ? [officerId] : [],
        createdAt: new Date(),
      });

      // Promote officer
      if (officerId) {
        await updateDoc(doc(db, "users", officerId), {
          role: "officer",
          clubsManaging: arrayUnion(clubId),
        });
      }

      alert("Club created successfully!");
      router.replace("/(tabs)/clubs");

    } catch (err) {
      console.error(err);
      alert("Failed to create club.");
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Create New Club</Text>

      <TextInput
        placeholder="Club Name"
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

      <TextInput
        style={styles.input}
        value={officerEmail}
        onChangeText={setOfficerEmail}
        placeholder="Officer's Email (sets permissions)"
        placeholderTextColor="#888"
      />

      <Text style={styles.subHeader}>Meeting Time</Text>

      <TextInput
        placeholder="Day (ex: Odd Mondays)"
        placeholderTextColor="#888"
        value={meetingDay}
        onChangeText={setMeetingDay}
        style={styles.input}
      />

      <TextInput
        placeholder="Time (ex: 6:00 PM)"
        placeholderTextColor="#888"
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