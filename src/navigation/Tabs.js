// src/navigation/Tabs.js
import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import AirlineHomeScreen from "../screens/AirlineHomeScreen";
import OrdersHistoryScreen from "../screens/OrdersHistoryScreen";
import SupportScreen from "../screens/SupportScreen";
import ProfileScreen from "../screens/ProfileScreen";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const Tab = createBottomTabNavigator();

export default function Tabs() {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#2F6BFF",
        tabBarInactiveTintColor: "#8892A0",
        tabBarStyle: { height: 56 + Math.max(insets.bottom, 0), paddingBottom: Math.max(insets.bottom, 6), paddingTop: 6 },
        tabBarIcon: ({ color, size, focused }) => {
          const map = {
            Home: focused ? "home" : "home-outline",
            History: focused ? "time" : "time-outline",
            Support: focused ? "chatbubbles" : "chatbubbles-outline",
            Profile: focused ? "person" : "person-outline",
          };
          return <Ionicons name={map[route.name]} size={22} color={color} />;
        },
        tabBarLabelStyle: { fontSize: 12 },
      })}
    >
      <Tab.Screen name="Home" component={AirlineHomeScreen} options={{ title: "Главная" }} />
      <Tab.Screen name="History" component={OrdersHistoryScreen} options={{ title: "История" }} />
      <Tab.Screen name="Support" component={SupportScreen} options={{ title: "Поддержка" }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: "Профиль" }} />
    </Tab.Navigator>
  );
}
