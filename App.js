// App.js
import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, Keyboard,
  TouchableWithoutFeedback, ScrollView
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// импорт главного экрана
import Tabs from "./src/navigation/Tabs";
import SettingsScreen from "./src/screens/SettingsScreen";
import OrderDetailsScreen from "./src/screens/OrderDetailsScreen";
import DriverPickerScreen from "./src/screens/DriverPickerScreen";
import ChatScreen from "./src/screens/ChatScreen";

// ---------- Логин ----------
function LoginScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [secure, setSecure] = useState(true);
  const canSubmit = login.trim() && password.trim();

  const onSubmit = () => {
    // if (!canSubmit) {
    //   Alert.alert("Заполните поля", "Укажите логин и пароль");
    //   return;
    // }
    // TODO: здесь будет запрос на сервер
    // После успеха — переход на MainScreen
    navigation.replace("Tabs");
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={[
              styles.container,
              {
                paddingTop: Math.max(insets.top, 16),
                paddingBottom: Math.max(insets.bottom, 16),
              },
            ]}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.logo}>
              <Text style={styles.logoText}>logo</Text>
            </View>

            <Text style={styles.title}>Войти</Text>

            <Text style={[styles.label, { marginLeft: 11 }]}>ЛОГИН</Text>
            <View style={styles.inputWrap}>
              <TextInput
                placeholder="email или телефон"
                placeholderTextColor="#9AA4AD"
                value={login}
                onChangeText={setLogin}
                style={styles.input}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <Text style={[styles.label, { marginTop: 14, marginLeft: 11 }]}>ПАРОЛЬ</Text>
            <View style={styles.inputWrap}>
              <TextInput
                placeholder="Введите пароль"
                placeholderTextColor="#9AA4AD"
                value={password}
                onChangeText={setPassword}
                style={styles.input}
                secureTextEntry={secure}
                autoCapitalize="none"
                onSubmitEditing={onSubmit}
              />
              <TouchableOpacity onPress={() => setSecure((s) => !s)} hitSlop={10}>
                <Ionicons name={secure ? "eye-outline" : "eye-off-outline"} size={22} color="#7C8691" />
              </TouchableOpacity>
            </View>

            <View style={styles.resetRow}>
              <Text style={styles.resetText}>Не помните пароль от аккаунта?</Text>
              <TouchableOpacity>
                <Text style={styles.resetLink}>Восстановить</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.button,
                { marginTop: "auto" },
                // !canSubmit && { opacity: 0.6 },
              ]}
              onPress={onSubmit}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>Войти</Text>
            </TouchableOpacity>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ---------- Навигация ----------
const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Tabs" component={Tabs} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="OrderDetails" component={OrderDetailsScreen} />
          <Stack.Screen name="DriverPicker" component={DriverPickerScreen} />
          <Stack.Screen name="Chat" component={ChatScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

// ---------- Стили ----------
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FFFFFF" },
  container: { flexGrow: 1, paddingHorizontal: 20 },

  logo: {
    width: 88, height: 88, borderRadius: 44, alignSelf: "center",
    backgroundColor: "#F1F3F6", alignItems: "center", justifyContent: "center",
    marginTop: 12, marginBottom: 24,
  },
  logoText: { color: "#8E98A3" },

  title: { fontSize: 26, fontWeight: "800", textAlign: "center", marginBottom: 8, color: "#0D1220" },

  label: { marginTop: 14, marginBottom: 6, color: "#8E98A3", fontSize: 12, fontWeight: "700", letterSpacing: 0.6 },

  inputWrap: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#F4F6FA", borderRadius: 12, paddingHorizontal: 14, height: 48,
    borderWidth: 1, borderColor: "#E6EAF0",
  },
  input: { flex: 1, color: "#0D1220", paddingVertical: 0 },

  resetRow: { flexDirection: "row", alignItems: "center", marginTop: 10, gap: 6 },
  resetText: { color: "#6E7781" },
  resetLink: { color: "#2F6BFF", fontWeight: "600" },

  button: {
    backgroundColor: "#2F6BFF", height: 56, borderRadius: 16,
    alignItems: "center", justifyContent: "center",
  },
  buttonText: { color: "#FFFFFF", fontSize: 18, fontWeight: "700" },
});
