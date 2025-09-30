// src/screens/HomeScreen.js
import React, { useState, useMemo } from "react";
import {
    View, Text, StyleSheet, TextInput, FlatList,
    TouchableOpacity, Image
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { ScrollView } from "react-native";

const STATUSES = [
    { key: "all", label: "Все" },
    { key: "pending", label: "Ожидает обработки" },
    { key: "assigned", label: "Назначен водитель" },
    { key: "canceled", label: "Отменен" },
    { key: "done", label: "Завершен" },
];

const MOCK = [
    {
        id: "1",
        status: "pending",
        from: "г. Черкесск, Ленина, 57В",
        to: "г. Минеральные воды, Ленина, 51К1",
        date: "2025-03-11T12:12:00+03:00",
        fromCoords: { lat: 44.2265, lng: 42.0461 },
        driver: { name: "Александр Александров", rating: 5.0, badge: "КВС", avatar: null },
        baggage: "2 чемодана и клетка 40x50",
        requirements: {
            pax: 3,
            vehicleType: "sedan",
            vehicleClass: "comfort",
            luggage: { items: 2, bulky: true },
            pets: true,
            childSeats: { total: 1, infant: 0, toddler: 1, booster: 0 },
            accessibility: { wheelchair: false },
            nonSmoking: true,
            airConditioner: true,
            languages: ["ru"],
            payment: "cash",
            notes: "Нужна машина на 2 места и питомца",
        },
    },
    {
        id: "2",
        status: "assigned",
        from: "г. Черкесск, Ленина, 57В",
        to: "г. Минеральные воды, Ленина, 51К1",
        date: "2025-03-11T12:12:00+03:00",
        fromCoords: { lat: 44.2365, lng: 42.0561 },
        driver: { name: "Александр Александров", rating: 5.0, badge: "КВС", avatar: null },
        baggage: "2 чемодана и клетка 40x50",
        requirements: {
            pax: 12,
            vehicleType: "minibus",
            vehicleClass: "economy",
            luggage: { items: 4, bulky: false },
            pets: false,
            childSeats: { total: 0, infant: 0, toddler: 0, booster: 0 },
            accessibility: { wheelchair: false },
            nonSmoking: true,
            airConditioner: true,
            languages: ["ru", "en"],
            payment: "invoice",
            notes: "",
        },
    },
];


export default function HomeScreen({ navigation }) {
    const insets = useSafeAreaInsets();
    const [query, setQuery] = useState("");
    const [active, setActive] = useState("all");

    const data = useMemo(() => {
        const base = active === "all" ? MOCK : MOCK.filter(o => o.status === active);
        if (!query.trim()) return base;
        const q = query.toLowerCase();
        return base.filter(o => o.from.toLowerCase().includes(q) || o.to.toLowerCase().includes(q));
    }, [active, query]);

    const renderCard = ({ item }) => (
        <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.navigate("OrderDetails", { order: item })}
            style={styles.card}
        >
            <View style={styles.cardHeader}>
                <View style={[
                    styles.statusPill,
                    item.status === "pending" && styles.pillYellow,
                    item.status === "assigned" && styles.pillBlue,
                    item.status === "canceled" && styles.pillRed,
                    item.status === "done" && styles.pillGreen,
                ]}>
                    <Text style={styles.pillText}>
                        {{
                            pending: "Ожидает обработки",
                            assigned: "Назначен водитель",
                            canceled: "Отменен",
                            done: "Завершен",
                        }[item.status] || "—"}
                    </Text>
                </View>
                <Ionicons name="ellipsis-vertical" size={18} color="#9AA4AD" />
            </View>

            <View style={{ gap: 8, marginTop: 8 }}>
                <View style={styles.row}>
                    <View style={[styles.dot, { backgroundColor: "#1A73E8" }]} />
                    <Text style={styles.addr}>{item.from}</Text>
                </View>
                <View style={styles.row}>
                    <View style={[styles.dot, { backgroundColor: "#0ABF53" }]} />
                    <Text style={styles.addr}>{item.to}</Text>
                </View>
            </View>

            <View style={[styles.row, { marginTop: 12 }]}>
                <Image source={{ uri: item.driver.avatar }} style={styles.avatar} />
                <Text style={styles.driverName}>{item.driver.name}  </Text>
                <Text style={styles.badge}>{item.driver.badge}</Text>
                <Ionicons name="star" size={14} color="#F5B000" style={{ marginLeft: 6 }} />
                <Text style={styles.rating}>{item.driver.rating.toFixed(1)}</Text>
            </View>

            <Text style={styles.sectionTitle}>Информация о багаже</Text>
            <View style={styles.noteBox}>
                <Text style={styles.noteText}>{item.baggage}</Text>
            </View>

            <Text style={styles.date}>{item.date ? new Date(item.date).toLocaleString("ru-RU", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}</Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.safe} edges={["top"]}>
            <View style={styles.container}>
                {/* НЕпрокручиваемая шапка */}
                <View style={[styles.header, { paddingTop: 8, paddingBottom: 8 }]}>
                    <View style={styles.searchBox}>
                        <Ionicons name="search-outline" size={18} color="#9AA4AD" />
                        <TextInput
                            placeholder="Поиск"
                            placeholderTextColor="#9AA4AD"
                            style={styles.searchInput}
                            value={query}
                            onChangeText={setQuery}
                        />
                    </View>

                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingRight: 16 }}
                        style={{ marginTop: 12 }}
                    >
                        {STATUSES.map((s) => {
                            const isActive = s.key === active;
                            return (
                                <TouchableOpacity
                                    key={s.key}
                                    onPress={() => setActive(s.key)}
                                    style={[styles.chip, isActive && styles.chipActive]}
                                >
                                    <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                                        {s.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>

                {/* Прокручивается только список */}
                <FlatList
                    data={data}
                    keyExtractor={(i) => i.id}
                    renderItem={renderCard}
                    showsVerticalScrollIndicator={false}
                    style={{ flex: 1 }}
                    contentContainerStyle={{
                        paddingHorizontal: 16,
                    }}
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: "#FFFFFF" },
    container: { flex: 1 },

    // Шапка (фиксированная)
    header: { paddingHorizontal: 16, backgroundColor: "#FFFFFF" },

    // Поиск
    searchBox: {
        flexDirection: "row", alignItems: "center",
        backgroundColor: "#F4F6FA", borderRadius: 12, paddingHorizontal: 12, height: 40,
        borderWidth: 1, borderColor: "#E6EAF0",
    },
    searchInput: { flex: 1, marginLeft: 8, paddingVertical: 0, color: "#0D1220" },

    // Чипы
    chipsRow: { flexDirection: "row", marginTop: 12 },
    chip: {
        paddingHorizontal: 12, height: 32, borderRadius: 16,
        borderWidth: 1, borderColor: "#E3E8EF", backgroundColor: "#FFFFFF",
        alignItems: "center", justifyContent: "center", marginRight: 8,
    },
    chipActive: { backgroundColor: "#0B0F10", borderColor: "#0B0F10" },
    chipText: { color: "#0B0F10" },
    chipTextActive: { color: "#FFFFFF", fontWeight: "700" },

    // Карточка
    card: {
        backgroundColor: "#FFFFFF", borderRadius: 16, padding: 12, marginBottom: 12,
        borderWidth: 1, borderColor: "#E6EAF0",
        shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2,
    },
    cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },

    statusPill: { paddingHorizontal: 10, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center" },
    pillYellow: { backgroundColor: "#FFD400" },
    pillBlue: { backgroundColor: "#2F6BFF" },
    pillRed: { backgroundColor: "#E53935" },
    pillGreen: { backgroundColor: "#43A047" },
    pillText: { fontSize: 12, fontWeight: "700", color: "#0D1220" },

    row: { flexDirection: "row", alignItems: "center" },
    dot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
    addr: { color: "#0D1220", flex: 1 },

    avatar: { width: 28, height: 28, borderRadius: 14, marginRight: 8 },
    driverName: { color: "#0D1220", fontWeight: "600" },
    badge: { color: "#2F6BFF", fontWeight: "700" },
    rating: { color: "#0D1220", marginLeft: 2 },

    sectionTitle: { marginTop: 12, color: "#8E98A3", fontSize: 12, fontWeight: "700" },
    noteBox: { backgroundColor: "#F1F3F6", minHeight: 36, borderRadius: 8, justifyContent: "center", paddingHorizontal: 10, marginTop: 6 },
    noteText: { color: "#656F7B" },

    date: { marginTop: 10, color: "#8E98A3", fontSize: 12 },
});
