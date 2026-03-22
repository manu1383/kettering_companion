import { FormErrors } from "@/lib/validateIntramural";
import React from "react";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity } from "react-native";
import { Intramural, MeetingTime } from "../types/subscription";
// This form component is used for both creating and editing intramural games, with shared fields and validation
type Props = {
    values: Intramural;
    setValues: React.Dispatch<React.SetStateAction<Intramural>>;
    onSubmit: () => void;
    submitLabel: string;
    errors?: FormErrors;
    onDelete?: () => void;
};
// Main form component for creating/editing intramural games
export default function IntramuralForm({ values, setValues, onSubmit, submitLabel, errors, onDelete }: Props) {
    // Helper function to update form state for game fields
    const updateGame = (field: keyof Intramural, value: any) => {
        setValues(prev => ({
            ...prev,
            [field]: value
        }));
    };
    // Helper function to update schedule fields
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

            {errors?.general && <Text style={styles.errorText}>{errors.general}</Text>}
            {errors?.team1 && <Text style={styles.errorText}>{errors.team1}</Text>}
            {errors?.team2 && <Text style={styles.errorText}>{errors.team2}</Text>}
            {errors?.location && <Text style={styles.errorText}>{errors.location}</Text>}
            {errors?.date && <Text style={styles.errorText}>{errors.date}</Text>}
            {errors?.startTime && <Text style={styles.errorText}>{errors.startTime}</Text>}
            {errors?.endTime && <Text style={styles.errorText}>{errors.endTime}</Text>}
            {errors?.sport && <Text style={styles.errorText}>{errors.sport}</Text>}
            {errors?.tourney && <Text style={styles.errorText}>{errors.tourney}</Text>}

            <TouchableOpacity style={styles.button} onPress={onSubmit}>
                <Text style={{ color: "white" }}>{submitLabel}</Text>
            </TouchableOpacity>

            {onDelete && (
                <TouchableOpacity style={[styles.button, { backgroundColor: "red", marginTop: 10 }]} onPress={onDelete}>
                    <Text style={{ color: "white" }}>Delete Game</Text>
                </TouchableOpacity>
            )}


        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container:{ 
        flex:1, 
        backgroundColor:"#E6F0F3", 
        padding:20 
    },
    input:{ 
        backgroundColor:"#fff", 
        borderRadius:12, 
        padding:14, 
        marginBottom:15 
    },
    button:{ 
        backgroundColor:"#4BA3C7", 
        padding:14, 
        borderRadius:14, 
        alignItems:"center" 
    },
    errorText:{ 
        color:"red", 
        marginBottom:10 
    }
});