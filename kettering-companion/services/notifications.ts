import * as Notifications from 'expo-notifications';

export async function requestNotificationPermissions() {
    const { status } = await Notifications.requestPermissionsAsync();
    
    if (status !== 'granted') {
        alert('Notification permissions are required for event reminders.');
        return false;
    }
    
    return true;
}

export async function scheduleEventNotification(event) {
    const eventTime = new Date(event.startDate);
    const notifyTime = new Date(eventTime.getTime() - 30 * 60 * 1000);

    await Notifications.scheduleNotificationAsync({
        content: {
            title: `Upcoming Event: ${event.title}`,
            body: `Starts at ${eventTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        },
        trigger: notifyTime,
    });
}