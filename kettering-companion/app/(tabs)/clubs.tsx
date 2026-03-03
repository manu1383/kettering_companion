import { useRouter } from 'expo-router';
import { collection, getDocs } from "firebase/firestore";
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { db } from '../../lib/firebase';

interface Club {
    id: string;
    name: string;
    description: string;
    meetingDay: string;
    meetingTime: string;
    contactEmail: string;
    location?: string;
}

export default function ClubsScreen() {
    const [clubs, setClubs] = useState<Club[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        const fetchClubs = async () => {
            const snapshot = await getDocs(collection(db, "clubs"));
            const clubData: Club[] = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    name: data.name,
                    description: data.description,
                    meetingDay: data.meetingDay,
                    meetingTime: data.meetingTime,
                    contactEmail: data.contactEmail,
                };
            });
            clubData.sort((a, b) => a.name.localeCompare(b.name));
            setClubs(clubData);
            setLoading(false);
        };

        fetchClubs();
    }, []);

    const filteredClubs = clubs.filter((club) =>
        club.name.toLowerCase().includes(search.toLowerCase())
    );

    const renderClub = ({ item }: { item: Club }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => 
                router.push({
                    pathname: "/clubs/[id]",
                    params: { id: item.id },
                })
            }
        >
            <Text style={styles.clubName}>{item.name}</Text>

            {item.description ? (
                <Text style={styles.description} numberOfLines={2}>
                    {item.description}
                </Text>
            ) : null}

            {(item.meetingDay || item.meetingTime || item.location) && (
                <Text style={styles.meeting}>
                    {[item.meetingDay, item.meetingTime, item.location]
                        .filter(Boolean)
                        .join(" • ")}
                </Text>
            )}
        </TouchableOpacity>
    );

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

            <FlatList
                data={filteredClubs}
                keyExtractor={(item) => item.id}
                renderItem={renderClub}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                <Text style={styles.emptyText}>No clubs found.</Text>
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
});
