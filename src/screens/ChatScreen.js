// src/screens/ChatScreen.js
import React, { useRef, useState } from "react";
import {
    View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
    KeyboardAvoidingView, Platform, Keyboard, TouchableWithoutFeedback
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

export default function ChatScreen({ route, navigation }) {
    const peer = route?.params?.peer ?? { title: "Чат", name: "Собеседник" };
    const title = peer?.title || peer?.name || "Чат";

    const [messages, setMessages] = useState([
        { id: "d1", type: "date", text: "Сегодня" },
        // можете подмешивать историю, когда подключите бекенд
    ]);
    const [text, setText] = useState("");
    const listRef = useRef(null);

    const send = () => {
        const value = text.trim();
        if (!value) return;
        const now = new Date();
        const hh = String(now.getHours()).padStart(2, "0");
        const mm = String(now.getMinutes()).padStart(2, "0");
        setMessages(prev => [...prev, { id: String(Math.random()), type: "out", text: value, time: `${hh}:${mm}` }]);
        setText("");
        requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
    };

    const renderItem = ({ item }) => {
        if (item.type === "date") {
            return (
                <View style={styles.dateWrap}>
                    <Text style={styles.dateText}>{item.text}</Text>
                </View>
            );
        }
        const isOut = item.type === "out";
        return (
            <View style={[styles.msgRow, isOut ? styles.rowOut : styles.rowIn]}>
                {!isOut && !!item.author && <Text style={styles.author}>{item.author}</Text>}
                <View style={[styles.bubble, isOut ? styles.bubbleOut : styles.bubbleIn]}>
                    <Text style={[styles.msgText, isOut && { color: "#fff" }]}>{item.text}</Text>
                </View>
                <Text style={[styles.time, isOut ? styles.timeOut : styles.timeIn]}>{item.time}</Text>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
            {/* простой заголовок без стрелок, потому что мы в стек-навигации и используем свою кнопку */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="chevron-back" size={24} color="#0D1220" />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
                <View style={{ width: 24 }} />
            </View>

            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
                <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                    <View style={{ flex: 1 }}>
                        <FlatList
                            ref={listRef}
                            data={messages}
                            keyExtractor={(i) => i.id}
                            renderItem={renderItem}
                            contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 }}
                            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
                            showsVerticalScrollIndicator={false}
                        />

                        {/* Панель ввода */}
                        <View style={styles.inputBar}>
                            <TouchableOpacity style={styles.circleBtn} activeOpacity={0.8}>
                                <Ionicons name="add" size={20} color="#fff" />
                            </TouchableOpacity>

                            <View style={styles.inputWrap}>
                                <TextInput
                                    value={text}
                                    onChangeText={setText}
                                    placeholder="Сообщение"
                                    placeholderTextColor="#9AA4AD"
                                    style={styles.input}
                                    multiline
                                />
                            </View>

                            <TouchableOpacity style={[styles.circleBtn, { backgroundColor: "#2F6BFF" }]} onPress={send} activeOpacity={0.8}>
                                <Ionicons name="arrow-up" size={18} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </SafeAreaView>
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
        justifyContent: "space-between",
    },
    headerTitle: { fontSize: 18, fontWeight: "700", color: "#0D1220", flex: 1, marginHorizontal: 8 },

    // дата по центру с фоном
    dateWrap: {
        alignSelf: "center",
        backgroundColor: "#F4F6FA",
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 4,
        marginVertical: 12,
    },
    dateText: { fontSize: 12, color: "#6E7781", fontWeight: "500" },

    msgRow: { paddingHorizontal: 8, marginTop: 8 },
    rowIn: { alignItems: "flex-start" },
    rowOut: { alignItems: "flex-end" },

    author: { marginLeft: 8, marginBottom: 4, color: "#6E7781", fontSize: 12 },

    bubble: {
        maxWidth: "80%",
        borderRadius: 12,
        paddingVertical: 10,
        paddingHorizontal: 12,
    },
    bubbleIn: { backgroundColor: "#F4F6FA", alignSelf: "flex-start", marginLeft: 8 },
    bubbleOut: { backgroundColor: "#2F6BFF", alignSelf: "flex-end", marginRight: 8 },

    msgText: { color: "#0D1220", fontSize: 15, lineHeight: 20 },

    time: { fontSize: 10, color: "#8E98A3", marginTop: 4 },
    timeIn: { marginLeft: 8, alignSelf: "flex-start" },
    timeOut: { marginRight: 8, alignSelf: "flex-end" },

    inputBar: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: "#E6EAF0",
        backgroundColor: "#FFFFFF",
    },
    circleBtn: {
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: "#1E90FF",
        alignItems: "center", justifyContent: "center",
    },
    inputWrap: {
        flex: 1, marginHorizontal: 8, backgroundColor: "#F4F6FA",
        borderRadius: 18, borderWidth: 1, borderColor: "#E6EAF0",
        minHeight: 36, maxHeight: 100, paddingHorizontal: 12, paddingVertical: 6, justifyContent: "center",
    },
    input: { color: "#0D1220", padding: 0, margin: 0, textAlignVertical: "center" },
});
