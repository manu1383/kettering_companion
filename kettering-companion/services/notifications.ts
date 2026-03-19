import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export type CalendarEvent = {
    id: string;
    title: string;
    startDate: Date;
    endDate: Date;
    allDay?: boolean;
};

export async function requestNotificationPermissions() {
    if (Platform.OS === 'web') {
        if (!('Notification' in window)) {
            alert('Browser does not support notifications.');
            return false;
        }

        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }

    const { status } = await Notifications.requestPermissionsAsync();

    if (status !== 'granted') {
        alert('Notification permissions are required.');
        return false;
    }

    return true;
}

export async function scheduleEventNotification(event: CalendarEvent) {
    const eventTime = new Date(event.startDate);
    const notifyTime = new Date(eventTime.getTime() - 30 * 60 * 1000);

    if (notifyTime <= new Date()) return;

    if (Platform.OS === 'web') {
        const delay = notifyTime.getTime() - Date.now();

        setTimeout(() => {
            new Notification(`Upcoming Event: ${event.title}`, {
                body: `Starts at ${eventTime.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                })}`,
            });
        }, delay);

        return;
    }

    await Notifications.scheduleNotificationAsync({
        content: {
            title: `Upcoming Event: ${event.title}`,
            body: `Starts at ${eventTime.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
            })}`,
        },
        trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: notifyTime,
        },
    });
}