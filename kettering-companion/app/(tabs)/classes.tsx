import { View, Text, StyleSheet } from 'react-native';

export default function ClassesScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}> Courses</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    title: { fontSize: 20, fontWeight: 'bold' },
});
