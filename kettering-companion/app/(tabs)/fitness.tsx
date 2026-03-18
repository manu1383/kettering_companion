import { formatDate, to12Hour } from '@/lib/time';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useContext, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { AuthContext } from '../../context/AuthProvider';
import { IMService } from '../../services/imService';
import { Intramural } from '../../types/subscription';

export default function EventsScreen() {
    const [games, setGames] = useState<Intramural[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const { role } = useContext(AuthContext);

    useFocusEffect(
        useCallback(() => {
            const fetchEvents = async () => {
                const data = await IMService.getAllGames();
                data.sort((a, b) => {
                    const aStart = a.schedule?.[0];
                    const bStart = b.schedule?.[0];

                    if (!aStart || !bStart) return 0;

                    const aDateTime = new Date(`${aStart.startDate}T${aStart.startTime}`);
                    const bDateTime = new Date(`${bStart.startDate}T${bStart.startTime}`);

                    return aDateTime.getTime() - bDateTime.getTime();
                });
                setGames(data);
                setLoading(false);
            };
            fetchEvents();
        }, [])
    );

    const filteredEvents = games.filter((game) =>
        game.name.toLowerCase().includes(search.toLowerCase())
    );

    const renderEvent = ({ item }: { item: Intramural }) => {
        const scheduleText =
            item.schedule
                ?.map((m) => `${formatDate(m.startDate)} • ${to12Hour(m.startTime)} - ${to12Hour(m.endTime)}`);
            
        
        const canManage = role === "admin";
        return (
        <TouchableOpacity
            style={styles.card}
            onPress={() =>
            router.push({
                pathname: "/intramurals/[id]",
                params: { id: item.id! },
            })
            }
        >
            <Text style={styles.name}>{item.name}</Text>

            <Text style={styles.schedule}>
                {[scheduleText, item.location].filter(Boolean).join(" • ")}
            </Text>
            {canManage && 
                <TouchableOpacity
                    style={{ position: "absolute", right: 12, top: "50%", transform: [{ translateY: -10 }] }}
                    onPress={() =>
                        router.push({
                            pathname: "/intramurals/[id]/editGame",
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
            <Text style={styles.header}>Intramurals</Text>

            <TextInput
                placeholder="Search intramurals..."
                value={search}
                onChangeText={setSearch}
                style={styles.search}
                placeholderTextColor="#888"
            />

            {role === "admin" && (
                <TouchableOpacity
                    style={styles.createButton}
                    onPress={() => router.push("/admin/createIntramural")}
                >
                    <Text style={styles.createButtonText}>+ Create Intramural</Text>
                </TouchableOpacity>
            )}
            <FlatList
                data={filteredEvents}
                renderItem={renderEvent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                <Text style={styles.emptyText}>No intramurals found.</Text>
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
