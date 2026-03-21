import { db } from "@/lib/firebase";
import { formatFrequency, getWeekdayName, to12Hour } from "@/lib/time";
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
import { copyCalendar } from "../../lib/copyCalendar";
import { ClubService } from "../../services/clubService";
import { UserService } from "../../services/userService";
import { Club, Officer } from "../../types/subscription";
/* =============================    Component ============================= */
export default function FitnessClassDetailScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useContext(AuthContext);

  const [club, setClub] = useState<Club | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const toggleSubscription = async (id: string, subscribe: boolean) => {
    try {
      if (!user) return;

      const month =
        new Date().getFullYear() +
        "-" +
        String(new Date().getMonth() + 1).padStart(2, "0");

      if (subscribe) {
        await ClubService.subscribeToClub(user.uid, id);
        await copyCalendar(user.uid, month);
        setIsSubscribed(true);
        alert("Subscribed and meetings added to calendar!");
      } else {
        await ClubService.unsubscribeFromClub(user.uid, id);
        await copyCalendar(user.uid, month);
        setIsSubscribed(false);
        alert("Unsubscribed and meetings removed from calendar!");
      }
    } catch (err) {
      console.error("Subscription error:", err);
      setError("Failed to update subscription. Please try again.");
    }
  };

  useEffect(() => {
    const fetchClass = async () => {
      try {
        if (!id || !user) return;

        const clubData = await ClubService.getFitnessClass(id as string);
        if (!clubData) {
          setError("Class not found.");
          setLoading(false);
          return;
        }

        setClub(clubData);

        const officerData = await UserService.getOfficersFromIds(
          clubData.officers ?? []
        );
        setOfficers(officerData);

        const subDoc = await getDoc(
          doc(db, "users", user.uid, "subscriptions", id as string)
        );
        setIsSubscribed(subDoc.exists());
      } catch (err) {
        console.error(err);
        setError("Failed to load class.");
      } finally {
        setLoading(false);
      }
    };

    fetchClass();
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
        <Text style={{ color: "red" }}>
          {error ?? "Class not found."}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.name}>{club.name}</Text>

      {club.description && (
        <Text style={styles.description}>{club.description}</Text>
      )}

      {club.schedule.map((m, i) => {
        const daysArr = (m.weekdays || []).map((d) => getWeekdayName(d));

        const days =
          daysArr.length > 1
            ? `${daysArr.slice(0, -1).join(", ")} & ${daysArr.slice(-1)}`
            : daysArr[0] || "";
          

        return (
          <Text key={i} style={styles.schedule}>
            {days} • {formatFrequency(m.frequency? m.frequency : "")} •{" "}
            {to12Hour(m.startTime)} - {to12Hour(m.endTime)}
          </Text>
        );
      })}

      {club.location && (
        <>
          <Text style={styles.sectionTitle}>Location:</Text>
          <Text>{club.location}</Text>
        </>
      )}

      {officers.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Instructor:</Text>
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
  calendarButton: {
    backgroundColor: "#4BA3C7",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 20,
  },
  calendarButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  subscribeButton: {
    backgroundColor: "#4BA3C7",
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 20,
  },
  subscribeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});