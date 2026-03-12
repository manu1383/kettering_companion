import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useContext, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { AuthContext } from '../../context/AuthProvider';
import { ClubService } from '../../services/clubService';
import { Club } from '../../types/club';
import { subscribeToClub } from '../services/clubService';
import { unsubscribeFromClub } from '../services/clubService';

export default function ClubsScreen() {
    const [clubs, setClubs] = useState<Club[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const { user, role, subscribedClubs } = useContext(AuthContext);

    useFocusEffect(
        useCallback(() => {
            const fetchClubs = async () => {
                const data = await ClubService.getAllClubs();
                data.sort((a, b) => a.name.localeCompare(b.name));
                setClubs(data);
                setLoading(false);
            };
            fetchClubs();
        }, [])
    );

    const filteredClubs = clubs.filter((club) =>
        club.name.toLowerCase().includes(search.toLowerCase())
    );
        const toggleSubscription = async (clubId: string, subscribe: boolean) => {
        try {
            if (subscribe) {
                await subscribeToClub(user!.uid, clubId);
            } else {
                await unsubscribeFromClub(user!.uid, clubId);
            }
        } catch (err) {
            console.error("Subscription error:", err);
            setError("Failed to update subscription. Please try again.");
        }
    }
    
    const renderClub = ({ item }: { item: Club }) => {
        const scheduleText =
        item.schedule
            ?.map((m) => `${m.day} ${m.time}`)
            .join(" • ") ?? "";
        
        const isOfficer =
            item.officers?.includes(user?.uid ?? "");

        const canManage = role === "admin" || isOfficer;

        const isSubscribed = subscribedClubs.includes(item.id!);

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
                            pathname: "/clubs/[id]/edit",
                            params: { id: item.id! },
                        })
                    }
                >
                    <Feather name="edit-2" size={20} color="#4BA3C7" />
                </TouchableOpacity>
            }

            <TouchableOpacity
                style={styles.subscribeButton}
                onPress={() => toggleSubscription(item.id!, !isSubscribed)}
            >
                <Text style={styles.subscribeButtonText}>
                    {isSubscribed ? "Unsubscribe" : "Subscribe"}
                </Text>
            </TouchableOpacity>
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
    meeting: {
        fontSize: 13,
        fontWeight: "600",
        color: "#4BA3C7",
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
});
