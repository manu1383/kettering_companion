import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function Notifications() {
    return (
        <View style={styles.container}>
            <Text style={styles.header}>Notifications</Text>
            <Text style={styles.message}>No new notifications.</Text>

            <Text style={styles.info}>
                You will recieve notifications 30 minutes before each event.
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#E6F0FF',
    },
    header: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    message: {
        fontSize: 18,
        color: '#555',
        marginBottom: 10,
    },
    info: {
        fontSize: 16,
        textAlign: 'center',
        paddingHorizontal: 40,
    },
});