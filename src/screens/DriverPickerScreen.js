import React, { useMemo, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Image,
    Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import MapView, { Marker } from "react-native-maps";

// ===== MOCK (замени на реальные данные) =====
const MOCK_DRIVERS = [
    {
        id: "d1",
        name: "Иван",
        rating: 5.0,
        avatar: "https://i.pravatar.cc/100?img=12",
        capacity: 4,
        types: ["sedan"],
        classes: ["economy", "comfort"],
        allowsPets: true,
        childSeats: { infant: 0, toddler: 1, booster: 0 },
        wheelchairSupport: false,
        nonSmoking: true,
        airConditioner: true,
        languages: ["ru"],
        paymentMethods: ["cash", "card"],
        location: { lat: 44.2269, lng: 42.0468 }, // пример
    },
    {
        id: "d2",
        name: "Пётр",
        rating: 4.8,
        avatar: "https://i.pravatar.cc/100?img=15",
        capacity: 12,
        types: ["minibus"],
        classes: ["economy"],
        allowsPets: false,
        childSeats: { infant: 0, toddler: 0, booster: 0 },
        wheelchairSupport: false,
        nonSmoking: true,
        airConditioner: true,
        languages: ["ru", "en"],
        paymentMethods: ["card", "invoice"],
        location: { lat: 44.2102, lng: 42.0575 },
    },
    {
        id: "d3",
        name: "Сергей",
        rating: 4.9,
        avatar: "https://i.pravatar.cc/100?img=33",
        capacity: 8,
        types: ["minivan"],
        classes: ["comfort"],
        allowsPets: true,
        childSeats: { infant: 0, toddler: 0, booster: 1 },
        wheelchairSupport: false,
        nonSmoking: true,
        airConditioner: true,
        languages: ["ru"],
        paymentMethods: ["cash", "card"],
        location: { lat: 44.2315, lng: 42.0252 },
    },
];

// ===== УТИЛИТЫ =====
function fits(order, driver) {
    const r = order?.requirements || {};
    if (r.pax && driver.capacity < r.pax) return false;
    if (r.vehicleType && !driver.types.includes(r.vehicleType)) return false;
    if (r.vehicleClass && !driver.classes.includes(r.vehicleClass)) return false;
    if (r.pets && !driver.allowsPets) return false;
    if (r.airConditioner && !driver.airConditioner) return false;
    if (r.nonSmoking && !driver.nonSmoking) return false;
    if (r.payment && !driver.paymentMethods.includes(r.payment)) return false;
    if (r.childSeats?.total) {
        const need = r.childSeats;
        const have = driver.childSeats || {};
        const totalHave =
            (have.infant || 0) + (have.toddler || 0) + (have.booster || 0);
        if (totalHave < (need.total || 0)) return false;
    }
    if (r.accessibility?.wheelchair && !driver.wheelchairSupport) return false;
    if (r.languages?.length && !r.languages.some((l) => driver.languages.includes(l)))
        return false;
    return true;
}

function haversineKm(a, b) {
    if (!a || !b) return Infinity;
    const toRad = (x) => (x * Math.PI) / 180;
    const R = 6371; // km
    const dLat = toRad(b.lat - a.lat);
    const dLon = toRad(b.lng - a.lng);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);
    const h =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
}

function fmtKm(x) {
    if (!isFinite(x)) return "—";
    return x < 10 ? `${x.toFixed(1)} км` : `${Math.round(x)} км`;
}

// ===== UI-компоненты =====
function DriverRow({ d, distanceKm, onAssign }) {
    return (
        <View style={styles.card}>
            <Image source={{ uri: d.avatar }} style={styles.avatar} />
            <View style={{ flex: 1, marginLeft: 10 }}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text style={styles.name}>{d.name}</Text>
                    <Ionicons name="star" size={14} color="#F5B000" style={{ marginLeft: 6 }} />
                    <Text style={styles.rating}>{d.rating.toFixed(1)}</Text>
                </View>
                <Text style={styles.sub}>
                    {d.types.join(", ")} • {d.capacity} мест • {d.classes.join("/")}
                </Text>
                <Text style={styles.sub}>Оплата: {d.paymentMethods.join(", ")}</Text>
                <Text style={[styles.sub, { marginTop: 2 }]}>До подачи: {fmtKm(distanceKm)}</Text>
            </View>
            <TouchableOpacity style={styles.assignBtn} onPress={onAssign} activeOpacity={0.85}>
                <Text style={styles.assignText}>Назначить</Text>
            </TouchableOpacity>
        </View>
    );
}

export default function DriverPickerScreen({ route, navigation }) {
    const order = route?.params?.order;
    const onAssigned = route?.params?.onAssigned;

    // координаты точки подачи (ожидаем order.fromCoords или order.pickupCoords)
    const pickup =
        order?.fromCoords ||
        order?.pickupCoords ||
        order?.pickup?.coords ||
        null;

    // режим отображения: список / карта
    const [mode, setMode] = useState("list"); // "list" | "map"
    const [selected, setSelected] = useState(null); // выбранный водитель для карточки на карте

    // считаем расстояния + сортируем
    const enriched = useMemo(() => {
        const withDist = MOCK_DRIVERS.map((d) => ({
            ...d,
            distanceKm: pickup ? haversineKm(pickup, d.location) : Infinity,
            fits: fits(order, d),
        }));
        // сортировка: 1) расстояние (asc) 2) соответствие (fits=true сначала) 3) рейтинг (desc)
        withDist.sort((a, b) => {
            const da = a.distanceKm, db = b.distanceKm;
            if (isFinite(da) && isFinite(db) && da !== db) return da - db;
            if (a.fits !== b.fits) return a.fits ? -1 : 1;
            return b.rating - a.rating;
        });
        return withDist;
    }, [order, pickup]);

    const matched = useMemo(() => enriched.filter((d) => d.fits), [enriched]);
    const others = useMemo(() => enriched.filter((d) => !d.fits), [enriched]);

    const assign = (driver) => {
        onAssigned?.({
            driver: {
                id: driver.id,
                name: driver.name,
                rating: driver.rating,
                avatar: driver.avatar,
            },
            acceptedAt: new Date().toISOString(),
        });
        navigation.goBack();
    };

    // регион карты
    const initialRegion = useMemo(() => {
        let center = pickup;
        if (!center) {
            // центр по средним координатам водителей
            const lats = MOCK_DRIVERS.map((d) => d.location.lat);
            const lngs = MOCK_DRIVERS.map((d) => d.location.lng);
            center = {
                lat: lats.reduce((a, b) => a + b, 0) / lats.length,
                lng: lngs.reduce((a, b) => a + b, 0) / lngs.length,
            };
        }
        return {
            latitude: center.lat,
            longitude: center.lng,
            latitudeDelta: 0.08,
            longitudeDelta: 0.08,
        };
    }, [pickup]);

    return (
        <SafeAreaView style={styles.safe} edges={["top"]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="chevron-back" size={26} color="#0D1220" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Подбор водителя</Text>
                {/* переключатель режимов */}
                <View style={styles.toggleWrap}>
                    <TouchableOpacity
                        style={[styles.toggleBtn, mode === "list" && styles.toggleBtnActive]}
                        onPress={() => setMode("list")}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="list" size={16} color={mode === "list" ? "#fff" : "#0D1220"} />
                        <Text style={[styles.toggleText, mode === "list" && styles.toggleTextActive]}>Список</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.toggleBtn, mode === "map" && styles.toggleBtnActive]}
                        onPress={() => setMode("map")}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="map" size={16} color={mode === "map" ? "#fff" : "#0D1220"} />
                        <Text style={[styles.toggleText, mode === "map" && styles.toggleTextActive]}>Карта</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* CONTENT */}
            {mode === "list" ? (
                <FlatList
                    data={[
                        { type: "title", title: `Подходят: ${matched.length}` },
                        ...matched.map((d) => ({ type: "driver", d })),
                        { type: "title", title: `Остальные: ${others.length}` },
                        ...others.map((d) => ({ type: "driver", d })),
                    ]}
                    keyExtractor={(_, i) => String(i)}
                    contentContainerStyle={{ padding: 16, paddingBottom: 16 }}
                    renderItem={({ item }) => {
                        if (item.type === "title") {
                            return <Text style={styles.blockTitle}>{item.title}</Text>;
                        }
                        return (
                            <DriverRow
                                d={item.d}
                                distanceKm={item.d.distanceKm}
                                onAssign={() => assign(item.d)}
                            />
                        );
                    }}
                    ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
                    ListEmptyComponent={
                        <View style={{ paddingTop: 40, alignItems: "center" }}>
                            <Text style={{ color: "#6E7781" }}>Нет доступных водителей</Text>
                        </View>
                    }
                    showsVerticalScrollIndicator={false}
                />
            ) : (
                <View style={{ flex: 1 }}>
                    <MapView style={StyleSheet.absoluteFillObject} initialRegion={initialRegion}>
                        {/* Точка подачи */}
                        {pickup && (
                            <Marker
                                coordinate={{ latitude: pickup.lat, longitude: pickup.lng }}
                                title="Подача"
                                description="Точка, откуда забрать пассажира"
                                pinColor="#2F6BFF"
                            />
                        )}
                        {/* Водители */}
                        {enriched.map((d) => (
                            <Marker
                                key={d.id}
                                coordinate={{ latitude: d.location.lat, longitude: d.location.lng }}
                                title={d.name}
                                description={`До подачи: ${fmtKm(d.distanceKm)}`}
                                onPress={() => setSelected(d)}
                            >
                                <View style={styles.driverPin}>
                                    <Ionicons name="car-sport" size={14} color="#fff" />
                                </View>
                            </Marker>
                        ))}
                    </MapView>

                    {/* карточка выбранного водителя */}
                    {selected && (
                        <View style={styles.bottomCard}>
                            <View style={{ flexDirection: "row", alignItems: "center" }}>
                                <Image source={{ uri: selected.avatar }} style={styles.avatar} />
                                <View style={{ marginLeft: 10, flex: 1 }}>
                                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                                        <Text style={styles.name}>{selected.name}</Text>
                                        <Ionicons name="star" size={14} color="#F5B000" style={{ marginLeft: 6 }} />
                                        <Text style={styles.rating}>{selected.rating.toFixed(1)}</Text>
                                    </View>
                                    <Text style={styles.sub}>
                                        {selected.types.join(", ")} • {selected.capacity} мест
                                    </Text>
                                    <Text style={styles.sub}>До подачи: {fmtKm(selected.distanceKm)}</Text>
                                </View>
                                <TouchableOpacity
                                    style={styles.assignBtn}
                                    onPress={() => assign(selected)}
                                    activeOpacity={0.85}
                                >
                                    <Text style={styles.assignText}>Назначить</Text>
                                </TouchableOpacity>
                            </View>
                            <TouchableOpacity onPress={() => setSelected(null)} style={{ marginTop: 8, alignSelf: "center" }}>
                                <Text style={{ color: "#6E7781" }}>Скрыть</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            )}
        </SafeAreaView>
    );
}

const { width } = Dimensions.get("window");

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
    headerTitle: { fontSize: 18, fontWeight: "700", color: "#0D1220" },

    toggleWrap: {
        flexDirection: "row",
        backgroundColor: "#F1F3F6",
        borderRadius: 20,
        padding: 2,
    },
    toggleBtn: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 10,
        height: 28,
        borderRadius: 16,
        gap: 6,
    },
    toggleBtnActive: { backgroundColor: "#2F6BFF" },
    toggleText: { color: "#0D1220", fontSize: 12, fontWeight: "600" },
    toggleTextActive: { color: "#fff" },

    blockTitle: {
        marginVertical: 8,
        fontWeight: "700",
        color: "#0D1220",
    },

    card: {
        backgroundColor: "#FFFFFF",
        borderRadius: 14,
        padding: 12,
        borderWidth: 1,
        borderColor: "#E6EAF0",
        flexDirection: "row",
        alignItems: "center",
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#E9EEF5" },
    name: { color: "#0D1220", fontWeight: "700" },
    rating: { marginLeft: 2, color: "#0D1220" },
    sub: { color: "#6E7781", marginTop: 2, fontSize: 12 },

    assignBtn: {
        backgroundColor: "#2F6BFF",
        height: 36,
        paddingHorizontal: 12,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
        marginLeft: 10,
    },
    assignText: { color: "#FFFFFF", fontWeight: "700" },

    // Map pin
    driverPin: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: "#2F6BFF",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 2,
        borderColor: "#fff",
    },

    // Bottom card on map
    bottomCard: {
        position: "absolute",
        left: 12,
        right: 12,
        bottom: 12,
        backgroundColor: "#fff",
        borderRadius: 14,
        padding: 12,
        borderWidth: 1,
        borderColor: "#E6EAF0",
        shadowColor: "#000",
        shadowOpacity: 0.12,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
        width: width - 24,
    },
});
