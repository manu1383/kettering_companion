import { useLocalSearchParams } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import React, { useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { AuthContext } from "../../context/AuthProvider";
import { db } from "../../lib/firebase";

/* =============================
   Type Definition
============================= */

interface MeetingTime {
    day: string;
    time: string;
}

interface Officer {
    name: string;
    email: string;
}

interface Club {
  id: string;
  name: string;
  description?: string;
  schedule?: MeetingTime[];
  location?: string;
  contactEmail?: string;
  instagram?: string;
  officers?: string[];
}

/* =============================
   Component
============================= */

export default function ClubDetailScreen() {
  const { id } = useLocalSearchParams();
  const { role } = useContext(AuthContext);

  const [club, setClub] = useState<Club | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [officers, setOfficers] = useState<Officer[]>([]);

  useEffect(() => {
    const fetchClub = async () => {
      try {
        if (!id) return;

        const snapshot = await getDoc(doc(db, "clubs", id as string));

        if (!snapshot.exists()) {
          setError("Club not found.");
          return;
        }

        const clubData = {
          id: snapshot.id,
          ...(snapshot.data() as Omit<Club, "id">),
        };

        setClub(clubData);

        if (clubData.officers && clubData.officers.length > 0) {
          const officerData: Officer[] = [];

          for (const uid of clubData.officers) {
            const userDoc = await getDoc(doc(db, "users", uid));

            if (userDoc.exists()) {
              officerData.push(userDoc.data() as Officer);
            }
          }

          setOfficers(officerData);
        }

      } catch (err) {
        console.error(err);
        setError("Failed to load club.");
      } finally {
        setLoading(false);
      }
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

  if (error || !club) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: "red" }}>{error ?? "Club not found."}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.name}>{club.name}</Text>

      {club.description && (
        <Text style={styles.description}>{club.description}</Text>
      )}

      {club.schedule && (
        <>
          <Text style={styles.sectionTitle}>Meeting Times: </Text>
          {club.schedule.map((m, i) => (
            <Text key={i} style={styles.schedule}>
              {m.day} • {m.time}
            </Text>
          ))}
        </>
      )}

      {club.location && (
        <>
          <Text style={styles.sectionTitle}>Location: </Text>
          <Text>{club.location}</Text>
        </>
      )}

      {club.contactEmail && (
        <>
          <Text style={styles.sectionTitle}>Contact Email: </Text>
          <Text style={styles.section}>{club.contactEmail}</Text>
        </>
      )}

      {club.instagram && (
        <>
          <Text style={styles.sectionTitle}>Instagram: </Text>
          <Text style={styles.link}>{club.instagram}</Text>
        </>
      )}

      {officers.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Officers:</Text>

          {officers.map((officer, index) => (
            <View key={index} style={styles.officerCard}>
              <Text style={styles.officerName}>{officer.name}</Text>
              <Text style={styles.officerEmail}>{officer.email}</Text>
            </View>
          ))}
        </>
      )}
    

    </ScrollView>
  );
}

/* =============================
   Styles
============================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E6F0F3",
    padding: 20,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E6F0F3",
  },
  name: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1D3D47",
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: "#444",
    marginBottom: 20,
    lineHeight: 22,
  },
  meeting: {
    fontSize: 15,
    fontWeight: "600",
    color: "#4BA3C7",
    marginBottom: 20,
  },
  section: {
    fontSize: 15,
    color: "#555",
    marginBottom: 10,
  },
  link: {
    fontSize: 15,
    color: "#4BA3C7",
    fontWeight: "600",
  },
  sectionTitle: {
    fontWeight: "700",
    marginTop: 15,
  },
  schedule: {
      color: "#4BA3C7",
      fontWeight: "600",
      marginBottom: 4,
  },
  officerCard: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
  },

  officerName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1D3D47",
  },

  officerEmail: {
    fontSize: 14,
    color: "#4BA3C7",
  },
});