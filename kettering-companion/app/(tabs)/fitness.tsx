import { View, Text, StyleSheet } from 'react-native';

export default function WorkoutScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Fitness Tracker</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    title: { fontSize: 20, fontWeight: 'bold' },
});
