import { Picker } from "@react-native-picker/picker";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Club, MeetingTime } from "../types/subscription";

type Props = {
    values: Club;
    setValues: React.Dispatch<React.SetStateAction<Club>>;
    onSubmit: () => void;
    submitLabel: string;
    timeError?: string | null;
    onDelete?: () => void;
    isEvent?: boolean;
};

export default function ClubForm({
  values,
  setValues,
  onSubmit,
  submitLabel,
  timeError,
  onDelete,
  isEvent
}: Props) {

    const update = (field: keyof Club, value: any) => {
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

    const updateOfficer = (value: string) => {
        setValues(prev => ({
            ...prev,
            officers: value ? [value] : []
        }));
    };
    const time = values.schedule[0];

    return (
        <ScrollView style={styles.container}>

        <Text style={styles.label}>Name</Text>
        <TextInput
            placeholder="Name"
            placeholderTextColor='#888'
            value={values.name}
            onChangeText={(t) => update("name", t)}
            style={styles.input}
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
            placeholder="Description"
            placeholderTextColor='#888'
            value={values.description}
            onChangeText={(t) => update("description", t)}
            style={styles.input}
            multiline
        />

        <Text style={styles.label}>Location</Text>
        <TextInput
            placeholder="Location"
            placeholderTextColor='#888'
            value={values.location}
            onChangeText={(t) => update("location", t)}
            style={styles.input}
        />

        <Text style={styles.label}>Contact Email</Text>
        <TextInput
            placeholder="Contact Email"
            placeholderTextColor='#888'
            value={values.contactEmail}
            onChangeText={(t) => update("contactEmail", t)}
            style={styles.input}
        />

        {!isEvent &&
            <><Text style={styles.label}>Officer Email (sets permissions)</Text>
            <TextInput
            placeholder="Officer Email (sets permissions)"
            placeholderTextColor='#888'
            value={values.officers?.[0] ?? ""}
            onChangeText={(t) => updateOfficer(t)}
            style={styles.input}
            /></>
        }
        

        <Text style={styles.subHeader}>Meeting Schedule</Text>

        <Text style={styles.label}>Day of Week</Text>

        <View style={styles.picker}>
            <Picker
            selectedValue={time.weekday}
            onValueChange={(v) => updateSchedule("weekday", v)}
            >
            <Picker.Item label="Monday" value={1}/>
            <Picker.Item label="Tuesday" value={2}/>
            <Picker.Item label="Wednesday" value={3}/>
            <Picker.Item label="Thursday" value={4}/>
            <Picker.Item label="Friday" value={5}/>
            <Picker.Item label="Saturday" value={6}/>
            <Picker.Item label="Sunday" value={0}/>
            </Picker>
        </View>

        {!isEvent && (
            <><Text style={styles.label}>Repeat</Text>
            <View style={styles.picker}>
                <Picker
                    selectedValue={time.frequency}
                    onValueChange={(v) => updateSchedule("frequency", v)}
                >
                    <Picker.Item label="Never" value="never" />
                    <Picker.Item label="Weekly" value="weekly" />
                    <Picker.Item label="Biweekly" value="biweekly" />
                    <Picker.Item label="Monthly" value="monthly" />
                </Picker>
            </View></>
        )}

        <Text style={styles.label}>Start Date (YYYY-MM-DD)</Text>
        <TextInput
            placeholder="Start Date (2024-09-01)"
            placeholderTextColor='#888'
            value={time.startDate}
            onChangeText={(t) => updateSchedule("startDate", t)}
            style={styles.input}
        />

        {!isEvent && (
            <><Text style={styles.label}>End Date (YYYY-MM-DD)</Text>
            <TextInput
                placeholder="End Date (2024-12-31)"
                placeholderTextColor='#888'
                value={time.endDate}
                onChangeText={(t) => updateSchedule("endDate", t)}
                style={styles.input}
            /></>
        )}

        <Text style={styles.label}>Start Time (HH:MM AM/PM)</Text>
        <TextInput
            placeholder="Start Time (12:20 PM)"
            placeholderTextColor='#888'
            value={time.startTime}
            onChangeText={(t) => updateSchedule("startTime", t)}
            style={styles.input}
        />

        <Text style={styles.label}>End Time (HH:MM AM/PM)</Text>
        <TextInput
            placeholder="End Time (1:20 PM)"
            placeholderTextColor='#888'
            value={time.endTime}
            onChangeText={(t) => updateSchedule("endTime", t)}
            style={styles.input}
        />

        {timeError && <Text style={styles.errorText}>{timeError}</Text>}

        <TouchableOpacity style={styles.button} onPress={onSubmit}>
            <Text style={styles.buttonText}>{submitLabel}</Text>
        </TouchableOpacity>

        {onDelete && !isEvent && (
            <TouchableOpacity style={[styles.button, { backgroundColor: "red", marginTop: 10 }]} onPress={onDelete}>
                <Text style={styles.buttonText}>Delete Club</Text>
            </TouchableOpacity>
        )}

        {onDelete && isEvent && (
            <TouchableOpacity style={[styles.button, { backgroundColor: "red", marginTop: 10 }]} onPress={onDelete}>
                <Text style={styles.buttonText}>Delete Event</Text>
            </TouchableOpacity>
        )}

        </ScrollView>
    );
}

const styles = StyleSheet.create({
  container:{ flex:1, backgroundColor:"#E6F0F3", padding:20 },
  input:{ backgroundColor:"#fff", borderRadius:12, padding:14, marginBottom:15 },
  picker:{ backgroundColor:"#fff", borderRadius:12, marginBottom:15 },
  subHeader:{ fontSize:18, fontWeight:"700", marginBottom:10 },
  label:{ fontWeight:"700", marginBottom:10 },
  button:{ backgroundColor:"#4BA3C7", padding:14, borderRadius:14, alignItems:"center" },
  buttonText:{ color:"#fff", fontWeight:"700", fontSize:16 },
  errorText:{ color:"red", marginBottom:10 }
});