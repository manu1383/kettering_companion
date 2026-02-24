import { useColorScheme } from "@/hooks/use-color-scheme";
import { copyCalendar } from "@/lib/copyCalendar";
import * as Calendar from "expo-calendar";
import React, { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const HOUR_HEIGHT = 60;
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export default function DaySchedule() {
  const [events, setEvents] = useState<Calendar.Event[]>([]);
  const [now, setNow] = useState(new Date());
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  // ------------------------
  // LOAD DEVICE EVENTS
  // ------------------------
  async function loadEvents() {
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    const { status: reminderStatus } =
      await Calendar.requestRemindersPermissionsAsync();

    if (status !== "granted" || reminderStatus !== "granted") {
      console.log("Permissions not granted");
      return;
    }

    const calendars = await Calendar.getCalendarsAsync(
      Calendar.EntityTypes.EVENT
    );
    const calendarIds = calendars.map((cal) => cal.id);

    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const dayEvents = await Calendar.getEventsAsync(
      calendarIds,
      start,
      end
    );

    setEvents(dayEvents);
  }

  // ------------------------
  // IMPORT GOOGLE EVENTS
  // ------------------------
  async function handleImport() {
  try {
    await loadEvents();

    const googleEvents = await copyCalendar("manu1383@kettering.edu");

    const calendars = await Calendar.getCalendarsAsync(
      Calendar.EntityTypes.EVENT
    );

    const localCalendar = calendars[0];

    for (const event of googleEvents) {
      const title = `${event.summary || "Untitled Event"}`;

      let startDate: Date;
      let endDate: Date;
      let isAllDay = false;

      if (event.start?.dateTime && event.end?.dateTime) {
        startDate = new Date(event.start.dateTime);
        endDate = new Date(event.end.dateTime);
      }
      else if ((event.start as any)?.date && (event.end as any)?.date) {
        startDate = new Date((event.start as any).date);
        endDate = new Date((event.end as any).date);
        isAllDay = true;
      } else {
        continue;
      }

      const isDuplicate = events.some((existing) => {
        return (
          existing.title === title &&
          new Date(existing.startDate).getTime() === startDate.getTime() &&
          new Date(existing.endDate).getTime() === endDate.getTime()
        );
      });

      if (!isDuplicate) {
        await Calendar.createEventAsync(localCalendar.id, {
          title,
          startDate,
          endDate,
          timeZone: "America/New_York",
          allDay: isAllDay,
        });
      }
    }

    await loadEvents(); // refresh UI
    console.log("Import complete");
  } catch (error) {
    console.error("Import failed:", error);
  }
}

  // ------------------------
  // INITIAL LOAD
  // ------------------------
  useEffect(() => {
    loadEvents();

    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  // ------------------------
  // POSITION HELPER
  // ------------------------
  const getTimePosition = (dateString: string | Date) => {
    const date = new Date(dateString);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    return hours * HOUR_HEIGHT + (minutes / 60) * HOUR_HEIGHT;
  };

  const clearCalendar = async () => {
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    if (status !== "granted") return;

    const calendars = await Calendar.getCalendarsAsync(
      Calendar.EntityTypes.EVENT
    );
    const calendarIds = calendars.map((cal) => cal.id);

    const now = new Date();
    const start = new Date(now);
    start.setFullYear(now.getFullYear() - 1);

    const end = new Date(now);
    end.setFullYear(now.getFullYear() + 1);

    for (const calId of calendars) {
      const events = await Calendar.getEventsAsync(
        [calId.id],
        start,
        end
      );
      for (const event of events) {
        await Calendar.deleteEventAsync(event.id);
      }
    }
    await loadEvents();
  };

  return (
    <View style={[styles.container, isDark && { backgroundColor: "#000033" }]}>
      <Text style={[styles.header, isDark && { color: "white" }]}>
        Today's Schedule
      </Text>

      {/* IMPORT BUTTON */}
      <TouchableOpacity style={styles.importButton} onPress={handleImport}>
        <Text style={styles.importText}>Import Google Calendar</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.clearButton} onPress={clearCalendar}>
        <Text style={styles.clearButtonText}>Clear Calendar</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scrollContent}>
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
        {events.map((event) => {
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
        <View style={[styles.timeIndicator, { top: getTimePosition(now) }]}>
          <View style={styles.indicatorCircle} />
          <View style={styles.indicatorLine} />
        </View>
      </ScrollView>
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
  importButton: {
    backgroundColor: "#007AFF",
    padding: 10,
    marginHorizontal: 40,
    marginBottom: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  importText: { color: "white", fontWeight: "bold" },
  scrollContent: { paddingRight: 20, paddingBottom: 50 },
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
  },
  eventTitle: { fontSize: 12, fontWeight: "600", color: "#007AFF" },
  timeIndicator: {
    position: "absolute",
    left: 60,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    zIndex: 10,
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
    backgroundColor: "#D9534F",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  clearButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
});