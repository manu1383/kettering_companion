import { useLocalSearchParams, useRouter } from "expo-router";
import { arrayUnion, collection, doc, getDoc, getDocs, query, updateDoc, where } from "firebase/firestore";
import { useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { AuthContext } from "../../../context/AuthProvider";
import { db } from "../../../lib/firebase";

interface MeetingTime {
  day: string;
  time: string;
}

interface Club {
  name: string;
  description: string;
  location: string;
  contactEmail: string;
  schedule: MeetingTime[];
  officers?: string[];
}

export default function EditClubScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user, role } = useContext(AuthContext);

  const [club, setClub] = useState<Club | null>(null);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [day, setDay] = useState("");
  const [time, setTime] = useState("");
  const [officerEmail, setOfficerEmail] = useState("");

  useEffect(() => {
    const fetchClub = async () => {
      const snapshot = await getDoc(doc(db, "clubs", id as string));

      if (snapshot.exists()) {
        const data = snapshot.data() as Club;

        setClub(data);
        setName(data.name);
        setDescription(data.description ?? "");
        setLocation(data.location ?? "");
        setContactEmail(data.contactEmail ?? "");

        if (data.schedule?.length) {
          setDay(data.schedule[0].day);
          setTime(data.schedule[0].time);
        }
      }

      setLoading(false);
    };

    fetchClub();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4BA3C7" />
      </View>
    );
  }

  if (!club) {
    return (
      <View style={styles.centered}>
        <Text>Club not found.</Text>
      </View>
    );
  }

  const isOfficer = club.officers?.includes(user?.uid ?? "");

  if (role !== "admin" && !isOfficer) {
    return (
      <View style={styles.centered}>
        <Text>You do not have permission to edit this club.</Text>
      </View>
    );
  }

  const handleSave = async () => {
    await updateDoc(doc(db, "clubs", id as string), {
      name,
      description,
      location,
      contactEmail,
      schedule: [{ day, time }]
    });

    router.replace(`/clubs/${id}`);
  };

  const handleAddOfficer = async () => {
    try {
        const q = query(
            collection(db, "users"),
            where("email", "==", officerEmail.toLowerCase())
        );

        const snapshot = await getDocs(q);
        if (snapshot.empty) {
            alert("No user found with that email.");
            return;
        }

        const officerDoc = snapshot.docs[0];
        const officerId = officerDoc.id;

        // Add officer to club
        await updateDoc(doc(db, "clubs", id as string), {
            officers: arrayUnion(officerId)
        });

        // Update user's role
        await updateDoc(doc(db, "users", officerId), {
            role: "officer",
            clubsManaging: arrayUnion(id as string)
        });
        
        alert("Officer added successfully!");
        setOfficerEmail("");
    } catch (error) {
        console.error("Error adding officer:", error);
        alert("Failed to add officer.");
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Edit Club</Text>

      <Text style={styles.label}>Club Name</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        style={styles.input}
      />

      <Text style={styles.label}>Description</Text>
      <TextInput
        value={description}
        onChangeText={setDescription}
        style={styles.input}
        multiline
      />

      <Text style={styles.label}>Location</Text>
      <TextInput
        value={location}
        onChangeText={setLocation}
        style={styles.input}
      />

      <Text style={styles.label}>Contact Email (publicly visible, also sets officer permissions)</Text>
      <TextInput
        value={contactEmail}
        onChangeText={setContactEmail}
        style={styles.input}
      />

      <Text style={styles.label}>Add Officer by Email (sets permissions)</Text>
      <TextInput
          style = {styles.input}
          value = {officerEmail}
          onChangeText={setOfficerEmail}
          placeholder="officer@kettering.edu"
          placeholderTextColor="#888"
      />

      <Text style={styles.label}>Meeting Day</Text>
      <TextInput
        value={day}
        onChangeText={setDay}
        style={styles.input}
      />

      <Text style={styles.label}>Meeting Time</Text>
      <TextInput
        value={time}
        onChangeText={setTime}
        style={styles.input}
      />

      <TouchableOpacity style={styles.button} onPress={handleAddOfficer}>
          <Text style={styles.buttonText}>Add Officer</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={handleSave}>
        <Text style={styles.buttonText}>Save Changes</Text>
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
  }
});