// src/screens/OrderDetailsScreen.js
import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

const vehicleTypeLabel = { sedan: "Седан", minivan: "Минивен", minibus: "Микроавтобус", bus: "Автобус" };
const vehicleClassLabel = { economy: "Эконом", comfort: "Комфорт", business: "Бизнес" };
const paymentLabel = { cash: "Наличные", card: "Картой", invoice: "Безнал" };

const fmt = (iso) =>
    iso ? new Date(iso).toLocaleString("ru-RU", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

const diffMinutes = (fromIso, toIso) => {
    if (!fromIso || !toIso) return null;
    const ms = new Date(toIso) - new Date(fromIso);
    if (Number.isNaN(ms) || ms < 0) return null;
    return Math.round(ms / 60000);
};

function Chip({ children }) {
    return <View style={styles.chip}><Text style={{ color: "#0D1220" }}>{children}</Text></View>;
}

function PersonRow({ role, person, onChat  }) {
    if (!person) return null;
    return (
        <View style={styles.personRow}>
            {person.avatar ? <Image source={{ uri: person.avatar }} style={styles.personAvatar} /> : <View style={[styles.personAvatar, { backgroundColor: "#E9EEF5" }]} />}
            <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.role}>{role}</Text>
                <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap" }}>
                    <Text style={styles.personName}>{person.name ?? "—"}</Text>
                    {typeof person.rating === "number" && (
                        <>
                            <Ionicons name="star" size={14} color="#F5B000" style={{ marginLeft: 6 }} />
                            <Text style={styles.rating}>{person.rating.toFixed(1)}</Text>
                        </>
                    )}
                </View>
            </View>
            <View style={{ flexDirection: "row", gap: 8 }}>
                <TouchableOpacity style={styles.roundBtn} onPress={onChat} >
                    <Ionicons name="chatbubble-ellipses-outline" size={18} color="#0D1220" />
                </TouchableOpacity>
            </View>
        </View>
    );
}

// НЕинтерактивные звезды для отображения рейтинга
function StarsReadonly({ value = 0 }) {
    const arr = [1, 2, 3, 4, 5];
    return (
        <View style={{ flexDirection: "row" }}>
            {arr.map((n) => (
                <Ionicons key={n} name="star" size={18} color={n <= value ? "#F5B000" : "#D2D8DE"} />
            ))}
        </View>
    );
}

export default function OrderDetailsScreen({ route, navigation }) {
    const order = route?.params?.order;
    const [assignedDriver, setAssignedDriver] = useState(order?.assignedDriver || null);

    // время: изначально только orderedAt (время создания заявки)
    const [times, setTimes] = useState({
        orderedAt: order?.date || null,           // уже есть
        acceptedAt: order?.acceptedAt || null,    // появится после назначения
        orderAcceptedAt: order?.orderAcceptedAt || null,    // появится после назначения
        arrivedPickupAt: order?.arrivedPickupAt || null,
        departedAt: order?.departedAt || null,
        arrivedDropoffAt: order?.arrivedDropoffAt || null,
        completedAt: order?.completedAt || null,
    });

    // оценки только для показа (если пришли)
    const ratings = {
        byDriver: order?.ratings?.byDriver ?? null,
        byPassenger: order?.ratings?.byPassenger ?? null,
    };

    const travelMinutes = useMemo(
        () => diffMinutes(times.departedAt, times.arrivedDropoffAt),
        [times.departedAt, times.arrivedDropoffAt]
    );

    if (!order) {
        return (
            <SafeAreaView style={styles.safe} edges={["top"]}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="chevron-back" size={26} color="#0D1220" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Заявка</Text>
                    <View style={{ width: 26 }} />
                </View>
                <View style={{ padding: 16 }}><Text>Нет данных заявки.</Text></View>
            </SafeAreaView>
        );
    }

    const openPicker = () => {
        navigation.navigate("DriverPicker", {
            order,
            onAssigned: ({ driver, acceptedAt }) => {
                setAssignedDriver(driver);
                setTimes((t) => ({ ...t, acceptedAt: acceptedAt || new Date().toISOString() }));
            },
        });
    };

    const showTimelineTail = Boolean(times.acceptedAt); // остальные пункты показываем только после назначения

    const showRatings = ratings.byDriver != null || ratings.byPassenger != null;

    return (
        <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
            {/* header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="chevron-back" size={26} color="#0D1220" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Заявка #{order.id ?? "—"}</Text>
                <View style={{ width: 26 }} />
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>

                {/* Участники */}
                {assignedDriver && (
                    <PersonRow
                        role="Водитель"
                        person={assignedDriver}
                        onChat={() =>
                            navigation.navigate("Chat", { peer: { title: `Водитель • ${assignedDriver.name}`, id: assignedDriver.id } })
                        }
                    />
                )}
                <PersonRow
                    role="Пассажир"
                    person={order.driver}
                    onChat={() =>
                        navigation.navigate("Chat", { peer: { title: `Пассажир • ${order.driver?.name || ""}` } })
                    }
                />

                {/* Маршрут */}
                <View style={styles.routeCard}>
                    <View style={styles.routeRow}>
                        <View style={[styles.dot, { backgroundColor: "#1A73E8" }]} />
                        <Text style={styles.addr}>{order.from ?? "—"}</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.routeRow}>
                        <View style={[styles.dot, { backgroundColor: "#0ABF53" }]} />
                        <Text style={styles.addr}>{order.to ?? "—"}</Text>
                    </View>
                </View>

                {/* Требования */}
                <Text style={styles.sectionTitle}>Требования к поездке</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                    <Chip>{`Пассажиров: ${order.requirements?.pax ?? "—"}`}</Chip>
                    {order.requirements?.vehicleType && <Chip>{vehicleTypeLabel[order.requirements.vehicleType]}</Chip>}
                    {order.requirements?.vehicleClass && <Chip>{vehicleClassLabel[order.requirements.vehicleClass]}</Chip>}
                    {order.requirements?.luggage?.items >= 0 && <Chip>{`Багаж: ${order.requirements.luggage.items}`}</Chip>}
                    {order.requirements?.luggage?.bulky && <Chip>Негабарит</Chip>}
                    {order.requirements?.pets && <Chip>С животными</Chip>}
                    {order.requirements?.childSeats?.total > 0 && <Chip>{`Детк. кресла: ${order.requirements.childSeats.total}`}</Chip>}
                    {order.requirements?.accessibility?.wheelchair && <Chip>Инвалидная коляска</Chip>}
                    {order.requirements?.nonSmoking && <Chip>Некурящий водитель</Chip>}
                    {order.requirements?.airConditioner && <Chip>Кондиционер</Chip>}
                    {!!order.requirements?.languages?.length && <Chip>{`Язык: ${order.requirements.languages.join(", ")}`}</Chip>}
                    {order.requirements?.payment && <Chip>{paymentLabel[order.requirements.payment]}</Chip>}
                </View>

                {/* Хронология */}
                <Text style={styles.sectionTitle}>Хронология</Text>
                <View style={styles.timeline}>
                    <Row label="Время заказа" value={fmt(times.orderedAt)} />
                    {showTimelineTail && (
                        <>
                            <Row label="Время назначения водителя" value={fmt(times.acceptedAt)} />
                            <Row label="Время принятия заказа" value={fmt(times.orderAcceptedAt)} />
                            <Row label="Время прибытия к пассажиру" value={fmt(times.arrivedPickupAt)} />
                            <Row label="Время выезда" value={fmt(times.departedAt)} />
                            <Row label="Время прибытия" value={fmt(times.arrivedDropoffAt)} />
                            <Row label="Время завершения" value={fmt(times.completedAt)} />
                            <Row label="Время в пути" value={travelMinutes != null ? `${travelMinutes} мин` : "—"} />
                        </>
                    )}
                </View>

                {/* Комментарий и багаж */}
                <Text style={styles.grayLabel}>Комментарий</Text>
                <View style={styles.grayBox}><Text style={styles.grayText}>{order.requirements?.notes || order.comment || "—"}</Text></View>

                <Text style={styles.grayLabel}>Информация о багаже</Text>
                <View style={styles.grayBox}><Text style={styles.grayText}>{order.baggage || "—"}</Text></View>

                {/* Оценки поездки — только если есть */}
                {showRatings && (
                    <>
                        <Text style={styles.sectionTitle}>Оценки поездки</Text>
                        {ratings.byDriver != null && (
                            <View style={styles.rateRow}>
                                <Text style={styles.rateLabel}>От водителя</Text>
                                <StarsReadonly value={ratings.byDriver} />
                            </View>
                        )}
                        {ratings.byPassenger != null && (
                            <View style={styles.rateRow}>
                                <Text style={styles.rateLabel}>От пассажира</Text>
                                <StarsReadonly value={ratings.byPassenger} />
                            </View>
                        )}
                    </>
                )}
            </ScrollView>

            {/* Кнопка */}
            <View style={styles.footer}>
                <TouchableOpacity style={styles.primaryBtn} activeOpacity={0.9} onPress={openPicker}>
                    <Text style={styles.primaryText}>{assignedDriver ? "Сменить водителя" : "Назначить водителя"}</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

function Row({ label, value }) {
    return (
        <View style={styles.row}>
            <Text style={styles.rowLabel}>{label}</Text>
            <Text style={styles.rowValue}>{value}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: "#fff" },
    header: {
        height: 48, paddingHorizontal: 12,
        borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#E6EAF0",
        flexDirection: "row", alignItems: "center", gap: 8,
    },
    headerTitle: { fontSize: 18, fontWeight: "700", color: "#0D1220" },

    personRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8, marginBottom: 6 },
    role: { color: "#6E7781", fontSize: 12, marginBottom: 2 },
    personAvatar: { width: 40, height: 40, borderRadius: 20 },
    personName: { fontWeight: "700", color: "#0D1220" },
    rating: { marginLeft: 2, color: "#0D1220" },
    roundBtn: { width: 36, height: 36, borderRadius: 8, borderWidth: 1, borderColor: "#E6EAF0", alignItems: "center", justifyContent: "center", backgroundColor: "#fff" },

    routeCard: { borderWidth: 1, borderColor: "#E6EAF0", borderRadius: 12, padding: 12, backgroundColor: "#fff", marginTop: 8 },
    routeRow: { flexDirection: "row", alignItems: "center" },
    addr: { color: "#0D1220", flex: 1 },
    dot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
    divider: { height: 1, backgroundColor: "#E6EAF0", marginVertical: 10 },

    sectionTitle: { marginTop: 14, marginBottom: 8, fontWeight: "700", color: "#0D1220" },
    chip: { paddingHorizontal: 10, height: 28, borderRadius: 14, backgroundColor: "#F1F3F6", borderWidth: 1, borderColor: "#E6EAF0", alignItems: "center", justifyContent: "center", marginRight: 8, marginBottom: 8 },

    grayLabel: { color: "#8E98A3", fontSize: 12, fontWeight: "700", marginTop: 14, marginBottom: 6 },
    grayBox: { backgroundColor: "#F4F6FA", borderRadius: 10, borderWidth: 1, borderColor: "#E6EAF0", minHeight: 44, paddingHorizontal: 12, justifyContent: "center" },
    grayText: { color: "#6E7781" },

    timeline: { marginTop: 4 },
    row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
    rowLabel: { color: "#6E7781" },
    rowValue: { color: "#0D1220", marginLeft: 12 },

    rateRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 6 },
    rateLabel: { color: "#0D1220" },

    footer: { padding: 16, backgroundColor: "#fff", borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#E6EAF0" },
    primaryBtn: { height: 52, borderRadius: 16, backgroundColor: "#2F6BFF", alignItems: "center", justifyContent: "center" },
    primaryText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
