import { useColorScheme } from "@/hooks/use-color-scheme";
import { copyCalendar } from "@/lib/copyCalendar";
import * as AuthSession from "expo-auth-session";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import React, { useEffect, useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from "react-native";

WebBrowser.maybeCompleteAuthSession();

const HOUR_HEIGHT = 60;
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export default function DaySchedule() {
  const [events, setEvents] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [infoVisible, setInfoVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const colorScheme = useColorScheme();
  const isLight = colorScheme === "light";

  const redirectUri = AuthSession.makeRedirectUri({
    scheme: "ketteringcompanion",
    path: "redirect",
  });

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: "537697026527-1escunuj1p6aoillsqhtpfa8qackvc9i.apps.googleusercontent.com",
    iosClientId: "537697026527-14mvdca5rnjnnu39ieguf3rgkkr426qd.apps.googleusercontent.com",
    scopes: [
      "https://www.googleapis.com/auth/calendar.readonly"
    ],
  });

  console.log('REDIRECT URI:', redirectUri);

  useEffect(() => {
    if (response?.type === "success") {
      const token = response.authentication?.accessToken;
      console.log("GOOGLE TOKEN:", token);
      if (token) {
        setAccessToken(token);
      }
    }
  }, [response]);

  const normalizeGoogleEvent = (event: any) => {
    let startDate: Date;
    let endDate: Date;
    let isAllDay = false;

    if (event.start?.dateTime && event.end?.dateTime) {
      startDate = new Date(event.start.dateTime);
      endDate = new Date(event.end.dateTime);
    } else if (event.start?.date && event.end?.date) {
      startDate = new Date(event.start.date);
      endDate = new Date(event.end.date);
      isAllDay = true;
    } else {
      return null;
    }

    return {
      id: event.id,
      title: event.summary || "Untitled Event",
      startDate,
      endDate,
      allDay: isAllDay,
    };
  };

  async function handleImport() {
    try {
      if (!accessToken) {
        if (!request) return;
        await promptAsync();
        return;
      }
      
      setLoading(true);
      const formattedDate = 
        selectedDate.getFullYear() + "-" +
        String(selectedDate.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(selectedDate.getDate()).padStart(2, "0");
      const googleEvents = await copyCalendar(formattedDate, accessToken);

      console.log("RAW GOOGLE EVENTS:", googleEvents);

      const parsedEvents = googleEvents
        .map(normalizeGoogleEvent)
        .filter(Boolean);

      setEvents(parsedEvents);
      setLoading(false);

    } catch (error) {
      console.error("Import failed:", error);
      setErrorMessage("Failed to load calendar events. Please try again.");
      setLoading(false);
      setInfoVisible(true);
    }
  }

  // ------------------------
  // INITIAL LOAD
  // ------------------------
  useEffect(() => {
    handleImport();
  }, [selectedDate, accessToken]);

  // ------------------------
  // POSITION HELPER
  // ------------------------
  const getTimePosition = (dateString: string | Date) => {
    const date = new Date(dateString);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    return hours * HOUR_HEIGHT + (minutes / 60) * HOUR_HEIGHT;
  };

  const formattedDate = selectedDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const goToPreviousDay = () => {
    const prevDate = new Date(selectedDate);
    prevDate.setDate(prevDate.getDate() - 1);
    setSelectedDate(prevDate);
  }

  const goToNextDay = () => {
    const nextDate = new Date(selectedDate);
    nextDate.setDate(nextDate.getDate() + 1);
    setSelectedDate(nextDate);
  }

  const allDayEvents = events.filter(e => e.allDay);
  const timedEvents = events.filter(e => !e.allDay);
  const today = new Date();

  const isToday =
    selectedDate.getDate() === today.getDate() &&
    selectedDate.getMonth() === today.getMonth() &&
    selectedDate.getFullYear() === today.getFullYear();

  return (
    <View style={[styles.container, { backgroundColor: "#ffffff" }]}>
      
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={goToPreviousDay}>
          <Text style={styles.arrow}>◀</Text>
        </TouchableOpacity>
        <Text style={styles.dateHeader}>
          {formattedDate}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity onPress={handleImport}>
            <Text style={styles.infoButton}>🔄</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={goToNextDay}>
            <Text style={styles.arrow}>▶</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading && (
        <Text style={{textAlign: "center", marginBottom: 10}}>
          Loading events...
        </Text>
      )}

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingBottom: 50,
          minHeight: HOUR_HEIGHT * 24,
        }}
      >
        {/* All-day Events */}
        {allDayEvents.length > 0 && (
          <View style={styles.allDayContainer}>
            {allDayEvents.map(event => (
              <View key={event.id} style={styles.allDayEvent}>
                <Text style={styles.allDayText}>{event.title}</Text>
              </View>
            ))}
          </View>
        )}
        {/* Hour Grid */}
        {HOURS.map((hour) => (
          <View key={hour} style={[styles.hourRow, { height: HOUR_HEIGHT }]}>
            <Text style={styles.hourLabel}>
              {hour === 12
                ? "12 PM"
                : hour > 12
                ? `${hour - 12} PM`
                : hour === 0
                ? "12 AM"
                : `${hour} AM`}
            </Text>
            <View style={styles.line} />
          </View>
        ))}

        {/* Events */}
        {timedEvents.map((event) => {
          const top = getTimePosition(event.startDate);
          const start = new Date(event.startDate);
          const end = new Date(event.endDate);
          const durationInHrs = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
          const height = durationInHrs * HOUR_HEIGHT;

          return (
            <View
              key={event.id}
              style={[styles.eventBox, { top, height: Math.max(height, 20) }]}
            >
              <Text style={styles.eventTitle} numberOfLines={1}>
                {event.title}
              </Text>
            </View>
          );
        })}

        {/* Current Time Indicator */}
        {isToday && (
          <View
            style={[
              styles.timeIndicator,
              { top: getTimePosition(new Date()) },
            ]}
          >
            <View style={styles.indicatorCircle} />
            <View style={styles.indicatorLine} />
          </View>
        )}
      </ScrollView>
      <Modal
        visible={infoVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setInfoVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setInfoVisible(false)}>
          <View style={styles.modalOverlay}>
            
            {/* Prevent tap inside modal from closing */}
            <TouchableWithoutFeedback>
              <View style={[styles.modalContent, isLight && { backgroundColor: "#ffffff" }]}>
                <Text style={styles.modalTitle}>About This Calendar</Text>

                <Text style={styles.modalText}>
                  In order to import your Google Calendar, you need to share your calendar with this email address:
                  "calendar-sync@kettering-connect.iam.gserviceaccount.com"
                  and set permissions to "Make changes to events". This allows the app to read your calendar events and display them here. Your data is not stored or shared with anyone else. You can revoke access at any time from your Google Calendar settings.
                </Text>

                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setInfoVisible(false)}
                >
                  <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>

          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#E6F0FF", paddingTop: 50 },
  header: {
    fontSize: 20,
    textAlign: "center",
    marginBottom: 10,
    fontWeight: "bold",
  },
  scrollContent: { paddingBottom: 50 },
  hourRow: { flexDirection: "row", alignItems: "flex-start" },
  hourLabel: {
    width: 60,
    fontSize: 10,
    color: "#aaa",
    textAlign: "right",
    paddingRight: 10,
    marginTop: -8,
  },
  line: { flex: 1, height: 1, backgroundColor: "#f0f0f0" },
  eventBox: {
    position: "absolute",
    left: 70,
    right: 10,
    backgroundColor: "rgba(0, 122, 255, 0.2)",
    borderLeftWidth: 4,
    borderLeftColor: "#007AFF",
    padding: 5,
    borderRadius: 4,
    zIndex: 5,
    pointerEvents: "none",
  },
  eventTitle: { fontSize: 12, fontWeight: "600", color: "#007AFF" },
  timeIndicator: {
    position: "absolute",
    left: 60,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    zIndex: 10,
    pointerEvents: "none",
  },
  indicatorLine: { flex: 1, height: 2, backgroundColor: "red" },
  indicatorCircle: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "red",
    marginLeft: -4,
  },
  clearButton: {
    flex: 1,
    backgroundColor: "#D9534F",
    marginBottom: 10,
    borderRadius: 8,
    alignItems: "center",
    paddingVertical: 12,
    justifyContent: "center",
    height: 40
  },
  clearButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 40,
    marginBottom: 10,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    marginTop: 10,
    paddingHorizontal: 20,
  },
  arrow: {
    fontSize: 22,
    fontWeight: "bold"
  },
  allDayContainer: {
    marginLeft: 70,
    marginBottom: 10,
  },
  allDayEvent: {
    backgroundColor: "rgba(0, 122, 255, 0.15)",
    borderLeftWidth: 4,
    borderLeftColor: "#007AFF",
    padding: 6,
    borderRadius: 4,
    marginBottom: 5
  },
  allDayText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#007AFF"
  },
  infoButton: {
    fontSize: 20,
    marginHorizontal: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "white",
    padding: 20,
    borderRadius: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  modalText: {
    fontSize: 14,
    marginBottom: 20,
  },
  closeButton: {
    backgroundColor: "#007AFF",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  closeButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  dateHeader: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000000"
  }
});
