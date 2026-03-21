import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from "../../constants/theme";

export default function Notifications() {
    const colors = useTheme();

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            
            <View style={[styles.card, { backgroundColor: colors.card }]}>
                
                <Text style={[styles.header, { color: colors.text }]}>
                    Notifications
                </Text>

                <Text style={[styles.message, { color: colors.text }]}>
                    No new notifications.
                </Text>

                <Text style={[styles.info, { color: colors.text }]}>
                    You will receive notifications 30 minutes before each event.
                </Text>

            </View>

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    card: {
        padding: 24,
        borderRadius: 16,
        width: "85%",
        alignItems: "center",

        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 4,
    },

    header: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 16,
    },

    message: {
        fontSize: 18,
        marginBottom: 10,
    },

    info: {
        fontSize: 16,
        textAlign: 'center',
        paddingHorizontal: 20,
        opacity: 0.7,
    },
});