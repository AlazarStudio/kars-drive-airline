import React, { useMemo, useState, useCallback } from "react";
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

const STATUS_TABS = [
    { key: "all", label: "Все" },
    { key: "finished", label: "Завершённые" },
    { key: "cancelled", label: "Отменённые" },
    { key: "assigned", label: "Назначен водитель" },
    { key: "pending", label: "Новые" },
];

const statusPill = (s) => {
    switch (s) {
        case "finished": return { text: "Завершена", bg: "#E8F7EF", brd: "#CBEBD7", color: "#1B9E55" };
        case "cancelled": return { text: "Отменена", bg: "#FDEEEF", brd: "#F6CDD0", color: "#E53935" };
        case "assigned": return { text: "Водитель назначен", bg: "#EEF6FF", brd: "#CFE1FF", color: "#2F6BFF" };
        case "pending": return { text: "Новая", bg: "#FFF7E6", brd: "#FFE2B8", color: "#B36B00" };
        default: return { text: s, bg: "#F4F6FA", brd: "#E6EAF0", color: "#0D1220" };
    }
};

const fmtDateTime = (iso) =>
    new Date(iso).toLocaleString("ru-RU", { day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit" });

/** Пример моков — замени на загрузку из API при необходимости */
const MOCK = [
    {
        id: "52134",
        status: "finished",
        from: "Минеральные Воды (а/п), терминал B",
        to: "Черкесск, Ленина, 57В",
        date: "2025-03-05T14:40:00+03:00",
        fromCoords: { lat: 44.2265, lng: 42.0461 },
        toCoords: { lat: 44.2091, lng: 42.0487 },
        employees: [
            { id: "e1", name: "Иван Петров" },
            { id: "e2", name: "Светлана К." },
        ],
        requirements: { pax: 2, vehicleGroup: "1-4", notes: "" },
        timeline: {
            createdAt: "2025-03-05T12:55:00+03:00",
            assignedAt: "2025-03-05T13:05:00+03:00",
            arrivedAtPickup: "2025-03-05T14:25:00+03:00",
            departedAt: "2025-03-05T14:33:00+03:00",
            arrivedAtDropoff: "2025-03-05T15:40:00+03:00",
            finishedAt: "2025-03-05T15:45:00+03:00",
            travelTimeSec: 67 * 60,
        },
        ratings: { driver: 5, passenger: 5 },
    },
    {
        id: "52135",
        status: "cancelled",
        from: "Черкесск, Заводская, 1",
        to: "Минеральные Воды, Промышленная, 3",
        date: "2025-03-06T09:30:00+03:00",
        fromCoords: { lat: 44.2265, lng: 42.0461 },
        toCoords: { lat: 44.2091, lng: 42.0487 },
        employees: [{ id: "e3", name: "Андрей Ш." }],
        requirements: { pax: 1, vehicleGroup: "1-4", notes: "перенос на завтра" },
        timeline: { createdAt: "2025-03-06T08:10:00+03:00", finishedAt: null },
        ratings: { driver: null, passenger: null },
    },
    {
        id: "52136",
        status: "assigned",
        from: "Черкесск, Лермонтова, 10",
        to: "Карачаевск, Мира, 2",
        date: "2025-03-07T11:00:00+03:00",
        employees: [{ id: "e4", name: "Ольга Н." }, { id: "e5", name: "Федор П." }, { id: "e6", name: "Лев С." }],
        requirements: { pax: 3, vehicleGroup: "1-4", notes: "" },
        timeline: { createdAt: "2025-03-07T09:02:00+03:00", assignedAt: "2025-03-07T09:18:00+03:00" },
    },
    {
        id: "52137",
        status: "pending",
        from: "Невинномысск, Центральная, 5",
        to: "Минеральные Воды (а/п)",
        date: "2025-03-08T19:45:00+03:00",
        employees: [{ id: "e7", name: "Кирилл Г." }],
        requirements: { pax: 1, vehicleGroup: "1-4", notes: "" },
        timeline: { createdAt: "2025-03-08T18:11:00+03:00" },
    },
];

export default function OrdersHistoryScreen() {
    const navigation = useNavigation();
    const [q, setQ] = useState("");
    const [tab, setTab] = useState("all");
    const [refreshing, setRefreshing] = useState(false);
    const [data, setData] = useState(MOCK);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        // имитация обновления
        setTimeout(() => setRefreshing(false), 700);
    }, []);

    const filtered = useMemo(() => {
        const ql = q.trim().toLowerCase();
        return data.filter((o) => {
            const okStatus = tab === "all" ? true : o.status === tab;
            if (!okStatus) return false;
            if (!ql) return true;
            // поиск по id, из/в, сотрудникам
            const inText =
                o.id.includes(ql) ||
                o.from.toLowerCase().includes(ql) ||
                o.to.toLowerCase().includes(ql) ||
                (o.employees || []).some((e) => e.name.toLowerCase().includes(ql));
            return inText;
        });
    }, [q, tab, data]);

    const openDetails = (order) => {
        navigation.navigate("HistoryDetails", { order });
    };

    const renderItem = ({ item }) => {
        const pill = statusPill(item.status);
        return (
            <TouchableOpacity style={s.card} onPress={() => openDetails(item)} activeOpacity={0.9}>
                <View style={s.rowBetween}>
                    <Text style={s.idText}>#{item.id}</Text>
                    <View style={[s.pill, { backgroundColor: pill.bg, borderColor: pill.brd }]}>
                        <Text style={[s.pillText, { color: pill.color }]}>{pill.text}</Text>
                    </View>
                </View>

                <View style={{ marginTop: 8 }}>
                    <View style={s.routeRow}>
                        <Ionicons name="radio-button-on" size={14} color="#1B9E55" />
                        <Text style={s.routeText} numberOfLines={1}>{item.from}</Text>
                    </View>
                    <View style={s.routeDivider} />
                    <View style={s.routeRow}>
                        <Ionicons name="location" size={14} color="#E53935" />
                        <Text style={s.routeText} numberOfLines={1}>{item.to}</Text>
                    </View>
                </View>

                <View style={[s.rowBetween, { marginTop: 10 }]}>
                    <View style={s.metaRow}>
                        <Ionicons name="calendar-outline" size={16} color="#6E7781" />
                        <Text style={s.metaText}>{fmtDateTime(item.date)}</Text>
                    </View>
                    <View style={s.metaRow}>
                        <Ionicons name="people-outline" size={16} color="#6E7781" />
                        <Text style={s.metaText}>{(item.employees || []).length}</Text>
                    </View>
                    <View style={s.metaRow}>
                        <Ionicons name="car-outline" size={16} color="#6E7781" />
                        <Text style={s.metaText}>{item.requirements?.vehicleGroup || "—"}</Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const Header = (
        <View>
            {/* Поиск */}
            <View style={s.searchRow}>
                <Ionicons name="search" size={16} color="#6E7781" />
                <TextInput
                    value={q}
                    onChangeText={setQ}
                    placeholder="Поиск по №, адресу или сотруднику"
                    placeholderTextColor="#9AA4AD"
                    style={s.searchInput}
                    returnKeyType="search"
                />
                {!!q && (
                    <TouchableOpacity onPress={() => setQ("")}>
                        <Ionicons name="close-circle" size={18} color="#9AA4AD" />
                    </TouchableOpacity>
                )}
            </View>

            {/* Табы статусов */}
            <View style={s.tabsWrap}>
                <FlatList
                    data={STATUS_TABS}
                    keyExtractor={(i) => i.key}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingRight: 8 }}
                    renderItem={({ item }) => {
                        const on = tab === item.key;
                        return (
                            <TouchableOpacity
                                onPress={() => setTab(item.key)}
                                style={[s.tabBtn, on && s.tabOn]}
                                activeOpacity={0.9}
                            >
                                <Text style={[s.tabText, on && s.tabTextOn]}>{item.label}</Text>
                            </TouchableOpacity>
                        );
                    }}
                />
            </View>
        </View>
    );

    return (
        <SafeAreaView style={s.safe} edges={["top"]}>
            <View style={s.header}>
                <Text style={s.headerTitle}>История заявок</Text>
                <View style={{ width: 24 }} />
            </View>

            <FlatList
                data={filtered}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
                ListHeaderComponent={Header}
                ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            />
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: "#fff" },
    header: {
        height: 48, paddingHorizontal: 16,
        borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#E6EAF0",
        flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    },
    headerTitle: { fontSize: 18, fontWeight: "700", color: "#0D1220" },

    searchRow: {
        height: 44, borderRadius: 12, borderWidth: 1, borderColor: "#E6EAF0",
        backgroundColor: "#F4F6FA",
        paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 8,
    },
    searchInput: { flex: 1, color: "#0D1220", padding: 0, paddingVertical: 0 },

    tabsWrap: { marginTop: 10, marginBottom: 8 },
    tabBtn: {
        height: 36, paddingHorizontal: 12, marginRight: 8,
        borderRadius: 10, borderWidth: 1, borderColor: "#E6EAF0",
        backgroundColor: "#F4F6FA", alignItems: "center", justifyContent: "center",
    },
    tabOn: { backgroundColor: "#2F6BFF20", borderColor: "#B9C7FF" },
    tabText: { color: "#0D1220" },
    tabTextOn: { color: "#2F6BFF", fontWeight: "700" },

    card: {
        borderRadius: 14, backgroundColor: "#fff",
        borderWidth: 1, borderColor: "#E6EAF0",
        padding: 12,
    },
    idText: { fontWeight: "700", color: "#0D1220" },
    pill: { borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
    pillText: { fontSize: 12, fontWeight: "700" },

    routeRow: { flexDirection: "row", alignItems: "center", gap: 6 },
    routeText: { color: "#0D1220", flexShrink: 1 },
    routeDivider: { height: 10, width: 1, marginLeft: 6, backgroundColor: "transparent" },

    rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    metaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
    metaText: { color: "#6E7781" },
});
