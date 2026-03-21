import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Switch,
    TouchableOpacity,
    Platform,
} from 'react-native';
import * as Notifications from 'expo-notifications';
import { requestNotificationPermissions } from '../../services/notifications';
import { useTheme } from '../../constants/theme';

export default function NotificationsScreen() {
    const colors = useTheme();
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
            new Notification('Test Notification', {
                body: 'This is a test notification',
            });
            return;
        }

        await Notifications.scheduleNotificationAsync({
            content: {
                title: 'Test Notification',
                body: 'This is a test notification',
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                seconds: 5,
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
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Text style={[styles.header, { color: colors.text }]}>
                Notifications
            </Text>

            <View style={[styles.row, { backgroundColor: colors.card }]}>
                <Text style={[styles.label, { color: colors.text }]}>
                    Enable Notifications
                </Text>
                <Switch value={enabled} onValueChange={toggleNotifications} />
            </View>

            <TouchableOpacity
                style={[styles.testButton, { backgroundColor: colors.accent }]}
                onPress={sendTestNotification}
            >
                <Text style={styles.testButtonText}>
                    Send Test Notification
                </Text>
            </TouchableOpacity>

            {Platform.OS === 'web' ? (
                <Text style={[styles.message, { color: colors.text }]}>
                    Notifications work while this tab is open.
                </Text>
            ) : scheduled.length === 0 ? (
                <Text style={[styles.message, { color: colors.text }]}>
                    No scheduled notifications.
                </Text>
            ) : (
                scheduled.map((n, i) => (
                    <View
                        key={i}
                        style={[styles.notificationItem, { backgroundColor: colors.card }]}
                    >
                        <Text style={[styles.title, { color: colors.text }]}>
                            {n.content.title}
                        </Text>
                        <Text style={[styles.body, { color: colors.text }]}>
                            {n.content.body}
                        </Text>
                    </View>
                ))
            )}

            <TouchableOpacity
                style={[styles.clearButton, { backgroundColor: colors.accent }]}
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
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 60,
        paddingHorizontal: 20,
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
        padding: 12,
        borderRadius: 10,
    },
    label: {
        fontSize: 18,
    },
    message: {
        fontSize: 16,
        textAlign: 'center',
        marginTop: 20,
    },
    notificationItem: {
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
        marginTop: 4,
    },
    clearButton: {
        marginTop: 20,
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
    },
    testButton: {
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