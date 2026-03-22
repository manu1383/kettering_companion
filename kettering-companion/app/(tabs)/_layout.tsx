import { Tabs } from 'expo-router';
import {
  Bell,
  Calendar,
  Dumbbell,
  GraduationCap,
  LogOut,
  Map,
  Sparkles
} from 'lucide-react-native';
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
            tabBarIcon: ({ color }) => <Calendar size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="maps"
        options={{
            title: 'Maps',
            tabBarIcon: ({ color }) => <Map size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="fitness"
        options={{
            title: 'Fitness',
            tabBarIcon: ({ color }) => <Dumbbell size={28} color={color} />,
        }}
          />
      <Tabs.Screen
        name="clubs"
        options={{
            title: 'Clubs',
            tabBarIcon: ({ color }) => <Sparkles size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
            title: 'Events',
            tabBarIcon: ({ color }) => <GraduationCap size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
            title: 'Notifications',
            tabBarIcon: ({ color }) => <Bell size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: 'Logout',
          tabBarIcon: ({ color }) => <LogOut size={28} color={color} />,
        }}
      />
    </Tabs>
  );
}
