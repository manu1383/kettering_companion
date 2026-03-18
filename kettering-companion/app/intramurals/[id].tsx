import { AuthContext } from "@/context/AuthProvider";
import { copyCalendar } from "@/lib/copyCalendar";
import { formatDate, to12Hour } from "@/lib/time";
import { IMService } from "@/services/imService";
import { useLocalSearchParams } from "expo-router";
import { deleteDoc, doc, getDoc, setDoc } from "firebase/firestore";
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

  useEffect(() => {
    const checkSubscription = async () => {
      if (!user || !game) return;
      if(!game?.id){
        console.error("Game ID is undefined");
        return;
      }
      const subRef = doc(db, "users", user.uid, "subscriptions", game.id);
      const subDoc = await getDoc(subRef);
      setSubscribed(subDoc.exists());
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

  const handleSubscribe = async () => {
    if (!game || !user) return;

    if(!game?.id){
      console.error("Game ID is undefined");
      return;
    }

    const subRef = doc(db, "users", user.uid, "subscriptions", game.id);

    await setDoc(subRef, {
      clubId: game.id,
      clubName: game.name,
      subscribedAt: new Date()
    });

    setSubscribed(true);
    const month = 
      new Date().getFullYear() +
      "-" +
      String(new Date().getMonth() + 1).padStart(2, "0");
    
    await copyCalendar(user.uid, month);
  };

  const handleUnsubscribe = async () => {
    if (!game || !user) return;
    if(!game?.id){
      console.error("Game ID is undefined");
      return;
    }
    const uid = user.uid;
    const gameId = game.id;

    const subRef = doc(db, "users", uid, "subscriptions", gameId);
  
    await deleteDoc(subRef);

    const month = 
      new Date().getFullYear() +
      "-" +
      String(new Date().getMonth() + 1).padStart(2, "0");

    await copyCalendar(uid, month);
    
    alert("Unsubscribed and meetings removed!");
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

      {game.location && (
        <>
          <Text style={styles.sectionTitle}>Location: </Text>
          <Text>{game.location}</Text>
        </>
      )}

      <TouchableOpacity
        style={[
          styles.calendarButton,
          subscribed && { backgroundColor: "#999" }
        ]}
        onPress={subscribed ? handleUnsubscribe : handleSubscribe}
      >
        <Text style={styles.calendarButtonText}>
          {subscribed ? "Remove from Calendar" : "Add Game to Calendar"}
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