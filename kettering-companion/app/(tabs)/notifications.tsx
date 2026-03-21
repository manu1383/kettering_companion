import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { requestNotificationPermissions } from '../../services/notifications';

export default function NotificationsScreen() {
    const [scheduled, setScheduled] = useState<any[]>([]);
    const [enabled, setEnabled] = useState(true);

    const loadNotifications = async () => {
        if (Platform.OS === 'web') {
            setScheduled([]);
            return;
        }

        const notifs = await Notifications.getAllScheduledNotificationsAsync();
        setScheduled(notifs);
    };

    const sendTestNotification = async () => {
    if (Platform.OS === 'web') {
        new Notification("Test Notification", {
            body: "This is a test notification",
        });
        return;
    }

    await Notifications.scheduleNotificationAsync({
        content: {
            title: "Test Notification",
            body: "This is a test notification",
        },
        trigger: { 
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: 5 
        },
    });
};
    
    useEffect(() => {
        async function init() {
            const granted = await requestNotificationPermissions();
            if (!granted) {
                setEnabled(false);
                return;
            }
            loadNotifications();
        }

        init();
    }, []);

    const toggleNotifications = async (value: boolean) => {
        setEnabled(value);

        if (!value) {
            if (Platform.OS !== 'web') {
                await Notifications.cancelAllScheduledNotificationsAsync();
            }
            setScheduled([]);
        } else {
            loadNotifications();
        }
    };

    const clearAllNotifications = async () => {
        if (Platform.OS !== 'web') {
            await Notifications.cancelAllScheduledNotificationsAsync();
        }
        setScheduled([]);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Notifications</Text>

            <View style={styles.row}>
                <Text style={styles.label}>Enable Notifications</Text>
                <Switch value={enabled} onValueChange={toggleNotifications} />
            </View>
            
            <TouchableOpacity
                style={styles.testButton}
                onPress={sendTestNotification}
            >
                <Text style={styles.testButtonText}>
                    Send Test Notification
                </Text>
            </TouchableOpacity>

            {Platform.OS === 'web' ? (
                <Text style={styles.message}>
                    Notifications work while this tab is open.
                </Text>
            ) : scheduled.length === 0 ? (
                <Text style={styles.message}>No scheduled notifications.</Text>
            ) : (
                scheduled.map((n, i) => (
                    <View key={i} style={styles.notificationItem}>
                        <Text style={styles.title}>
                            {n.content.title}
                        </Text>
                        <Text style={styles.body}>
                            {n.content.body}
                        </Text>
                    </View>
                ))
            )}

            <TouchableOpacity
                style={styles.clearButton}
                onPress={clearAllNotifications}
            >
                <Text style={styles.clearButtonText}>
                    Clear All Notifications
                </Text>
            </TouchableOpacity>

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
        paddingTop: 60,
        paddingHorizontal: 20,
        backgroundColor: '#E6F0FF',
    },

    header: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    label: {
        fontSize: 18,
    },
    message: {
        fontSize: 16,
        color: '#555',
        textAlign: 'center',
        marginTop: 20,
    },
    notificationItem: {
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 8,
        marginBottom: 10,
        elevation: 2,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
    },
    body: {
        fontSize: 14,
        color: '#555',
    },
    clearButton: {
        marginTop: 20,
        backgroundColor: '#007AFF',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    clearButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },

    info: {
        marginTop: 20,
        fontSize: 14,
        textAlign: 'center',
        color: '#444',
    },
        testButton: {
        backgroundColor: '#34C759',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 15,
    },
    testButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});