import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from "../../constants/theme";

export default function WorkoutScreen() {
    const colors = useTheme();

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            
            <View style={[styles.card, { backgroundColor: colors.card }]}>
                <Text style={[styles.title, { color: colors.text }]}>
                    Fitness Tracker
                </Text>

                <Text style={[styles.subtitle, { color: colors.text }]}>
                    Track workouts, sets, and progress
                </Text>
            </View>

        </View>
    );
}

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center' 
    },

    card: {
        padding: 20,
        borderRadius: 16,
        width: "85%",
        alignItems: "center",

        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 4,
    },

    title: { 
        fontSize: 22, 
        fontWeight: '700',
        marginBottom: 8,
    },

    subtitle: {
        fontSize: 14,
        opacity: 0.7,
    },
});