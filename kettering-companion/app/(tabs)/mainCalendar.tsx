import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import * as Calendar from 'expo-calendar';
import { useColorScheme } from '@/hooks/use-color-scheme';

const HOUR_HEIGHT = 60; // 1 hour is 60 pixels
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export default function DaySchedule() {
    const [events, setEvents] = useState([]);
    const [now, setNow] = useState(new Date());
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    useEffect(() => {
        // Fetch Calendar Data
        (async () => {
            const { status } = await Calendar.requestCalendarPermissionsAsync();
            if (status === 'granted') {
                const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
                const calendarIds = calendars.map(cal => cal.id);

                const start = new Date();
                start.setHours(0, 0, 0, 0);
                const end = new Date();
                end.setHours(23, 59, 59, 999);

                const dayEvents = await Calendar.getEventsAsync(calendarIds, start, end);
                setEvents(dayEvents);
            }
        })();

        // Update time indicator every minute
        const interval = setInterval(() => setNow(new Date()), 60000);
        return () => clearInterval(interval);
    }, []);

    // Convert a Date object to vertical pixels
    const getTimePosition = (dateString) => {
        const date = new Date(dateString);
        const hours = date.getHours();
        const minutes = date.getMinutes();
        return hours * HOUR_HEIGHT + (minutes / 60) * HOUR_HEIGHT;
    };

    return (
         <View style={[styles.container, isDark && { backgroundColor: '#000033' }]}>
            <Text style={[styles.header, isDark && { color: 'white' }]}>Today's Schedule</Text>
            
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Background Grid as Hour Sections */}
                {HOURS.map((hour) => (
                    <View key={hour} style={[styles.hourRow, { height: HOUR_HEIGHT }]}>
                        <Text style={styles.hourLabel}>
                            {hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : hour === 0 ? '12 AM' : `${hour} AM`}
                        </Text>
                        <View style={styles.line} />
                    </View>
                ))}

                {/* Events Overlay */}
                {events.map((event) => {
                    const top = getTimePosition(event.startDate);
                    const start = new Date(event.startDate);
                    const end = new Date(event.endDate);
                    const durationInHrs = (end - start) / (1000 * 60 * 60);
                    const height = durationInHrs * HOUR_HEIGHT;

                    return (
                        <View 
                            key={event.id} 
                            style={[styles.eventBox, { top, height: Math.max(height, 20) }]}
                        >
                            <Text style={styles.eventTitle} numberOfLines={1}>{event.title}</Text>
                        </View>
                    );
                })}

                {/*  Current Time Indicator line */}
                <View style={[styles.timeIndicator, { top: getTimePosition(now) }]}>
                    <View style={styles.indicatorCircle} />
                    <View style={styles.indicatorLine} />
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    
    container: { flex: 1, backgroundColor: '#E6F0FF', paddingTop: 50 },
    header: { fontSize: 20, textAlign: 'center', marginBottom: 10, fontWeight: 'bold' },
    scrollContent: { paddingRight: 20, paddingBottom: 50 },
    hourRow: { flexDirection: 'row', alignItems: 'flex-start' },
    hourLabel: { width: 60, fontSize: 10, color: '#aaa', textAlign: 'right', paddingRight: 10, marginTop: -8 },
    line: { flex: 1, height: 1, backgroundColor: '#f0f0f0' },
    eventBox: {
        position: 'absolute',
        left: 70,
        right: 10,
        backgroundColor: 'rgba(0, 122, 255, 0.2)',
        borderLeftWidth: 4,
        borderLeftColor: '#007AFF',
        padding: 5,
        borderRadius: 4,
        zIndex: 5,
    },
    eventTitle: { fontSize: 12, fontWeight: '600', color: '#007AFF' },
    timeIndicator: {
        position: 'absolute',
        left: 60,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 10,
    },
    indicatorLine: { flex: 1, height: 2, backgroundColor: 'red' },
    indicatorCircle: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'red', marginLeft: -4 },
});
