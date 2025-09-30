// src/screens/SettingsScreen.js
import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

export default function SettingsScreen({ navigation }) {
    // мок-данные пользователя
    const [name, setName] = useState("ФИО диспетчера");
    const [phone, setPhone] = useState("+7 (000) 000 00 00");
    const [email, setEmail] = useState("example@gmail.com");

    const [showPwd, setShowPwd] = useState(false);
    const [pwdNow, setPwdNow] = useState("");
    const [pwd1, setPwd1] = useState("");
    const [pwd2, setPwd2] = useState("");
    const [secureNow, setSecureNow] = useState(true);
    const [secure1, setSecure1] = useState(true);
    const [secure2, setSecure2] = useState(true);

    const onSave = () => {
        if (showPwd) {
            if (!pwdNow || !pwd1 || !pwd2) {
                Alert.alert("Ошибка", "Заполните все поля паролей");
                return;
            }
            if (pwd1 !== pwd2) {
                Alert.alert("Ошибка", "Новый пароль не совпадает");
                return;
            }
        }

        // тут потом можно вызвать API для сохранения

        Alert.alert("Сохранено", "Настройки профиля обновлены", [
            {
                text: "OK",
                onPress: () => {
                    if (navigation?.canGoBack()) {
                        navigation.goBack();
                    } else {
                        navigation.navigate("Tabs", { screen: "Profile" });
                    }
                },
            },
        ]);
    };


    return (
        <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
            {/* шапка c кнопкой назад */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() =>
                        navigation?.canGoBack()
                            ? navigation.goBack()
                            : navigation.navigate("Tabs", { screen: "Profile" })
                    }
                >
                    <Ionicons name="chevron-back" size={26} color="#0D1220" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Настройки</Text>
                <View style={{ width: 26 }} />
            </View>

            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
                <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                    {/* Блок-«карта» как на макете */}
                    <View style={styles.card}>
                        {/* Аватар и кнопка */}
                        <Ionicons name="person-circle-outline" size={96} color="#B9C1CA" style={{ alignSelf: "center" }} />
                        <TouchableOpacity activeOpacity={0.8} style={styles.avatarBtn} onPress={() => Alert.alert("Сменить аватар")}>
                            <Text style={styles.avatarBtnText}>Сменить аватар</Text>
                        </TouchableOpacity>

                        {/* Поля */}
                        <Text style={styles.label}>ФИО</Text>
                        <View style={styles.inputWrap}>
                            <TextInput value={name} onChangeText={setName} style={styles.input} />
                        </View>

                        <Text style={[styles.label, { marginTop: 14 }]}>НОМЕР ТЕЛЕФОНА</Text>
                        <View style={styles.inputWrap}>
                            <TextInput value={phone} onChangeText={setPhone} style={styles.input} keyboardType="phone-pad" />
                        </View>

                        <Text style={[styles.label, { marginTop: 14 }]}>EMAIL</Text>
                        <View style={styles.inputWrap}>
                            <TextInput value={email} onChangeText={setEmail} style={styles.input} keyboardType="email-address" autoCapitalize="none" />
                        </View>

                        <Text style={[styles.label, { marginTop: 14 }]}>ПАРОЛЬ</Text>
                        <View style={styles.inputWrap}>
                            <TextInput
                                value={"••••••••"}
                                editable={false}
                                style={[styles.input, { color: "#6E7781" }]}
                            />
                            <Ionicons name="eye-off-outline" size={20} color="#9AA4AD" />
                        </View>

                        <TouchableOpacity onPress={() => setShowPwd((s) => !s)} activeOpacity={0.8}>
                            <Text style={styles.link}>{showPwd ? "Скрыть смену пароля" : "Сменить пароль"}</Text>
                        </TouchableOpacity>

                        {/* Блок смены пароля */}
                        {showPwd && (
                            <View style={{ marginTop: 6 }}>
                                <Text style={styles.labelSmall}>НЫНЕШНИЙ ПАРОЛЬ</Text>
                                <View style={styles.inputWrap}>
                                    <TextInput
                                        value={pwdNow}
                                        onChangeText={setPwdNow}
                                        style={styles.input}
                                        secureTextEntry={secureNow}
                                        autoCapitalize="none"
                                    />
                                    <TouchableOpacity onPress={() => setSecureNow((s) => !s)}>
                                        <Ionicons name={secureNow ? "eye-outline" : "eye-off-outline"} size={20} color="#9AA4AD" />
                                    </TouchableOpacity>
                                </View>

                                <Text style={[styles.labelSmall, { marginTop: 12 }]}>НОВЫЙ ПАРОЛЬ</Text>
                                <View style={styles.inputWrap}>
                                    <TextInput
                                        value={pwd1}
                                        onChangeText={setPwd1}
                                        style={styles.input}
                                        secureTextEntry={secure1}
                                        autoCapitalize="none"
                                    />
                                    <TouchableOpacity onPress={() => setSecure1((s) => !s)}>
                                        <Ionicons name={secure1 ? "eye-outline" : "eye-off-outline"} size={20} color="#9AA4AD" />
                                    </TouchableOpacity>
                                </View>

                                <Text style={[styles.labelSmall, { marginTop: 12 }]}>ПОВТОРИТЕ НОВЫЙ ПАРОЛЬ</Text>
                                <View style={styles.inputWrap}>
                                    <TextInput
                                        value={pwd2}
                                        onChangeText={setPwd2}
                                        style={styles.input}
                                        secureTextEntry={secure2}
                                        autoCapitalize="none"
                                    />
                                    <TouchableOpacity onPress={() => setSecure2((s) => !s)}>
                                        <Ionicons name={secure2 ? "eye-outline" : "eye-off-outline"} size={20} color="#9AA4AD" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </View>
                </ScrollView>

                {/* Кнопка сохранить */}
                <View style={styles.footer}>
                    <TouchableOpacity style={styles.saveBtn} onPress={onSave} activeOpacity={0.9}>
                        <Text style={styles.saveText}>Сохранить</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView >
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: "#FFFFFF" },
    header: {
        height: 48,
        paddingHorizontal: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: "#E6EAF0",
        flexDirection: "row",
        alignItems: "center",
    },
    headerTitle: { fontSize: 20, fontWeight: "800", color: "#0D1220", marginLeft: 12 },

    scroll: { padding: 16, paddingBottom: 20 },

    avatarBtn: {
        alignSelf: "stretch",
        height: 44,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#B9C7FF",
        alignItems: "center",
        justifyContent: "center",
        marginTop: 10,
        marginBottom: 8,
    },
    avatarBtnText: { color: "#2F6BFF", fontWeight: "700" },

    label: { color: "#8E98A3", fontSize: 12, fontWeight: "700", marginTop: 8, marginBottom: 6 },
    labelSmall: { color: "#8E98A3", fontSize: 11, fontWeight: "700", marginTop: 6, marginBottom: 6 },

    inputWrap: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F4F6FA",
        borderRadius: 12,
        paddingHorizontal: 14,
        height: 48,
        borderWidth: 1,
        borderColor: "#E6EAF0",
    },
    input: { flex: 1, color: "#0D1220", paddingVertical: 0 },

    link: { color: "#2F6BFF", fontWeight: "700", marginTop: 20 },

    footer: { padding: 16, backgroundColor: "#FFFFFF" },
    saveBtn: {
        backgroundColor: "#2F6BFF",
        height: 56,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
    },
    saveText: { color: "#FFFFFF", fontSize: 18, fontWeight: "700" },
});
