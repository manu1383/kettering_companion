 import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { blue } from 'react-native-reanimated/lib/typescript/Colors';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
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
