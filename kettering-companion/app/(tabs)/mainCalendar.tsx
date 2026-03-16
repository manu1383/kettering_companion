import { AuthContext } from "@/context/AuthProvider";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { copyCalendar } from "@/lib/copyCalendar";
import React, { useContext, useEffect, useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from "react-native";

const HOUR_HEIGHT = 60;
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export default function DaySchedule() {
  const [events, setEvents] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [infoVisible, setInfoVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useContext(AuthContext);

  const colorScheme = useColorScheme();
  const isLight = colorScheme === "light";
  const isDark = colorScheme === "dark";
  const textColor = isDark ? "#fff" : "#000";
  const secondaryText =  isDark ? "#ccc" : "#555";
  const backgroundColor = isDark ? "#000033" : "#f0f0f0";

  const normalizeGoogleEvent = (event: any) => {
    let startDate: Date;
    let endDate: Date;
    let isAllDay = false;

    // Google event
    if (event.start?.dateTime && event.end?.dateTime) {
      startDate = new Date(event.start.dateTime);
      endDate = new Date(event.end.dateTime);
    }

    // Google all-day event
    else if (event.start?.date && event.end?.date) {
      startDate = new Date(event.start.date);
      endDate = new Date(event.end.date);
      isAllDay = true;
    }

    // Club meeting event
    else if (event.date && event.startTime && event.endTime) {
      startDate = new Date(`${event.date}T${event.startTime}`);
      endDate = new Date(`${event.date}T${event.endTime}`);
    }

    else {
      return null;
    }

    return {
      id: event.id || `${event.clubId}-${event.date}`,
      title: event.summary || `${event.clubName} Meeting`,
      startDate,
      endDate,
      allDay: isAllDay,
    };
  };

  async function handleImport() {
    try {
      if (!user) return;

      setLoading(true);

      const month =
        selectedDate.getFullYear() + "-" +
        String(selectedDate.getMonth() + 1).padStart(2, "0");

      console.log("Fetching calendar for:", user.uid, month);

      const response = await copyCalendar(user.uid, month);

      console.log("Fetched events:", response);

      const googleEvents = Array.isArray(response)
        ? response
        : response.events || [];
      
      const parsedEvents = googleEvents
        .map(normalizeGoogleEvent)
        .filter(Boolean);

      setEvents(parsedEvents);

    } catch (error) {
      console.error("Calendar import failed:", error);
      setInfoVisible(true);
    } finally {
      setLoading(false);
    }
  };

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
  };

  const goToNextDay = () => {
    const nextDate = new Date(selectedDate);
    nextDate.setDate(nextDate.getDate() + 1);
    setSelectedDate(nextDate);
  };

  const eventsForDay = events.filter(event => {
    const start = new Date(event.startDate);
    const end = new Date(event.endDate);

    const dayStart = new Date(selectedDate);
    dayStart.setHours(0,0,0,0);

    const dayEnd = new Date(selectedDate);
    dayEnd.setHours(23,59,59,999);

    return start <= dayEnd && end >= dayStart;
  });

  function assignEventTiers(events: any[]) {
    const sorted = [...events].sort(
      (a, b) =>
        new Date(a.startDate).getTime() -
        new Date(b.startDate).getTime()
    );
    const tiers: any[][] = [];
    sorted.forEach(event => {
      let placed = false;
      for (let i = 0; i < tiers.length; i++) {
        const tier = tiers[i];
        const conflict = tier.some(existing => {
          const startA = new Date(event.startDate).getTime();
          const endA = new Date(event.endDate).getTime();
          const startB = new Date(existing.startDate).getTime();
          const endB = new Date(existing.endDate).getTime();
          return startA < endB && endA > startB;
        });

        if (!conflict) {
          tier.push(event);
          event.tier = i;
          placed = true;
          break;
        }
      }

      if (!placed) {
        event.tier = tiers.length;
        tiers.push([event]);
      }
    });
    return sorted;
  }

  const allDayEvents = eventsForDay.filter(e => e.allDay);
  const timedEvents = assignEventTiers(eventsForDay.filter(e => !e.allDay));

  const today = new Date();
  const isToday =
    selectedDate.getDate() === today.getDate() &&
    selectedDate.getMonth() === today.getMonth() &&
    selectedDate.getFullYear() === today.getFullYear();

  useEffect(() => {
    if (!user) return;
    handleImport();
  }, [selectedDate, user]);

    return (
         <View style={[styles.container, { backgroundColor }]}>
            <View style={styles.headerRow}>
              <TouchableOpacity onPress={goToPreviousDay}>
                <Text style={[styles.arrow, { color: textColor }]}>◀</Text>
              </TouchableOpacity>

              <Text style={[styles.dateHeader, { color: textColor }]}>
                {formattedDate}
              </Text>

              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <TouchableOpacity onPress={goToNextDay}>
                  <Text style={[styles.arrow, { color: textColor }]}>▶</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            {/*No Events Overlay*/}
            {events.length === 0 && (
                <View style={styles.noEventsOverlay}>
                    <Text style={styles.noEvents}>No events scheduled for today.</Text>
                </View>
            )}   

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Background Grid as Hour Sections */}
                {HOURS.map((hour) => (
                    <View key={hour} style={[styles.hourRow, { height: HOUR_HEIGHT }]}>
                        <Text style={[styles.hourLabel, { color: secondaryText }]}>
                            {hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : hour === 0 ? '12 AM' : `${hour} AM`}
                        </Text>
                        <View style={styles.line} />
                    </View>
                ))}

        {timedEvents.map(event => {
          const top = getTimePosition(event.startDate);
          const start = new Date(event.startDate);
          const end = new Date(event.endDate);
          const indent = event.overlapIndex * 20;

          const duration =
            (end.getTime() - start.getTime()) /
            (1000 * 60 * 60);

          const height = duration * HOUR_HEIGHT;

          return (
            <View
              key={event.id}
              style={[
                styles.eventBox,
                {
                  top, // Stack with slight offset
                  height: Math.max(height, 20),
                  left: 70, // Shift right for overlaps
                  right: 10
                },
              ]}
            >
              <Text style={styles.eventTitle} numberOfLines={1}>
                {event.title}
              </Text>
            </View>
          );
        })}

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
            <TouchableWithoutFeedback>
              <View style={[
                styles.modalContent,
                isLight && { backgroundColor: "#ffffff" }
              ]}>
                <Text style={[styles.modalTitle, { color: textColor }]}>
                  About This Calendar
                </Text>

                <Text style={[styles.modalText, { color: textColor }]}>
                  Share your Google Calendar with
                  537697026527-compute@developer.gserviceaccount.com
                  to allow event syncing.
                </Text>

                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setInfoVisible(false)}
                >
                  <Text style={styles.closeButtonText}>
                    Close
                  </Text>
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
  container: { flex: 1, paddingTop: 50 },
  scrollContent: { paddingBottom: 20 },
  hourRow: { flexDirection: "row", alignItems: "flex-start" },
  hourLabel: { width: 60, fontSize: 10, textAlign: "right", paddingRight: 10 },
  line: { flex: 1, height: 1, backgroundColor: "#eee" },
  eventBox: {
    position: "absolute",
    left: 70,
    right: 10,
    backgroundColor: "rgba(0,122,255,0.2)",
    borderLeftWidth: 4,
    borderLeftColor: "#007AFF",
    padding: 5,
    borderRadius: 4,
  },
  eventTitle: { fontSize: 12, fontWeight: "600", color: "#007AFF" },
  timeIndicator: {
    position: "absolute",
    left: 60,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
  },
  indicatorLine: { flex: 1, height: 2, backgroundColor: "red" },
  indicatorCircle: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "red",
    marginLeft: -4,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  arrow: { fontSize: 22, fontWeight: "bold" },
  dateHeader: { fontSize: 20, fontWeight: "bold" },
  infoButton: { fontSize: 20, marginHorizontal: 10 },
  allDayContainer: { marginLeft: 70, marginBottom: 10 },
  allDayEvent: {
    backgroundColor: "rgba(0,122,255,0.15)",
    borderLeftWidth: 4,
    borderLeftColor: "#007AFF",
    padding: 6,
    borderRadius: 4,
    marginBottom: 5
  },
  allDayText: { fontSize: 12, fontWeight: "600", color: "#007AFF" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: { width: "80%", padding: 20, borderRadius: 12 },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  modalText: { fontSize: 14, marginBottom: 20 },
  closeButton: {
    backgroundColor: "#007AFF",
    padding: 10,
    borderRadius: 8,
    alignItems: "center"
  },
  closeButtonText: { color: "white", fontWeight: "bold" },
    noEventsOverlay: {
        position: 'absolute',
        top: 120,
        left: 0,
        right: 0,
        textAlign: 'center',
        zIndex: 50,
    },
    noEvents: {
        fontSize: 16,
        fontWeight: '600',
        color: '#888',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 8,
    }
});
