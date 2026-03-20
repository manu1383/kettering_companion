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
    return `${game.sport}_${game.tourney}_${teamName}`.toLowerCase().replace(/\s+/g, "-");
  };

  const checkSubscription = async () => {
    if (!user || !game) return;

    const team1Id = getTeamId(game.team1);
    const team2Id = getTeamId(game.team2);

    const [doc1, doc2, gameDoc] = await Promise.all([
      team1Id ? getDoc(doc(db, "users", user.uid, "subscriptions", team1Id)) : null,
      team2Id ? getDoc(doc(db, "users", user.uid, "subscriptions", team2Id)) : null,
      getDoc(doc(db, "users", user.uid, "subscriptions", game.id))
    ]);

    setTeam1Sub(doc1?.exists() ?? false);
    setTeam2Sub(doc2?.exists() ?? false);
    setSubscribed(gameDoc.exists());
  };

  useEffect(() => {
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

  const unsubscribeFromGame = async () => {
    if (!user || !game) return;
    const uid = user.uid;
    const gameId = game.id;
    const subRef = doc(db, "users", uid, "subscriptions", gameId);
    
    await deleteDoc(subRef);
    const month =
      new Date().getFullYear() +
      "-" +
      String(new Date().getMonth() + 1).padStart(2, "0");

    await copyCalendar(uid, month);
    alert("Game removed from calendar!");
  };

  const subscribeToTeam = async (teamName: string) => {
    if (!game || !user) return;

    const teamId = getTeamId(teamName)!;
    const batch = writeBatch(db);

    batch.set(doc(db, "users", user.uid, "subscriptions", teamId), {
      type: "team",
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
        (g.team1Id === teamId || g.team2Id === teamId) &&
        g.sport === game.sport &&
        g.tourney === game.tourney
      ) {

        batch.set(doc(db, "users", user.uid, "subscriptions", g.id), {
          type: "game",
          ...g
        });
      }
    }

    await batch.commit();

    if (teamName === game.team1) setTeam1Sub(true);
    if (teamName === game.team2) setTeam2Sub(true);

    const month =
      new Date().getFullYear() +
      "-" +
      String(new Date().getMonth() + 1).padStart(2, "0");

    await copyCalendar(user.uid, month);

    await checkSubscription();

    alert(`Subscribed to ${teamName}`);
    
  };

  const unsubscribeFromTeam = async (teamName: string) => {
      if (!user || !game) return;

      const teamId = getTeamId(teamName)!;
      const batch = writeBatch(db);

      batch.delete(doc(db, "users", user.uid, "subscriptions", teamId));

      const snap = await getDocs(collection(db, "users", user.uid, "subscriptions"));

      for (const d of snap.docs) {
        const data = d.data();

        if (
          data.type === "game" &&
          (data.team1Id === teamId || data.team2Id === teamId) &&
          data.sport === game?.sport &&
          data.tourney === game?.tourney
        ) {
          batch.delete(d.ref);
        }
      }

      await batch.commit();

      if (teamName === game.team1) { setTeam1Sub(false); }
      if (teamName === game.team2) { setTeam2Sub(false); }

      const month = 
        new Date().getFullYear() +
        "-" +
        String(new Date().getMonth() + 1).padStart(2, "0");

      await copyCalendar(user.uid, month);

      await checkSubscription();

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
        style={[styles.calendarButton, subscribed && { backgroundColor: "#999" }]}
        onPress={() => subscribed ? unsubscribeFromGame() : addGameToCalendar()}
      >
        <Text style={styles.calendarButtonText}>
          {subscribed ? "Remove Game from Calendar" : "Add Game to Calendar"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.calendarButton,
          team1Sub && { backgroundColor: "#999" },
        ]}
        onPress={() =>
          team1Sub ? unsubscribeFromTeam(game.team1) : subscribeToTeam(game.team1)
        }
      >
        <Text style={styles.calendarButtonText}>
          {team1Sub ? `Unfollow ${game.team1}` : `Follow ${game.team1}`}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.calendarButton,
          team2Sub && { backgroundColor: "#999" },
        ]}
        onPress={() =>
          team2Sub ? unsubscribeFromTeam(game.team2) : subscribeToTeam(game.team2)
        }
      >
        <Text style={styles.calendarButtonText}>
          {team2Sub ? `Unfollow ${game.team2}` : `Follow ${game.team2}`}
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