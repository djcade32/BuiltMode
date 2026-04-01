import { Redirect, Tabs } from "expo-router";
import React from "react";

import { HapticTab } from "@/components/haptic-tab";
import { Colors } from "@/constants/theme";
import { useUserStore } from "@/stores/user-store";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";

export default function TabLayout() {
  const { user, isUserHydrated } = useUserStore();

  if (!isUserHydrated) {
    return null;
  }

  if (!user) {
    return <Redirect href={"/(protected)/(onboarding)/welcome"} />;
  }
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.accent.primary,
        tabBarInactiveTintColor: Colors.icon,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          paddingTop: 7,
          backgroundColor: Colors.background.secondary,
          height: 70,
        },
        animation: "none",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <MaterialIcons name="home" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="feed"
        options={{
          title: "Feed",
          tabBarIcon: ({ color }) => <MaterialIcons name="rss-feed" size={24} color={color} />,
        }}
      />

      <Tabs.Screen
        name="(workout)"
        options={{
          title: "Log",
          tabBarIcon: ({ color }) => <MaterialIcons name="add-circle" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => <Ionicons name="person" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
