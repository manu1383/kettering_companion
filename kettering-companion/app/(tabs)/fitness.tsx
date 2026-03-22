import { formatDate, formatFrequency, getPluralWeekday, to12Hour } from '@/lib/time';
import { ClubService } from '@/services/clubService';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import { Pencil } from 'lucide-react-native';
import { useContext, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTheme } from "../../constants/theme";
import { AuthContext } from '../../context/AuthProvider';
import { FitnessService } from '../../services/fitnessService';
import { Club, Intramural } from '../../types/subscription';

export default function FitnessScreen() {
    // State variables
    const [view, setView] = useState<"fitness" | "intramurals">("intramurals");
    const colors = useTheme();
    const { role } = useContext(AuthContext);
    const router = useRouter();
    const [games, setGames] = useState<Intramural[]>([]);
    const [filteredGames, setFilteredGames] = useState<Intramural[]>([]);
    const [classes, setClasses] = useState<Club[]>([]);
    const [filteredClasses, setFilteredClasses] = useState<Club[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    // Filter states (for intramurals)
    const [filters, setFilters] = useState({
        sport: "",
        tourney: "",
        team: "",
        date: null,
    });
    // Fetch intramurals on screen focus
    useEffect(() => {
        const fetchGames = async () => {
            const data = await FitnessService.getAllGames();
            data.sort((a, b) => {
                const aStart = a.schedule?.[0];
                const bStart = b.schedule?.[0];

                if (!aStart || !bStart) return 0;

                const aDateTime = new Date(`${aStart.startDate}T${aStart.startTime}`);
                const bDateTime = new Date(`${bStart.startDate}T${bStart.startTime}`);

                return aDateTime.getTime() - bDateTime.getTime();
            });
            setGames(data);
            setFilteredGames(data);
            setLoading(false);
        };
        fetchGames();
    }, []);
    // Filter intramurals when filters change
    useEffect(() => {
        const filtered = games.filter(game => {
            const firstMatch = game.schedule?.[0];

            const gameDate = firstMatch
                ? new Date(`${firstMatch.startDate}T${firstMatch.startTime}`)
                : null;

            const matchesSport =
                !filters.sport || game.sport === filters.sport;
            
            const matchesTourney =
                !filters.tourney || game.tourney === filters.tourney;
            
            const matchesTeam =
                !filters.team ||
                game.team1 === filters.team ||
                game.team2 === filters.team;

            const matchesDate =
                !filters.date ||
                (gameDate &&
                    gameDate.toDateString() === 
                    new Date(filters.date).toDateString());
            
            return (
                matchesSport &&
                matchesTourney &&
                matchesTeam &&
                matchesDate
            );
        });
        setFilteredGames(filtered);
    }, [filters, games]);
    // Fetch fitness classes on screen focus
    useEffect(() => {
        const fetchClasses = async () => {
            const data = await ClubService.getAllFitnessClasses();
            setClasses(data);
            setFilteredClasses(data);
        };
        fetchClasses();
    }, []);
    // Filter fitness classes when search changes
    useEffect(() => {
        const filtered = classes.filter(c => 
            c.name.toLowerCase().includes(search.toLowerCase())
        );
        setFilteredClasses(filtered);
    }, [search, classes]);
    // Extract unique sports, tourneys, and teams for filter dropdowns
    const sports = [...new Set(games.map(g => g.sport))].filter(Boolean);
    const tourneys = [...new Set(games.map(g => g.tourney))].filter(Boolean);
    const teams = [...new Set(games.flatMap(g => [g.team1, g.team2]))].filter(Boolean);
    
    // Render intramural games
    const renderGame = ({ item }: { item: Intramural }) => {
        const scheduleText =
            item.schedule
                ?.map((m) => {
                    if (!m.startDate || !m.startTime || !m.endTime) return null;

                    return `${formatDate(m.startDate)} • ${to12Hour(m.startTime)} - ${to12Hour(m.endTime)}`;
                })
                .filter((text): text is string => text !== null)
                .join(" • ");

        const canManage = role === "admin";

        return (
            <TouchableOpacity
                style={[styles.card, { backgroundColor: colors.card }]}
                onPress={() =>
                    router.push({
                        pathname: "/intramurals/[id]",
                        params: { id: item.id! },
                    })
                }
            >
                <Text style={[styles.name, { color: colors.text }]}>
                    {item.name}
                </Text>

                <Text style={[styles.schedule, { color: colors.accent }]}>
                    {[scheduleText, item.tourney + "-Tourney"].filter(Boolean).join(" • ")}
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
                                pathname: "/intramurals/[id]/editGame",
                                params: { id: item.id! },
                            })
                        }
                    >
                        <Pencil size={20} color={colors.accent} />
                    </TouchableOpacity>
                )}
            </TouchableOpacity>
        );
    };
    // Render fitness classes
    const renderClass = ({ item }: { item: Club }) => {
        const scheduleText = item.schedule?.map((m) => {
            const days = (m.weekdays || [])
                .map((d) => getPluralWeekday(d))
                .join(", ");

            return `${days} • ${formatFrequency(m.frequency ?? "")} • ${to12Hour(m.startTime)} - ${to12Hour(m.endTime)}`;
        });

        const canManage = role === "admin";
        return (
        <TouchableOpacity
            style={[styles.card, { backgroundColor: colors.card }]}
            onPress={() =>
            router.push({
                pathname: "/fitnessClasses/[id]",
                params: { id: item.id! },
            })
            }
        >
            <Text style={[styles.name, { color: colors.text }]}>
                {item.name}
            </Text>

            <Text style={[styles.schedule, { color: colors.accent }]}>
                {[scheduleText, item.location].filter(Boolean).join(" • ")}
            </Text>
            {canManage && 
                <TouchableOpacity
                    style={{ position: "absolute", right: 12, top: "50%", transform: [{ translateY: -10 }] }}
                    onPress={() =>
                        router.push({
                            pathname: "/fitnessClasses/[id]/editClass",
                            params: { id: item.id! },
                        })
                    }
                >
                    <Pencil size={20} color={colors.accent} />
                </TouchableOpacity>
            }
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
    // If no classes or games found, show empty state
    // Show either intramurals or fitness classes based on selected view
    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Text style={[styles.header, { color: colors.text }]}>
                {view === "intramurals" ? "Intramurals" : "Fitness Classes"}
            </Text>

            <View style={styles.toggleContainer}>
                <TouchableOpacity
                    style={[
                        styles.toggleButton,
                        view === "intramurals" && styles.activeToggle
                    ]}
                    onPress={() => setView("intramurals")}
                >
                    <Text
                        style={[
                            styles.toggleText,
                            view === "intramurals" && styles.activeText
                        ]}
                        >
                        Intramurals
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                    styles.toggleButton,
                    view === "fitness" && styles.activeToggle
                    ]}
                    onPress={() => setView("fitness")}
                >
                    <Text
                        style={[
                            styles.toggleText,
                            view === "fitness" && styles.activeText
                        ]}
                    >
                        Fitness Classes
                    </Text>
                </TouchableOpacity>
            </View>

            {view === "intramurals" ? (
            
                <><TextInput
                    placeholder="Search intramurals..."
                    value={search}
                    onChangeText={setSearch}
                    style={[styles.search, { backgroundColor: colors.card, color: colors.text }]}
                    placeholderTextColor="#888"
                />
                <View style={styles.pickerWrapper}>
                    <View style={[styles.smallPicker, { backgroundColor: colors.card }]}>
                        <Picker
                            selectedValue={filters.sport}
                            onValueChange={(value) =>
                            setFilters((prev) => ({ ...prev, sport: value }))
                            }
                        >
                            <Picker.Item label="All Sports" value="" />
                            {sports.map((s) => (
                            <Picker.Item key={s} label={s} value={s} />
                            ))}
                        </Picker>
                    </View>

                    <View style={[styles.smallPicker, { backgroundColor: colors.card }]}>
                        <Picker
                            selectedValue={filters.tourney}
                            onValueChange={(value) =>
                            setFilters((prev) => ({ ...prev, tourney: value }))
                            }
                        >
                            <Picker.Item label="All Tourneys" value="" />
                                {tourneys.map((t) => (
                            <Picker.Item key={t} label={t} value={t} />
                            ))}
                        </Picker>
                    </View>

                    <View style={[styles.smallPicker, { backgroundColor: colors.card }]}>
                        <Picker
                            selectedValue={filters.team}
                            onValueChange={(value) =>
                            setFilters((prev) => ({ ...prev, team: value }))
                            }
                        >
                            <Picker.Item label="All Teams" value="" />
                            {teams.map((t) => (
                            <Picker.Item key={t} label={t} value={t} />
                            ))}
                        </Picker>
                    </View>
                </View>

                {role === "admin" && (
                    <TouchableOpacity
                        style={[styles.createButton, { backgroundColor: colors.accent }]}
                        onPress={() => router.push("/admin/createIntramural")}
                    >
                        <Text style={styles.createButtonText}>
                            + Create Intramural
                        </Text>
                    </TouchableOpacity>
                )}

                <FlatList
                    data={filteredGames}
                    renderItem={renderGame}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                    <Text style={[styles.emptyText, { color: colors.text }]}>No intramurals found.</Text>
                    }
                /></> 
            ) : (
                <><TextInput
                    placeholder="Search fitness classes..."
                    value={search}
                    onChangeText={setSearch}
                    style={[styles.search, { backgroundColor: colors.card, color: colors.text }]}
                    placeholderTextColor="#888"
                />
                {role === "admin" && (
                    <TouchableOpacity
                        style={[styles.createButton, { backgroundColor: colors.accent }]}
                        onPress={() => router.push("/admin/createFitnessClass")}
                    >
                        <Text style={styles.createButtonText}>+ Create Fitness Class</Text>
                    </TouchableOpacity>
                )}

                <FlatList
                    data={filteredClasses}
                    renderItem={renderClass}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                    <Text style={[styles.emptyText, { color: colors.text }]}>No fitness classes found.</Text>
                    }
                /></>
            )}
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
        marginBottom: 10,
    },
    search: {
        backgroundColor: "#fff",
        borderRadius: 14,
        padding: 14,
        fontSize: 16,
        marginBottom: 10,
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
        marginTop: 16
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
    pickerWrapper: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    smallPicker: {
        width: "30%",
        backgroundColor: "#eee",
        borderRadius: 5,
    },
    toggleContainer: {
        flexDirection: "row",
        backgroundColor: "#d9e6eb",
        borderRadius: 12,
        marginBottom: 15,
        overflow: "hidden",
    },
    toggleButton: {
        flex: 1,
        paddingVertical: 10,
        alignItems: "center",
    },
    activeToggle: {
        backgroundColor: "#4BA3C7",
    },
    toggleText: {
        fontWeight: "600",
        color: "#1D3D47",
    },
    activeText: {
        color: "#fff",
    },
});
