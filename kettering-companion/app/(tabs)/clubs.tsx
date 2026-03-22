import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useContext, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTheme } from "../../constants/theme";
import { AuthContext } from '../../context/AuthProvider';
import { formatFrequency, getPluralWeekday, to12Hour } from '../../lib/time';
import { ClubService } from '../../services/clubService';
import { Club } from '../../types/subscription';

export default function ClubsScreen() {
    const colors = useTheme();
    // State variables
    const [clubs, setClubs] = useState<Club[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const { user, role } = useContext(AuthContext);
    const [showingSubscribed, setShowingSubscribed] = useState(false);
    const [subscriptions, setSubscriptions] = useState<string[]>([]);

    // Fetch clubs and user subscriptions on screen focus
    useFocusEffect(
        useCallback(() => {
            const fetchClubs = async () => {
                const [clubsData, userSubscriptions] = await Promise.all([
                    ClubService.getAllClubs(),
                    ClubService.getUserSubscribedClubs(user?.uid ?? "")
                ]);
                setClubs(clubsData);
                setSubscriptions(userSubscriptions);
                setLoading(false);
            };
            fetchClubs();
        }, [])
    );

    // Filter clubs based on search and subscription status
    const filteredClubs = clubs.filter((club) => {
        const matchesSearch = club.name.toLowerCase().includes(search.toLowerCase());
        
        const isSubscribed = subscriptions.includes(club.id ?? "");
        if (showingSubscribed) {
            return matchesSearch && isSubscribed;
        }
        return matchesSearch;
    });

    // Render individual club card
    const renderClub = ({ item }: { item: Club }) => {
        const scheduleText = item.schedule
            ?.map((m) => {
                if (
                    m.weekdays === undefined ||
                    m.frequency === undefined ||
                    !m.startTime ||
                    !m.endTime
                ) {
                    return null;
                } else {
                    const days = (m.weekdays || [])
                        .map((d) => getPluralWeekday(d))
                        .join(", ");
                    return `${days} • Repeats ${formatFrequency(m.frequency ?? "")} • ${
                        to12Hour(m.startTime)} - ${to12Hour(m.endTime)}`;
                }

            
        })
        .filter((text): text is string => text !== null)
        .join(" • ");
        
        // Determine if user can manage the club (admin or officer)
        const isOfficer = item.officers?.includes(user?.uid ?? "");
        const canManage = role === "admin" || isOfficer;

        return (
            <TouchableOpacity
                style={[styles.card, { backgroundColor: colors.card }]}
                onPress={() =>
                    router.push({
                        pathname: "/clubs/[id]",
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
                                pathname: "/clubs/[id]/editClub",
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
        // Main container
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Text style={[styles.header, { color: colors.text }]}>
                Clubs
            </Text>

            <TextInput
                placeholder="Search clubs..."
                value={search}
                onChangeText={setSearch}
                style={[
                    styles.search,
                    { backgroundColor: colors.card, color: colors.text }
                ]}
                placeholderTextColor="#888"
            />
            <View style={styles.filterContainer}>
                <TouchableOpacity
                    style={[styles.filterButton, showingSubscribed && styles.activeFilter]}
                    onPress={() => setShowingSubscribed(!showingSubscribed)}
                >
                    <Text style={styles.filterButtonText}>
                        {showingSubscribed ? "Show All" : "Show Subscribed"}
                    </Text>
                </TouchableOpacity>
            </View>
            {role === "admin" && (
                <TouchableOpacity
                    style={[
                        styles.createButton,
                        { backgroundColor: colors.accent }
                    ]}
                    onPress={() => router.push("/admin/createClub")}
                >
                    <Text style={styles.createButtonText}>
                        + Create Club
                    </Text>
                </TouchableOpacity>
            )}

            <FlatList
                data={filteredClubs}
                keyExtractor={(item) => item.id!}
                renderItem={renderClub}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <Text style={[styles.emptyText, { color: colors.text }]}>
                        No clubs found.
                    </Text>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 18,
        paddingTop: 20,
    },
    centered: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    header: {
        fontSize: 30,
        fontWeight: "700",
        marginBottom: 18,
    },
    search: {
        borderRadius: 14,
        padding: 14,
        fontSize: 16,
        marginBottom: 20,
    },
    card: {
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
        marginBottom: 10,
    },
    emptyText: {
        textAlign: "center",
        marginTop: 40,
    },
    createButton: {
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
        fontWeight: "600",
    },
    filterContainer: {
        flexDirection: "row",
        marginBottom: 16,
        gap: 10,
    },
    filterButton: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 10,
        backgroundColor: "#ccc",
        alignItems: "center",
    },
    activeFilter: {
        backgroundColor: "#4BA3C7",
    },
    filterButtonText: {
        color: "#fff",
        fontWeight: "600",
    },
});
