import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useContext, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTheme } from "../../constants/theme";
import { AuthContext } from '../../context/AuthProvider';
import { formatDate, to12Hour } from '../../lib/time';
import { EventService } from '../../services/eventService';
import { Event } from '../../types/subscription';

export default function EventsScreen() {
    const colors = useTheme();
    // State variables
    const [events, setEvents] = useState<Event[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const { role } = useContext(AuthContext);

    // Fetch events on screen focus
    useFocusEffect(
        useCallback(() => {
            const fetchEvents = async () => {
                const data = await EventService.getAllEvents();
                data.sort((a, b) => a.name.localeCompare(b.name));
                setEvents(data);
                setLoading(false);
            };
            fetchEvents();
        }, [])
    );

    // Filter events based on search query
    const filteredEvents = events.filter((event) =>
        event.name.toLowerCase().includes(search.toLowerCase())
    );

    // Render individual event card
    const renderEvent = ({ item }: { item: Event }) => {
        const scheduleText =
            item.schedule
                ?.map((m) => `${formatDate(m.startDate)} • ${to12Hour(m.startTime)} - ${to12Hour(m.endTime)}`);
            
        
        const canManage = role === "admin";

        return (
            <TouchableOpacity
                style={[styles.card, { backgroundColor: colors.card }]}
                onPress={() =>
                    router.push({
                        pathname: "/events/[id]",
                        params: { id: item.id! },
                    })
                }
            >
                <Text style={[styles.name, { color: colors.text }]}>
                    {item.name}
                </Text>

                {item.description && (
                    <Text
                        style={[styles.description, { color: colors.text }]}
                        numberOfLines={2}
                    >
                        {item.description}
                    </Text>
                )}

                <Text style={[styles.schedule, { color: colors.accent }]}>
                    {[scheduleText, item.location].filter(Boolean).join(" • ")}
                </Text>

                {canManage && (
                    <TouchableOpacity
                        style={{
                            position: "absolute",
                            right: 12,
                            top: "50%",
                            transform: [{ translateY: -10 }],
                        }}
                        onPress={() =>
                            router.push({
                                pathname: "/events/[id]/editEvent",
                                params: { id: item.id! },
                            })
                        }
                    >
                        <Feather name="edit-2" size={20} color={colors.accent} />
                    </TouchableOpacity>
                )}
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <View style={[styles.centered, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.accent} />
            </View>
        );
    }

    if (error) {
        return (
            <View style={[styles.centered, { backgroundColor: colors.background }]}>
                <Text style={{ color: "red" }}>{error}</Text>
            </View>
        );
    }

   return (
        // Main container with header, search bar, and event list
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Text style={[styles.header, { color: colors.text }]}>
                Events
            </Text>

            <TextInput
                placeholder="Search events..."
                value={search}
                onChangeText={setSearch}
                style={[
                    styles.search,
                    { backgroundColor: colors.card, color: colors.text }
                ]}
                placeholderTextColor="#888"
            />

            {role === "admin" && (
                <TouchableOpacity
                    style={[
                        styles.createButton,
                        { backgroundColor: colors.accent }
                    ]}
                    onPress={() => router.push("/admin/createEvent")}
                >
                    <Text style={styles.createButtonText}>
                        + Create Event
                    </Text>
                </TouchableOpacity>
            )}

            <FlatList
                data={filteredEvents}
                keyExtractor={(item) => item.id!}
                renderItem={renderEvent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <Text style={[styles.emptyText, { color: colors.text }]}>
                        No events found.
                    </Text>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#E6F0F3",
        paddingHorizontal: 18,
        paddingTop: 20,
    },
    centered: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#E6F0F3",
    },
    header: {
        fontSize: 30,
        fontWeight: "700",
        color: "#1D3D47",
        marginBottom: 18,
    },
    search: {
        backgroundColor: "#fff",
        borderRadius: 14,
        padding: 14,
        fontSize: 16,
        marginBottom: 20,
    },
    card: {
        backgroundColor: "#fff",
        borderRadius: 18,
        padding: 18,
        marginBottom: 14,
        shadowColor: "#000",
        shadowOpacity: 0.07,
        shadowRadius: 8,
        elevation: 3,
    },
    description: {
        fontSize: 14,
        color: "#555",
        marginBottom: 10,
    },
    emptyText: {
        textAlign: "center",
        marginTop: 40,
        color: "#666",
    },
    createButton: {
        backgroundColor: '#1D3D47',
        paddingVertical: 12,
        borderRadius: 14,
        alignItems: 'center',
        marginBottom: 16,
    },
    createButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "700",
    },
    name: {
        fontSize: 18,
        fontWeight: "700",
        marginBottom: 6,
    }, 
    schedule: {
        color: "#4BA3C7",
        fontWeight: "600",
    }
});
