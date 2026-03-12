import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { EventService } from "../../services/eventService";
import { Event } from "../../types/subscription";

/* =============================
   Component
============================= */

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams();

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {

    const fetchEvent = async () => {

      const eventData = await EventService.getEvent(id as string);

      if (!eventData) return;

      setEvent(eventData);
      setLoading(false);
    };

    fetchEvent();

  }, [id]);

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

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.name}>{event.name}</Text>

      {event.description && (
        <Text style={styles.description}>{event.description}</Text>
      )}

      {event.schedule && (
        <>
          <Text style={styles.sectionTitle}>Meeting Times: </Text>
          {event.schedule.map((m, i) => (
            <Text key={i} style={styles.schedule}>
              {m.day} • {m.time}
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