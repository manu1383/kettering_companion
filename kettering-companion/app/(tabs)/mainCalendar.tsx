import { AuthContext } from "@/context/AuthProvider";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { copyCalendar } from "@/lib/copyCalendar";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from "react-native";
import { requestNotificationPermissions, scheduleEventNotification } from "@/services/notifications";
import { MiniMap } from "./maps/MiniMap";
import { useTheme } from "../../constants/theme";


WebBrowser.maybeCompleteAuthSession();


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
  const router = useRouter();
  const [events, setEvents] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [infoVisible, setInfoVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { user } = useContext(AuthContext);
  const [viewMode, setViewMode] = useState<"day" | "month">("day");
  

  const colors = useTheme();
  const textColor = colors.text;

  const normalizeGoogleEvent = (event: any): CalendarEvent | null => {
        let startDate: Date;
        let endDate: Date;
        let isAllDay = false;

        if (event.start?.dateTime && event.end?.dateTime) {
            startDate = new Date(event.start.dateTime);
            endDate = new Date(event.end.dateTime);
        } 
        else if (event.start?.date && event.end?.date) {
            startDate = new Date(event.start.date);
            endDate = new Date(event.end.date);
            isAllDay = true;
        } 
        else if (event.date && event.startTime && event.endTime) {
            startDate = new Date(`${event.date}T${event.startTime}`);
            endDate = new Date(`${event.date}T${event.endTime}`);
        } 
        else {
            return null;
        }

        const title = event.summary || "Untitled Event";
        const room = event.location || undefined;
        const lower = title.toLowerCase();

        let type: CalendarEvent["type"] = "School";

        if (lower.includes("gym")) type = "Fitness";
        else if (lower.includes("club")) type = "Club";
        else if (lower.includes("event")) type = "SchoolEvent";

        return {
            id: event.id || `${event.clubId}-${event.date}`,
            title,
            startDate,
            endDate,
            allDay: isAllDay,
            type,
            room,
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

      const granted = await requestNotificationPermissions();
      if (granted) {
        parsedEvents.forEach(scheduleEventNotification);
      }

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

  const goToPrevious = () => {
        const newDate = new Date(selectedDate);

        if (viewMode === "month") {
            newDate.setMonth(newDate.getMonth() - 1);
        } else {
            newDate.setDate(newDate.getDate() - 1);
        }

        setSelectedDate(newDate);
    };

    const goToNext = () => {
        const newDate = new Date(selectedDate);

        if (viewMode === "month") {
            newDate.setMonth(newDate.getMonth() + 1);
        } else {
            newDate.setDate(newDate.getDate() + 1);
        }

        setSelectedDate(newDate);
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

  const headerText =
        viewMode === "month"
            ? selectedDate.toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
            })
            : formattedDate;

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

  useEffect(() => {
    if (!user) return;
    handleImport();
  }, [selectedDate, user]);

  const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();

        const firstDay = new Date(year, month, 1).getDay();
        const days = new Date(year, month + 1, 0).getDate();

        const grid: (number | null)[] = [];

        for (let i = 0; i < firstDay; i++) grid.push(null);
        for (let i = 1; i <= days; i++) grid.push(i);

        return grid;
    };

    const monthDays = getDaysInMonth(selectedDate);

    const renderMonthView = () => {
        const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

        return (
            <View style={{ padding: 10, alignItems: "center" }}>

                {/* Weekday headers */}
                <View style={{ flexDirection: "row", marginBottom: 5 }}>
                    {WEEK_DAYS.map(day => (
                        <Text
                            key={day}
                            style={{
                                width: "14.2%",
                                textAlign: "center",
                                fontWeight: "600",
                                color: "#888",
                            }}
                        >
                            {day}
                        </Text>
                    ))}
                </View>

                <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                    {monthDays.map((day, index) => {
                        if (!day) {
                            return (
                                <View
                                    key={index}
                                    style={{
                                        width: "14.2%",
                                        height: 45,
                                    }}
                                />
                            );
                        }

                        const date = new Date(
                            selectedDate.getFullYear(),
                            selectedDate.getMonth(),
                            day
                        );

                        // highlight today
                        const today = new Date();
                        const isToday =
                            day === today.getDate() &&
                            selectedDate.getMonth() === today.getMonth() &&
                            selectedDate.getFullYear() === today.getFullYear();

                        // FIXED: supports multi-day events
                        const hasEvents = events.some(e => {
                            const start = new Date(e.startDate);
                            const end = new Date(e.endDate);

                            const cellDate = new Date(
                                selectedDate.getFullYear(),
                                selectedDate.getMonth(),
                                day
                            );

                            return start <= cellDate && end >= cellDate;
                        });

                        return (
                            <TouchableOpacity
                                key={index}
                                style={{
                                    width: "14.2%",
                                    height: 45,
                                    padding: 4,
                                    borderWidth: 0.5,
                                    borderColor: "#222",
                                }}
                                onPress={() => {
                                    setSelectedDate(date);
                                    setViewMode("day"); // jump to day view
                                }}
                            >
                                <Text
                                    style={{
                                        textAlign: "center",
                                        color: isToday ? "#007AFF" : textColor,
                                        fontWeight: isToday ? "bold" : "normal",
                                    }}
                                >
                                    {day}
                                </Text>

                                {hasEvents && (
                                    <View
                                        style={{
                                            marginTop: 4,
                                            height: 8,
                                            width: 8,
                                            borderRadius: 4,
                                            backgroundColor: "#007AFF",
                                            alignSelf: "center",
                                        }}
                                    />
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>
        );
    };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
       <View style={styles.headerRow}>
         <TouchableOpacity onPress={goToPrevious}>
                <Text style={[styles.arrow, { color: colors.text }]}>◀</Text>
         </TouchableOpacity>
         <View style={{ flexDirection: "row", gap: 8 }}>
               <TouchableOpacity onPress={() => setViewMode("day")}>
                   <Text style={{ color: viewMode === "day" ? "#007AFF" : "#888" }}>
                       Day
                   </Text>
               </TouchableOpacity>

               <TouchableOpacity onPress={() => setViewMode("month")}>
                   <Text style={{ color: viewMode === "month" ? "#007AFF" : "#888" }}>
                       Month
                   </Text>
               </TouchableOpacity>
           </View>
      
         <Text style={[styles.dateHeader, { color: colors.text}]}>
               {headerText}
           </Text>

         <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {/* Help button with (i) icon */}
            <TouchableOpacity onPress={() => setInfoVisible(true)} style={styles.iconPadding}>
                <Text style={{ fontSize: 22, color: colors.text}}>ⓘ</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={goToNext}>
                <Text style={[styles.arrow, { color: colors.text}]}>▶</Text>
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

      

      {viewMode === "month" ? (
            renderMonthView()
        ) : (  
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
                                <Text style={[styles.hourLabel, { color: colors.text }]}>
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
                                    backgroundColor: colors.border
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
        )}

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
                    { backgroundColor: colors.modalBackground }
                ]}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  About This Calendar
                </Text>

                <Text style={[styles.modalText, { color: colors.text }]}>
                  Share your Google Calendar with
                  537697026527-compute@developer.gserviceaccount.com
                  to allow event syncing.

                  Use the arrows to navigate days, and tap events for details.
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
      <Modal
            visible={!!selectedEvent}
            transparent
            animationType="slide"
            onRequestClose={() => setSelectedEvent(null)}
        >
        <View style={styles.modalOverlay}>
            <View style={[
                styles.modalContent,
                { backgroundColor: colors.modalBackground }
            ]}>
                {selectedEvent && (
                    <>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>
                            {selectedEvent.title}
                        </Text>

                        {selectedEvent && (
                            <ScrollView showsVerticalScrollIndicator={false}>
                            <>
                                <Text style={{ color: colors.text }}>
                                    Room: {selectedEvent.room}
                                </Text>

                                {selectedEvent.room && (
                                    <View style={{
                                            marginVertical: 16,
                                            backgroundColor: colors.card,
                                            padding: 10,
                                            borderRadius: 10
                                        }}>
                                        <Text
                                            style={{
                                                fontWeight: "600",
                                                fontSize: 16,
                                                marginBottom: 8,
                                                color: colors.text
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

                        <Text style={{ color: colors.text }}>
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
    zIndex: 5,
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
  allDayContainer: { marginLeft: 70, marginBottom: 10 },
  allDayEvent: {
    backgroundColor: "rgba(0,122,255,0.15)",
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
        borderRadius: 16,
        padding: 20,
        width: "90%",
        maxHeight: "80%",
        elevation: 10, //Android
        shadowColor: "#000", //iOS
        shadowOpacity: 0.3,
        shadowRadius: 10,
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
    alignItems: "center"
  },
  iconPadding: {
    paddingHorizontal: 8,
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
