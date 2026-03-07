import { useLocalSearchParams, useRouter } from "expo-router";
import { deleteDoc, doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { db } from "../../../lib/firebase";
import { addOfficer, findUserByEmail, getClub, removeOfficer, updateClub } from "../../services/clubService";
import { Club, Officer } from "../../types/club";


export default function EditClubScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [club, setClub] = useState<Club | null>(null);
  const [officerEmail, setOfficerEmail] = useState("");
  const [day, setDay] = useState("");
  const [time, setTime] = useState("");
  const [officers, setOfficers] = useState<Officer[]>([]);

  useEffect(() => {
    const loadClub = async () => {
      const data = await getClub(id as string);
      if (data) {
        setClub(data);
      }
      if (data?.schedule && data.schedule.length > 0) {
        setDay(data.schedule[0].day);
        setTime(data.schedule[0].time);
      }
      const officerData: Officer[] = [];

      for (const uid of data?.officers ?? []) {

        const userDoc = await getDoc(doc(db,"users",uid));

        if(userDoc.exists()){
          officerData.push({
            uid,
            ...(userDoc.data() as Omit<Officer,"uid">)
          });
        }

      }

      setOfficers(officerData);
    };
    loadClub();
  }, [id]);

  const handleSave = async () => {
    await updateClub(id as string, club!);
    router.replace(`/clubs/${id}`);
  };

  const handleAddOfficer = async () => {

    const userDoc = await findUserByEmail(officerEmail);

    if(!userDoc){
      alert("User not found");
      return;
    }

    const uid = userDoc.id;
    const data = userDoc.data();

    await addOfficer(id as string, uid);

    const newOfficer: Officer = {
      uid,
      ...(data as Omit<Officer,"uid">)
    };

    setOfficers((prev)=>[...prev,newOfficer]);

    setOfficerEmail("");

    alert("Officer added successfully!");
  };
  
  const handleRemoveOfficer = async (uid: string) => {
    await removeOfficer(id as string, uid);
    setOfficers((prev)=>prev.filter(officer=>officer.uid !== uid));
  };

  const handleDeleteClub = async () => {
    await deleteDoc(doc(db, "clubs", id as string));
    router.replace("/clubs");
  }

  if(!club) return null;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Edit Club</Text>

      <Text style={styles.label}>Club Name</Text>
      <TextInput
        value={club.name}
        onChangeText={(text) => setClub({ ...club, name: text })}
        style={styles.input}
      />

      <Text style={styles.label}>Description</Text>
      <TextInput
        value={club.description}
        onChangeText={(text) => setClub({ ...club, description: text })}
        style={styles.input}
        multiline
      />

      <Text style={styles.label}>Location</Text>
      <TextInput
        value={club.location}
        onChangeText={(text) => setClub({ ...club, location: text })}
        style={styles.input}
      />

      <Text style={styles.label}>Contact Email (publicly visible, also sets officer permissions)</Text>
      <TextInput
        value={club.contactEmail}
        onChangeText={(text) => setClub({ ...club, contactEmail: text })}
        style={styles.input}
      />

      <Text style={styles.label}>Current Officers</Text>

      {officers.map((officer)=>(
        <View key={officer.uid} style={styles.officerRow}>

          <View>
            <Text style={styles.officerName}>{officer.name}</Text>
            <Text style={styles.officerEmail}>{officer.email}</Text>
          </View>

          <TouchableOpacity
            onPress={()=>handleRemoveOfficer(officer.uid)}
          >
            <Text style={styles.removeOfficer}>Remove</Text>
          </TouchableOpacity>

        </View>
      ))}

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

      <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteClub}>
          <Text style={styles.buttonText}>Delete Club</Text>
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