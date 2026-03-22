import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { useTheme } from "../../constants/theme";
import { requestNotificationPermissions } from '../../services/notifications';

export default function TabLayout() {
  const colors = useTheme();

  React.useEffect(() => {
    // Request notification permissions on app load
    requestNotificationPermissions();
  }, []);

  // name is for internal usage, title is for user view
  return (
    <Tabs
          screenOptions={{
              headerShown: false,
              tabBarStyle: {
                  backgroundColor: colors.background,
              },
              tabBarActiveTintColor: colors.tabIconSelected,
              tabBarInactiveTintColor: colors.tabIconDefault,
          }}
      >
      <Tabs.Screen
              name="mainCalendar"
              options={{
                  title: 'Main Calendar',
                  tabBarIcon: ({ color }) => <Ionicons name="calendar" size={28} color={color} />,
              }}
          />
      <Tabs.Screen
              name="maps"
              options={{
                  title: 'Maps',
                  tabBarIcon: ({ color }) => <Ionicons name="map" size={28} color={color} />,
              }}
          />
      <Tabs.Screen
        name="fitness"
        options={{
            title: 'Fitness',
            tabBarIcon: ({ color }) => <Ionicons name="barbell" size={28} color={color} />,
        }}
          />
      <Tabs.Screen
        name="clubs"
        options={{
            title: 'Clubs',
            tabBarIcon: ({ color }) => <Ionicons name="sparkles" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
            title: 'Events',
            tabBarIcon: ({ color }) => <Ionicons name="school" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
            title: 'Notifications',
            tabBarIcon: ({ color }) => <Ionicons name="notifications" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: 'Logout',
          tabBarIcon: ({ color }) => <Ionicons name="log-out" size={28}color={color} />,
        }}
      />
    </Tabs>
  );
}
