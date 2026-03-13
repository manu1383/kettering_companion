import { useLocalSearchParams } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { AuthContext } from "../../context/AuthProvider";
import { db } from "../../lib/firebase";
import { ClubService } from "../../services/clubService";
import { UserService } from "../../services/userService";
import { Club, Officer } from "../../types/club";

/* =============================
   Component
============================= */

export default function ClubDetailScreen() {
  const { id } = useLocalSearchParams();

  const [club, setClub] = useState<Club | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [officers, setOfficers] = useState<Officer[]>([]);
  const {user, subscribedClubs} = useContext(AuthContext);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const toggleSubscription = async (clubId: string, subscribe: boolean) => {
    try {
      if (subscribe) {
        console.log(`Subscribing user ${user!.uid} to club ${clubId}`);
        await ClubService.subscribeToClub(user!.uid, clubId);
        setIsSubscribed(true);
      } else {
        await ClubService.unsubscribeFromClub(user!.uid, clubId);
        setIsSubscribed(false);
      }
    } catch (err) {
      console.error("Subscription error:", err);
      setError("Failed to update subscription. Please try again.");
    }
};
  
  useEffect(() => {

    const fetchClub = async () => {

      const clubData = await ClubService.getClub(id as string);

      if (!clubData) return;

      setClub(clubData);

      const officerData = await UserService.getOfficersFromIds(clubData.officers ?? []);
      setOfficers(officerData);

      const subDoc = await getDoc(doc(db, "users", user!.uid, "subscriptions", id as string));
      setIsSubscribed(subDoc.exists());
      
      setLoading(false);
    };
    fetchClub();

  }, [id, user]);

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

      <TouchableOpacity
          style={styles.subscribeButton}
          onPress={() => toggleSubscription(club.id!, !isSubscribed)}
      >
          <Text style={styles.subscribeButtonText}>
              {isSubscribed ? "Unsubscribe" : "Subscribe"}
          </Text>
      </TouchableOpacity>
    

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
  subscribeButton: {
    backgroundColor: "#4BA3C7",
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 16,
  },
  subscribeButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "700",
  },
});