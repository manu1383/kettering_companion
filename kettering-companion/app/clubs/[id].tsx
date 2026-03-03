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

interface Club {
  id: string;
  name: string;
  description?: string;
  meetingDay?: string;
  meetingTime?: string;
  location?: string;
  contactEmail?: string;
  instagram?: string;
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

  useEffect(() => {
    const fetchClub = async () => {
      try {
        if (!id) return;

        const snapshot = await getDoc(doc(db, "clubs", id as string));

        if (!snapshot.exists()) {
          setError("Club not found.");
          return;
        }

        setClub({
          id: snapshot.id,
          ...(snapshot.data() as Omit<Club, "id">),
        });
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

      {(club.meetingDay || club.meetingTime || club.location) && (
        <Text style={styles.meeting}>
          {[club.meetingDay, club.meetingTime, club.location]
            .filter(Boolean)
            .join(" • ")}
        </Text>
      )}

      {club.contactEmail && (
        <Text style={styles.section}>{club.contactEmail}</Text>
      )}

      {club.instagram && (
        <Text style={styles.link}>{club.instagram}</Text>
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
});