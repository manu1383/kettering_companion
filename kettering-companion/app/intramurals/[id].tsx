import { AuthContext } from "@/context/AuthProvider";
import { copyCalendar } from "@/lib/copyCalendar";
import { formatDate, to12Hour } from "@/lib/time";
import { IMService } from "@/services/imService";
import { useLocalSearchParams } from "expo-router";
import { collection, deleteDoc, doc, getDoc, getDocs, setDoc, writeBatch } from "firebase/firestore";
import { useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { db } from "../../lib/firebase";
import { Intramural } from "../../types/subscription";

/* =============================
   Component
============================= */

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useContext(AuthContext);

  const [game, setGame] = useState<Intramural | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscribed, setSubscribed] = useState(false);

  const [team1Sub, setTeam1Sub] = useState(false);
  const [team2Sub, setTeam2Sub] = useState(false);

  useEffect(() => {
    const fetchGame = async () => {
      const gameData = await IMService.getGame(id as string);
      console.log("Fetched game data:", gameData);
      if (!gameData) return;
      setGame(gameData);
      setLoading(false);
    };
    fetchGame();
  }, [id]);

  const getTeamId = (teamName: string) => {
    if(!game) return null;
    return `${game.sport.toLowerCase()}_${game.tourney.toLowerCase()}_${teamName.toLowerCase()}`;
  };

  useEffect(() => {
    const checkSubscription = async () => {
      if (!user || !game) return;

      const team1Id = getTeamId(game.team1);
      const team2Id = getTeamId(game.team2);

      const [doc1, doc2] = await Promise.all([
        team1Id ? getDoc(doc(db, "users", user.uid, "subscriptions", team1Id)) : null,
        team2Id ? getDoc(doc(db, "users", user.uid, "subscriptions", team2Id)) : null,
      ]);

      setTeam1Sub(doc1?.exists() ?? false);
      setTeam2Sub(doc2?.exists() ?? false);
      setSubscribed((doc1?.exists() ?? false) || (doc2?.exists() ?? false));
    };
    checkSubscription();
  }, [user, game]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4BA3C7" />
      </View>
    );
  }

  if (error || !game) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: "red" }}>{error ?? "Game not found."}</Text>
      </View>
    );
  }

  const addGameToCalendar = async () => {
    if (!game || !user) return;

    const subRef = doc(db, "users", user.uid, "subscriptions", game.id);
    await setDoc(subRef, {
      id: game.id,
      name: game.name,
      subscribedAt: new Date()
    });
    setSubscribed(true);

    const month = 
          new Date().getFullYear() +
          "-" +
          String(new Date().getMonth() + 1).padStart(2, "0");
    console.log("Copying calendar for month:", month);
    console.log("User ID:", user.uid);
        
    await copyCalendar(user.uid, month);

    alert("Game added to calendar!");
  };


  const subscribeToTeam = async (teamName: string) => {
    if (!game || !user) return;

    const teamId = getTeamId(teamName);
    const batch = writeBatch(db);

    batch.set(doc(db, "users", user.uid, "subscriptions", teamId!), {
      teamId,
      teamName,
      sport: game.sport,
      tourney: game.tourney,
      subscribedAt: new Date()
    });
    
    const snap = await getDocs(collection(db, "intramurals"));

    for (const d of snap.docs) {
      const g = d.data() as Intramural;

      if (
        g.team1 === teamName &&
        g.sport === game.sport &&
        g.tourney === game.tourney
      ) {
        batch.set(
          doc(db, "users", user.uid, "calendarCache", g.id),
          g
        );
      }

      if (
        g.team2 === teamName &&
        g.sport === game.sport &&
        g.tourney === game.tourney
      ) {
        batch.set(
          doc(db, "users", user.uid, "calendarCache", g.id),
          g
        );
      }
    }

    await batch.commit();
    alert(`Subscribed to ${teamName}`);
    
  };

  const unsubscribe = async (teamName: string) => {
      if (!user) return;

      const teamId = getTeamId(teamName);
      if (!teamId) return;

      await deleteDoc(doc(db, "users", user.uid, "calendarCache", teamId));

      alert(`Unsubscribed from ${teamName}`);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.name}>{game.name}</Text>

      {game.schedule && (
        <>
          <Text style={styles.sectionTitle}>Game Time: </Text>
          {game.schedule.map((m, i) => (
            <Text key={i} style={styles.schedule}>
              {formatDate(m.startDate)} • {to12Hour(m.startTime)} - {to12Hour(m.endTime)}
            </Text>
          ))}
        </>
      )}

      {game.sport && (
        <>
          <Text style={styles.sectionTitle}>Sport: </Text>
          <Text>{game.sport}</Text>
        </>
      )}

      {game.tourney && (
        <>
          <Text style={styles.sectionTitle}>Tourney: </Text>
          <Text>{game.tourney}</Text>
        </>
      )}

      {game.location && (
        <>
          <Text style={styles.sectionTitle}>Location: </Text>
          <Text>{game.location}</Text>
        </>
      )}

      <TouchableOpacity
        style={styles.calendarButton}
        onPress={addGameToCalendar}
      >
        <Text style={styles.calendarButtonText}>
          Add This Game
        </Text>
      </TouchableOpacity>

      {/* 🔔 Subscribe Team 1 */}
      <TouchableOpacity
        style={[
          styles.calendarButton,
          team1Sub && { backgroundColor: "#999" },
        ]}
        onPress={() =>
          team1Sub
            ? unsubscribe(game.team1)
            : subscribeToTeam(game.team1)
        }
      >
        <Text style={styles.calendarButtonText}>
          {team1Sub
            ? `Unfollow ${game.team1}`
            : `Follow ${game.team1}`}
        </Text>
      </TouchableOpacity>

      {/* 🔔 Subscribe Team 2 */}
      <TouchableOpacity
        style={[
          styles.calendarButton,
          team2Sub && { backgroundColor: "#999" },
        ]}
        onPress={() =>
          team2Sub
            ? unsubscribe(game.team2)
            : subscribeToTeam(game.team2)
        }
      >
        <Text style={styles.calendarButtonText}>
          {team2Sub
            ? `Unfollow ${game.team2}`
            : `Follow ${game.team2}`}
        </Text>
      </TouchableOpacity>
      
    
    </ScrollView>
  );
}

/* =============================
   Styles
============================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E6F0F3",
    padding: 20,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E6F0F3",
  },
  name: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1D3D47",
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: "#444",
    marginBottom: 20,
    lineHeight: 22,
  },
  section: {
    fontSize: 15,
    color: "#555",
    marginBottom: 10,
  },
  sectionTitle: {
    fontWeight: "700",
    marginTop: 15,
  },
  schedule: {
      color: "#4BA3C7",
      fontWeight: "600",
      marginBottom: 4,
  },
  calendarButton: {
    backgroundColor: "#4BA3C7",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 30,
  },
  calendarButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  }
});