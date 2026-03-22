import { AuthContext } from "@/context/AuthProvider";
import { copyCalendar } from "@/lib/copyCalendar";
import { formatDate, to12Hour } from "@/lib/time";
import { useLocalSearchParams } from "expo-router";
import { deleteDoc, doc, getDoc, setDoc } from "firebase/firestore";
import { useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { db } from "../../lib/firebase";
import { EventService } from "../../services/eventService";
import { Event } from "../../types/subscription";

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useContext(AuthContext);
  // State variables
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscribed, setSubscribed] = useState(false);
  // Fetch event details on component mount
  useEffect(() => {
    const fetchEvent = async () => {
      const eventData = await EventService.getEvent(id as string);
      if (!eventData) return;
      setEvent(eventData);
      setLoading(false);
    };
    fetchEvent();

  }, [id]);
  // Check subscription status on component mount
  useEffect(() => {
    const checkSubscription = async () => {
      if (!user || !event) return;
      if(!event?.id){
        console.error("Event ID is undefined");
        return;
      }
      const subRef = doc(db, "users", user.uid, "subscriptions", event.id);
      const subDoc = await getDoc(subRef);
      setSubscribed(subDoc.exists());
    };
    checkSubscription();
  }, [user, event]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4BA3C7" />
      </View>
    );
  }

  if (error || !event) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: "red" }}>{error ?? "Event not found."}</Text>
      </View>
    );
  }
  // Handle event subscription
  const handleSubscribe = async () => {
    if (!event || !user) return;

    if(!event?.id){
      console.error("Event ID is undefined");
      return;
    }
    // Add subscription document for the user
    const subRef = doc(db, "users", user.uid, "subscriptions", event.id);

    await setDoc(subRef, {
      id: event.id,
      name: event.name,
      subscribedAt: new Date()
    });

    setSubscribed(true);
    const month = 
      new Date().getFullYear() +
      "-" +
      String(new Date().getMonth() + 1).padStart(2, "0");
    // Copy calendar to update with new subscription
    await copyCalendar(user.uid, month);
    alert("Meeting added to calendar!");
  };
  // Handle event unsubscription
  const handleUnsubscribe = async () => {
    if (!event || !user) return;
    if(!event?.id){
      console.error("Event ID is undefined");
      return;
    }
    const uid = user.uid;
    const eventId = event.id;

    const subRef = doc(db, "users", uid, "subscriptions", eventId);
    // Remove subscription document for the user
    await deleteDoc(subRef);

    const month = 
      new Date().getFullYear() +
      "-" +
      String(new Date().getMonth() + 1).padStart(2, "0");
    // Copy calendar to update with removed subscription
    await copyCalendar(uid, month);
    
    alert("Meeting removed from calendar!");
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.name}>{event.name}</Text>

      {event.description && (
        <Text style={styles.description}>{event.description}</Text>
      )}

      {event.schedule && (
        <>
          <Text style={styles.sectionTitle}>Event Time: </Text>
          {event.schedule.map((m, i) => (
            <Text key={i} style={styles.schedule}>
              {formatDate(m.startDate)} • {to12Hour(m.startTime)} - {to12Hour(m.endTime)}
            </Text>
          ))}
        </>
      )}

      {event.location && (
        <>
          <Text style={styles.sectionTitle}>Location: </Text>
          <Text>{event.location}</Text>
        </>
      )}

      {event.contactEmail && (
        <>
          <Text style={styles.sectionTitle}>Contact Email: </Text>
          <Text style={styles.section}>{event.contactEmail}</Text>
        </>
      )}

      <TouchableOpacity
        style={[
          styles.calendarButton,
          subscribed && { backgroundColor: "#999" }
        ]}
        onPress={subscribed ? handleUnsubscribe : handleSubscribe}
      >
        <Text style={styles.calendarButtonText}>
          {subscribed ? "Remove from Calendar" : "Add Meeting to Calendar"}
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
  sectionTitle: {
    fontWeight: "700",
    marginTop: 15,
  },
  schedule: {
    color: "#4BA3C7",
    fontWeight: "600",
    marginBottom: 4,
  },
  calendarButton: {
    backgroundColor: "#4BA3C7",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 30,
  },
  calendarButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  }
});