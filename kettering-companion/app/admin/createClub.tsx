import { Picker } from "@react-native-picker/picker";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { parseTime } from "../../lib/time";
import { ClubService } from "../../services/clubService";
import { UserService } from "../../services/userService";

export default function CreateClubScreen() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [weekday, setWeekday] = useState<number>(1);
  const [frequency, setFrequency] = useState<"weekly" | "biweekly" | "monthly">("weekly");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [timeError, setTimeError] = useState("");
  const [location, setLocation] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [officerEmail, setOfficerEmail] = useState("");

  const router = useRouter();

  const handleCreateClub = async () => {
    const parsedStart = parseTime(startTime);
    const parsedEnd = parseTime(endTime);

    if (!parsedStart || !parsedEnd) {
      setTimeError("Please enter valid start and end times.");
      return;
    }

    const clubId = name.toLowerCase().replace(/\s+/g, "-");
    await ClubService.createClub({
      id: clubId,
      name,
      description,
      location,
      contactEmail,
      schedule: [
        {
          weekday,
          frequency,
          startDate,
          endDate,
          startTime: parsedStart,
          endTime: parsedEnd
        }
      ],
      officers: officerEmail ? [officerEmail] : []
    });
    if (officerEmail) {
      const userDoc = await UserService.findUserByEmail(officerEmail);
      if (userDoc) {
        await ClubService.addOfficer(clubId, userDoc.id);
      }
    }
    router.push(`/(tabs)/clubs`);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Create New Club</Text>

      <TextInput
        placeholder="Club Name"
        placeholderTextColor="#888"
        value={name}
        onChangeText={setName}
        style={styles.input}
      />

      <TextInput
        placeholder="Description"
        placeholderTextColor="#888"
        value={description}
        onChangeText={setDescription}
        style={styles.input}
        multiline
      />

      <TextInput
        placeholder="Location"
        placeholderTextColor="#888"
        value={location}
        onChangeText={setLocation}
        style={styles.input}
      />

      <TextInput
        placeholder="Contact Email (publicly visible, also sets officer permissions)"
        placeholderTextColor="#888"
        value={contactEmail}
        onChangeText={setContactEmail}
        style={styles.input}
      />

      <TextInput
        style={styles.input}
        value={officerEmail}
        onChangeText={setOfficerEmail}
        placeholder="Officer's Email (sets permissions)"
        placeholderTextColor="#888"
      />

      <Text style={styles.subHeader}>Meeting Schedule</Text>

      <Text style={styles.label}>Day of Week</Text>

      <View style={styles.picker}>
        <Picker
          selectedValue={weekday}
          onValueChange={(itemValue) => setWeekday(itemValue)}
        >
          <Picker.Item label="Monday" value={1} />
          <Picker.Item label="Tuesday" value={2} />
          <Picker.Item label="Wednesday" value={3} />
          <Picker.Item label="Thursday" value={4} />
          <Picker.Item label="Friday" value={5} />
          <Picker.Item label="Saturday" value={6} />
          <Picker.Item label="Sunday" value={0} />
        </Picker>
      </View>

      <Text style={styles.label}>Frequency</Text>

      <View style={styles.picker}>
        <Picker
          selectedValue={frequency}
          onValueChange={(itemValue) => setFrequency(itemValue)}
        >
          <Picker.Item label="Weekly" value="weekly" />
          <Picker.Item label="Biweekly" value="biweekly" />
          <Picker.Item label="Monthly" value="monthly" />
        </Picker>
      </View>

      <Text style={styles.label}>Start Date</Text>

      <TextInput
        placeholder="ex: 2024-09-01"
        placeholderTextColor="#888"
        value={startDate}
        onChangeText={setStartDate}
        style={styles.input}
      />

      <Text style={styles.label}>End Date</Text>

      <TextInput
        placeholder="ex: 2024-12-31"
        placeholderTextColor="#888"
        value={endDate}
        onChangeText={setEndDate}
        style={styles.input}
      />

      <Text style={styles.label}>Start Time</Text>

      <TextInput
        placeholder="ex: 12:20 PM"
        placeholderTextColor="#888"
        value={startTime}
        onChangeText={setStartTime}
        style={styles.input}
      />

      <Text style={styles.label}>End Time</Text>

      <TextInput
        placeholder="ex: 1:20 PM"
        placeholderTextColor="#888"
        value={endTime}
        onChangeText={setEndTime}
        style={styles.input}
      />

      {timeError ? (
        <Text style={styles.errorText}>{timeError}</Text>
      ) : null}

      <TouchableOpacity style={styles.button} onPress={handleCreateClub}>
        <Text style={styles.buttonText}>Create Club</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E6F0F3",
    padding: 20,
  },
  header: {
    fontSize: 26,
    fontWeight: "700",
    color: "#1D3D47",
    marginBottom: 20,
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#4BA3C7",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  subHeader: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 10,
  },
  picker: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 0,
    marginBottom: 15,
  },
  timeButton: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 15,
    alignItems: "center",
  },
  errorText: {
    color: "red",
    marginBottom: 10,
    fontWeight: "600"
  }
});