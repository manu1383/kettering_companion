import { formatFrequency, getPluralWeekday, to12Hour } from '@/lib/time';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useContext, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { AuthContext } from '../../context/AuthProvider';
import { ClubService } from '../../services/clubService';
import { Club } from '../../types/subscription';

export default function ClubsScreen() {
    const [clubs, setClubs] = useState<Club[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const { user, role, subscribedClubs } = useContext(AuthContext);
    const [showingSubscribed, setShowingSubscribed] = useState(false);
    const [subscriptions, setSubscriptions] = useState<string[]>([]);

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

    const filteredClubs = clubs.filter((club) => {
        const matchesSearch = club.name.toLowerCase().includes(search.toLowerCase());
        
        const isSubscribed = subscriptions.includes(club.id ?? "");
        if (showingSubscribed) {
            return matchesSearch && isSubscribed;
        }
        return matchesSearch;
    });

    const renderClub = ({ item }: { item: Club }) => {
        const scheduleText =
            item.schedule
                ?.map((m) => `${getPluralWeekday(m.weekday)} • ${formatFrequency(m.frequency)} • ${to12Hour(m.startTime)} - ${to12Hour(m.endTime)}`);
        
        const isOfficer =
            item.officers?.includes(user?.uid ?? "");

        const canManage = role === "admin" || isOfficer;

        return (
        <TouchableOpacity
            style={styles.card}
            onPress={() =>
            router.push({
                pathname: "/clubs/[id]",
                params: { id: item.id! },
            })
            }
        >
            <Text style={styles.name}>{item.name}</Text>

            {item.description && (
            <Text style={styles.description} numberOfLines={2}>
                {item.description}
            </Text>
            )}

            <Text style={styles.schedule}>
                {[scheduleText, item.location].filter(Boolean).join(" • ")}
            </Text>
            {canManage && 
                <TouchableOpacity
                    style={{ position: "absolute", right: 12, top: "50%", transform: [{ translateY: -10 }] }}
                    onPress={() =>
                        router.push({
                            pathname: "/clubs/[id]/editClub",
                            params: { id: item.id! },
                        })
                    }
                >
                    <Feather name="edit-2" size={20} color="#4BA3C7" />
                </TouchableOpacity>
            }
        </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#4BA3C7" />
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.centered}>
                <Text style={{color: "red"}}>{error}</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Clubs</Text>

            <TextInput
                placeholder="Search clubs..."
                value={search}
                onChangeText={setSearch}
                style={styles.search}
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
                    style={styles.createButton}
                    onPress={() => router.push("/admin/createClub")}
                >
                    <Text style={styles.createButtonText}>+ Create Club</Text>
                </TouchableOpacity>
            )}
            <FlatList
                data={filteredClubs}
                keyExtractor={(item) => item.id!}
                renderItem={renderClub}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                <Text style={styles.emptyText}>No clubs found.</Text>
                }
            />
        </View>
    );
};

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
    clubName: {
        fontSize: 18,
        fontWeight: "700",
        color: "#1D3D47",
        marginBottom: 6,
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
    },
    subscribeButton: {
        backgroundColor: "#4BA3C7",
        paddingVertical: 12,
        borderRadius: 14,
        alignItems: "center",
        marginBottom: 16,
    },
    subscribeButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "700",
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
