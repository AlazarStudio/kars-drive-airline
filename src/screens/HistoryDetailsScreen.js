import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";

const fmt = (iso) => iso ? new Date(iso).toLocaleString("ru-RU", {
    day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
}) : "—";

function Row({ label, value }) {
    return (
        <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 }}>
            <Text style={{ color: "#6E7781" }}>{label}</Text>
            <Text style={{ color: "#0D1220", fontWeight: "700", marginLeft: 12 }}>{value || "—"}</Text>
        </View>
    );
}

export default function HistoryDetailsScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const order = route.params?.order;

    if (!order) {
        return (
            <SafeAreaView style={s.safe} edges={["top"]}>
                <View style={s.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="chevron-back" size={22} color="#0D1220" /></TouchableOpacity>
                    <Text style={s.headerTitle}>Заявка</Text>
                    <View style={{ width: 24 }} />
                </View>
                <View style={{ padding: 16 }}>
                    <Text>Данные не переданы</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={s.safe} edges={["top"]}>
            <View style={s.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="chevron-back" size={22} color="#0D1220" /></TouchableOpacity>
                <Text style={s.headerTitle}>Заявка #{order.id}</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
                <Text style={s.sectionTitle}>Маршрут</Text>
                <View style={s.card}>
                    <Row label="Откуда" value={order.from} />
                    <Row label="Куда" value={order.to} />
                    <Row label="Когда" value={fmt(order.date)} />
                </View>

                <Text style={s.sectionTitle}>Сотрудники ({order.employees?.length || 0})</Text>
                <View style={s.card}>
                    {(order.employees || []).map((e) => (
                        <View key={e.id} style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 6 }}>
                            <Ionicons name="person-circle-outline" size={20} color="#6E7781" />
                            <Text style={{ color: "#0D1220", flex: 1 }}>{e.name}{e.dept ? ` • ${e.dept}` : ""}</Text>
                        </View>
                    ))}
                </View>

                <Text style={s.sectionTitle}>Параметры</Text>
                <View style={s.card}>
                    <Row label="Пассажиров" value={String(order.employees?.length || order.requirements?.pax || 1)} />
                    <Row label="Машина" value={order.requirements?.vehicleGroup || "—"} />
                </View>

                <Text style={s.sectionTitle}>Комментарий</Text>
                <View style={s.grayBox}><Text style={s.grayText}>{order.requirements?.notes || "—"}</Text></View>

                <Text style={s.sectionTitle}>Хронология</Text>
                <View style={s.card}>
                    <Row label="Время заявки" value={fmt(order.timeline?.createdAt)} />
                    <Row label="Назначен водитель" value={fmt(order.timeline?.assignedAt)} />
                    <Row label="Прибыл к пассажиру" value={fmt(order.timeline?.arrivedAtPickup)} />
                    <Row label="Выехали" value={fmt(order.timeline?.departedAt)} />
                    <Row label="Прибытие" value={fmt(order.timeline?.arrivedAtDropoff)} />
                    <Row label="Завершение поездки" value={fmt(order.timeline?.finishedAt)} />
                    <Row
                        label="Время в пути"
                        value={
                            order.timeline?.travelTimeSec
                                ? `${Math.floor(order.timeline.travelTimeSec / 60)} мин`
                                : "—"
                        }
                    />
                </View>

                <TouchableOpacity
                    style={s.routeBtn}
                    onPress={() => {
                        if (!order.fromCoords || !order.toCoords) {
                            return Alert.alert("Маршрут", "У этой заявки нет сохранённой геопозиции точек.");
                        }
                        navigation.navigate("RoutePreview", {
                            fromLabel: order.from,
                            toLabel: order.to,
                            fromCoords: order.fromCoords,
                            toCoords: order.toCoords,
                        });
                    }}
                    activeOpacity={0.9}
                >
                    <Ionicons name="map-outline" size={18} color="#2F6BFF" style={{ marginRight: 8 }} />
                    <Text style={s.routeBtnText}>Просмотр маршрута</Text>
                </TouchableOpacity>
            </ScrollView>
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

    sectionTitle: { marginTop: 16, marginBottom: 8, fontWeight: "700", color: "#0D1220" },
    card: { backgroundColor: "#fff", borderRadius: 14, borderWidth: 1, borderColor: "#E6EAF0", padding: 12 },
    grayBox: { backgroundColor: "#F4F6FA", borderRadius: 10, borderWidth: 1, borderColor: "#E6EAF0", minHeight: 44, paddingHorizontal: 12, justifyContent: "center" },
    grayText: { color: "#6E7781" },

    routeBtn: {
        flexDirection: "row", alignItems: "center", justifyContent: "center",
        backgroundColor: "#EEF3FF", borderColor: "#B9C7FF", borderWidth: 1,
        borderRadius: 12, height: 48, marginTop: 12,
    },
    routeBtnText: { color: "#2F6BFF", fontWeight: "700", fontSize: 15 },
});
