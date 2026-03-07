import { useColorScheme } from "@/hooks/use-color-scheme";
import { copyCalendar } from "@/lib/copyCalendar";
import { useRouter } from "expo-router";
import * as AuthSession from "expo-auth-session";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { MiniMap } from "./maps/MiniMap";
import React, { useEffect, useState, useMemo } from "react";
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

const router = useRouter();
const HOUR_HEIGHT = 60;
const HOURS = Array.from({ length: 24 }, (_, i) => i);
type CalendarEvent = {
    id: string;
    title: string;
    startDate: Date;
    endDate: Date;
    allDay: boolean;
    type: "School" | "Fitness" | "Club" | "SchoolEvent";
    room?: string;
};
export default function DaySchedule() {
  const [events, setEvents] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [infoVisible, setInfoVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
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

   const normalizeGoogleEvent = (event: any): CalendarEvent | null => {
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

        const title = event.summary || "Untitled Event";
        const room = event.location || undefined;
        const lower = title.toLowerCase();

        let type: CalendarEvent["type"] = "School";

    if (lower.includes("gym"))
        type = "Fitness";
    else if (lower.includes("club"))
        type = "Club";
    else if (lower.includes("event"))
        type = "SchoolEvent";

        return {
            id: event.id,
            title,
            startDate,
            endDate,
            allDay: isAllDay,
            type,
            room,
        };
    };

  async function handleImport() {
    try 
    {
        if (!accessToken) {
            if (!request) return;
            await promptAsync();
            return;
        }

        setLoading(true);

        const formattedDate =
            selectedDate.getFullYear() + "-" +
            String(selectedDate.getMonth() + 1).padStart(2, "0") + "-" +
            String(selectedDate.getDate()).padStart(2, "0");

        const googleEvents = await copyCalendar(formattedDate, accessToken);

        const parsedEvents = googleEvents
            .map(normalizeGoogleEvent)
            .filter(Boolean) as CalendarEvent[];

        setEvents(parsedEvents);
        setErrorMessage(null);

    } 
    catch (error: any) 
    {
        console.error("Import failed:", error);
        setErrorMessage(error?.message || "Failed to load calendar events.");
    } 
    finally 
    {
        setLoading(false);
    }
  }


  // 
  // Initial load
  // 
  useEffect(() => {
    handleImport();
  }, [selectedDate, accessToken]);

  // 
  // Position helper
  // 
  const getTimePosition = (dateString: string | Date) => {
    const date = new Date(dateString);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    return hours * HOUR_HEIGHT + (minutes / 60) * HOUR_HEIGHT;
  };

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

  const processedEvents = useMemo(() => {
      if (!timedEvents.length) return [];

      const sorted = [...timedEvents].sort(
          (a, b) => a.startDate.getTime() - b.startDate.getTime()
      );

      const clusters: CalendarEvent[][] = [];
      let current: CalendarEvent[] = [];
      let lastEnd = 0;

      sorted.forEach((event) => {
          const start = event.startDate.getTime();
          const end = event.endDate.getTime();

          if (!current.length) {
              current.push(event);
              lastEnd = end;
              return;
          }

          if (start < lastEnd) {
              current.push(event);
              lastEnd = Math.max(lastEnd, end);
          } else {
              clusters.push(current);
              current = [event];
              lastEnd = end;
          }
      });

      if (current.length) clusters.push(current);

      const results: any[] = [];

      clusters.forEach((cluster) => {
        const columns: CalendarEvent[][] = [];

        cluster.forEach((event) => {
          let placed = false;

          for (const column of columns) {
             const last = column[column.length - 1];
             if (event.startDate >= last.endDate) 
             {
                column.push(event);
                placed = true;
                break;
             }
          }

              if (!placed) columns.push([event]);
          });

        const totalCols = columns.length;

        columns.forEach((column, colIndex) => {
          column.forEach((event) => {
            const duration =
              (event.endDate.getTime() -
               event.startDate.getTime()) /
              3600000;

                results.push({
                    ...event,
                    top: getTimePosition(event.startDate),
                    height: Math.max(duration * HOUR_HEIGHT, 25),
                    left: (colIndex / totalCols) * 100,
                    width: 100 / totalCols,
                });
            });
          });
      });

      return results;
  }, [timedEvents]);

  const formattedDate = selectedDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  

    //Color mapping for each type w/ default
    const EVENT_COLORS: Record<string, { bg: string; border: string; text: string }> = {
        School: 
        {
            bg: "rgba(0, 122, 255, 0.2)",
            border: "#007AFF",
            text: "#0056b3",
        },
        Fitness: 
        {
            bg: "rgba(175, 82, 222, 0.2)",
            border: "#AF52DE",
            text: "#7a399b",
        },
        Club: 
        {
            bg: "rgba(52, 199, 89, 0.2)",
            border: "#34C759",
            text: "#1e7b32",
        },
        SchoolEvent: 
        {
            bg: "rgba(255, 149, 0, 0.2)",
            border: "#FF9500",
            text: "#b36800",
        },
        Default: 
        {
            bg: "rgba(128,128,128,0.2)",
            border: "#8E8E93",
            text: "#555",
        },
    };
    //STFTODO Define Colors from above

  return (
    <View style={[styles.container, { backgroundColor: isLight ? '#FFFFFF' : '#121212' }]}>
       <View style={styles.headerRow}>
         <TouchableOpacity onPress={goToPreviousDay}>
                <Text style={[styles.arrow, { color: isLight ? '#000' : '#FFF' }]}>◀</Text>
         </TouchableOpacity>
      
         <Text style={[styles.dateHeader, { color: isLight ? '#000' : '#FFF' }]}>{formattedDate}</Text>

         <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            
            {/* Help button with (i) icon */}
            <TouchableOpacity onPress={() => setInfoVisible(true)} style={styles.iconPadding}>
                <Text style={{ fontSize: 22, color: isLight ? '#007AFF' : '#0A84FF' }}>ⓘ</Text>
            </TouchableOpacity>

            {/*Refresh calendar button */}
            <TouchableOpacity onPress={handleImport} style={styles.iconPadding}>
                <Text style={styles.infoButton}>🔄</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={goToNextDay}>
                <Text style={[styles.arrow, { color: isLight ? '#000' : '#FFF' }]}>▶</Text>
            </TouchableOpacity>
         </View>
       </View>
       {errorMessage && (
            <View style={{
                backgroundColor: "#ffe5e5",
                borderLeftWidth: 4,
                borderLeftColor: "red",
                padding: 8,
                marginHorizontal: 10,
                marginBottom: 8,
                borderRadius: 6
            }}>
                <Text style={{ color: "red" }}>
                    {errorMessage}
                </Text>
            </View>
        )}

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
        {/* All day events */}
        {allDayEvents.length > 0 && (
            <View style={styles.allDayContainer}>
                {allDayEvents.map(event => (
                    <View key={event.id} style={styles.allDayEvent}>
                        <Text style={styles.allDayText}>{event.title}</Text>
                    </View>
                ))}
            </View>
        )}

        {/* Main grid structure */}
        <View style={{ flexDirection: "row" }}>

            {/* seperated hour labels */}
            <View style={{ width: 60 }}>
                {HOURS.map(hour => (
                    <View
                        key={hour}
                        style={{ height: HOUR_HEIGHT }}
                    >
                        <Text style={styles.hourLabel}>
                            {hour === 12
                                ? "12 PM"
                                : hour > 12
                                    ? `${hour - 12} PM`
                                    : hour === 0
                                        ? "12 AM"
                                        : `${hour} AM`}
                        </Text>
                    </View>
                ))}
            </View>

            {/* right side for events */}
            <View style={{ flex: 1, position: "relative" }}>

                {/* Hour lines */}
                {HOURS.map(hour => (
                    <View
                        key={`line-${hour}`}
                        style={{
                            position: "absolute",
                            top: hour * HOUR_HEIGHT,
                            left: 0,
                            right: 0,
                            height: 1,
                            backgroundColor: "#ddd",
                        }}
                    />
                ))}

                {/* Events */}
                {[...processedEvents]
                    .sort(
                        (a, b) =>
                            new Date(a.startDate).getTime() -
                            new Date(b.startDate).getTime()
                    )
                    .map(event => {
                        const theme =
                            EVENT_COLORS[event.type] || EVENT_COLORS.Default;

                        return (
                            <TouchableOpacity
                                key={event.id}
                                activeOpacity={0.8}
                                onPress={() => setSelectedEvent(event)}
                                style={[
                                    styles.eventBox,
                                    {
                                        position: "absolute",
                                        top: event.top,
                                        height: event.height,
                                        left: `${event.left}%`,
                                        width: `${event.width}%`,
                                        backgroundColor: theme.bg,
                                        borderLeftColor: theme.border,
                                        zIndex: new Date(event.startDate).getTime(),
                    elevation: 1,
                                    },
                                ]}
                            >
                                <Text
                                    style={[styles.eventTitle, { color: theme.text }]}
                                    numberOfLines={1}
                                >
                                    {event.title}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}

                {/* Current time display */}
                {isToday && (
                    <View
                        style={{
                            position: "absolute",
                            top: getTimePosition(new Date()),
                            left: 0,
                            right: 0,
                            height: 2,
                            backgroundColor: "red",
                        }}
                    />
                )}
            </View>
        </View>
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

                  Left and Right arrows change the day.
                  🔄 reloads the calendar.
                  Click an event to see the name, time, location, minimap.

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
      <Modal
            visible={!!selectedEvent}
            transparent
            animationType="slide"
            onRequestClose={() => setSelectedEvent(null)}
        >
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                {selectedEvent && (
                    <>
                        <Text style={styles.modalTitle}>
                            {selectedEvent.title}
                        </Text>

                        {selectedEvent && (
                            <ScrollView showsVerticalScrollIndicator={false}>
                            <>
                                <Text>Room: {selectedEvent.room}</Text>

                                {selectedEvent.room && (
                                    <View style={{ marginVertical: 16 }}>
                                        <Text
                                            style={{
                                                fontWeight: "600",
                                                fontSize: 16,
                                                marginBottom: 8,
                                            }}
                                        >
                                            Location Preview
                                        </Text>

                                        <MiniMap room={selectedEvent.room} />

                                        <TouchableOpacity
                                            onPress={() => {
                                                router.push({
                                                    pathname: "/maps",
                                                    params: { room: selectedEvent.room }
                                                });
                                            }}
                                            style={{ marginTop: 10 }}
                                        >
                                            <Text style={{ color: "#007AFF" }}>
                                                View Full Map
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </>
                            </ScrollView>
                        )}

                        <Text>
                            {new Date(selectedEvent.startDate).toLocaleTimeString()} - 
                            {new Date(selectedEvent.endDate).toLocaleTimeString()}
                        </Text>

                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => setSelectedEvent(null)}
                        >
                            <Text style={styles.closeButtonText}>Close</Text>
                        </TouchableOpacity>                            
                    </>
                )}
            </View>
        </View>
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
    borderLeftWidth: 4,
    borderLeftColor: "#007AFF",
    padding: 5,
    borderRadius: 4,
    zIndex: 5,
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
  modalOverlay: 
  {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    width: "90%",
    maxHeight: "80%", 
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
  },
  
  iconPadding: {
    paddingHorizontal: 8,
    },
  
});