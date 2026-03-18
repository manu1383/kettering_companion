import React from "react";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity } from "react-native";
import { Intramural, MeetingTime } from "../types/subscription";

type Props = {
    values: Intramural;
    setValues: React.Dispatch<React.SetStateAction<Intramural>>;
    onSubmit: () => void;
    submitLabel: string;
    timeError?: string | null;
    onDelete?: () => void;
};

export default function IntramuralForm({ values, setValues, onSubmit, submitLabel }: Props) {
    const updateGame = (field: keyof Intramural, value: any) => {
        setValues(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const updateSchedule = (field: keyof MeetingTime, value: any) => {
        setValues(prev => ({
            ...prev,
            schedule: [
            {
                ...prev.schedule[0],
                [field]: value
            }
            ]
        }));
    };
    
    const time = values.schedule[0];
    return (
        <ScrollView style={styles.container}>
            <Text>Team 1</Text>
            <TextInput
                style={styles.input}
                value={values.team1}
                onChangeText={(text) => updateGame("team1", text)}
            />

            <Text>Team 2</Text>
            <TextInput
                style={styles.input}
                value={values.team2}
                onChangeText={(text) => updateGame("team2", text)}
            />

            <Text>Location</Text>
            <TextInput
                style={styles.input}
                value={values.location}
                onChangeText={(text) => updateGame("location", text)}
            />

            
            <Text>Date (YYYY-MM-DD)</Text>
            <TextInput
                style={styles.input}
                value={time.startDate}
                onChangeText={(text) => updateSchedule("startDate", text)}
            />

            <Text>Start Time (HH:MM AM/PM)</Text>
            <TextInput
                style={styles.input}
                value={time.startTime}
                onChangeText={(text) => updateSchedule("startTime", text)}
            />

            <Text>End Time (HH:MM AM/PM)</Text>
            <TextInput
                style={styles.input}
                value={time.endTime}
                onChangeText={(text) => updateSchedule("endTime", text)}
            />

            <Text>Sport</Text>
            <TextInput
                style={styles.input}
                value={values.sport}
                onChangeText={(text) => updateGame("sport", text)}
            />

            <Text>Tourney</Text>
            <TextInput
                style={styles.input}
                value={values.tourney}
                onChangeText={(text) => updateGame("tourney", text)}
            />

            <TouchableOpacity style={styles.button} onPress={onSubmit}>
                <Text style={{ color: "white" }}>Create Game</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
  container:{ flex:1, backgroundColor:"#E6F0F3", padding:20 },
  input:{ backgroundColor:"#fff", borderRadius:12, padding:14, marginBottom:15 },
  button:{ backgroundColor:"#4BA3C7", padding:14, borderRadius:14, alignItems:"center" },
  label:{ fontWeight:"700", marginBottom:6 },
});