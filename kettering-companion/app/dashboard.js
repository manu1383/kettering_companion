import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function Dashboard() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Dashboard</Text>
            <Text>Welcome!</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'},
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 20,
    },
});