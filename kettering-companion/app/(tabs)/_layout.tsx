 import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { blue } from 'react-native-reanimated/lib/typescript/Colors';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  // name is for internal usage, title is for user view
  return (
    <Tabs
      screenOptions={{
          tabBarStyle: 
            {
                backgroundColor: isDark ? '#00008B' : '#0000FF', // Dark Blue / Blue
            },
            tabBarActiveTintColor: isDark ? '#B8860B' : '#FFD700', // Dark Gold / Gold
            tabBarInactiveTintColor: isDark ? '#555' : '#ccc',
            headerShown: false,
            tabBarButton: HapticTab,
            sceneStyle: 
            {
                backgroundColor: isDark ? '#000033' : '#E6F0FF', // Adjust for readability
            },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Logout',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="arrow.right.square" color={color} />,
        }}
      />
      <Tabs.Screen
              name="mainCalendar"
              options={{
                  title: 'Main Calendar',
                  tabBarIcon: ({ color }) => <IconSymbol size={28} name="calendar" color={color} />,
              }}
          />
      <Tabs.Screen
              name="maps"
              options={{
                  title: 'Maps',
                  tabBarIcon: ({ color }) => <IconSymbol size={28} name="map.fill" color={color} />,
              }}
          />
      <Tabs.Screen
        name="fitness"
        options={{
            title: 'Fitness',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="dumbbell.fill" color={color} />,
        }}
          />
      <Tabs.Screen
        name="events"
        options={{
            title: 'Events',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="sparkles" color={color} />,
        }}
      />
      <Tabs.Screen
        name="classes"
        options={{
            title: 'Classes',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="graduationcap.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
