// src/screens/DriversScreen.js
import React, { useMemo, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    FlatList,
    TouchableOpacity,
    Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

// Моки для примера

const DRIVERS = [
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
        
        status: "available", 
        confirmed: true, 
        car: { model: "Toyota Camry", color: "черный", plate: "А666АА" },
        ordersActive: 0,
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
        
        status: "available",
        confirmed: true,  
        car: { model: "Toyota Camry", color: "черный", plate: "А666АА" },
        ordersActive: 0,
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
        
        status: "available", 
        confirmed: true, 
        car: { model: "Toyota Camry", color: "черный", plate: "А666АА" },
        ordersActive: 0,
    },
    {
        id: "2",
        name: "Иван",
        rating: 5.0,
        confirmed: false,            // не подтвержден
        car: { model: "Toyota Camry", color: "черный", plate: "А666АА" },
        avatar: "https://i.pravatar.cc/100?img=13",
    },
    {
        id: "4",
        name: "Иван",
        rating: 5.0,
        confirmed: false,
        car: { model: "Toyota Camry", color: "черный", plate: "А666АА" },
        avatar: "https://i.pravatar.cc/100?img=15",
    },
];

const TABS = [
    { key: "confirmed", label: "Подтверждены" },
    { key: "pending", label: "Ожидают подтверждения" },
];

export default function DriversScreen() {
    const [active, setActive] = useState("confirmed");
    const [q, setQ] = useState("");

    const data = useMemo(() => {
        const filtered = DRIVERS.filter((d) =>
            active === "confirmed" ? d.confirmed : !d.confirmed
        );
        if (!q.trim()) return filtered;
        const needle = q.toLowerCase();
        return filtered.filter(
            (d) =>
                d.name.toLowerCase().includes(needle) ||
                d.car.plate.toLowerCase().includes(needle) ||
                d.car.model.toLowerCase().includes(needle)
        );
    }, [active, q]);

    const renderItem = ({ item }) =>
        item.confirmed ? (
            <ConfirmedCard driver={item} />
        ) : (
            <PendingCard driver={item} />
        );

    return (
        <SafeAreaView style={styles.safe} edges={["top"]}>
            <View style={styles.container}>
                {/* Шапка: Поиск */}
                <View style={styles.header}>
                    <View style={styles.searchBox}>
                        <Ionicons name="search-outline" size={18} color="#9AA4AD" />
                        <TextInput
                            value={q}
                            onChangeText={setQ}
                            placeholder="Поиск"
                            placeholderTextColor="#9AA4AD"
                            style={styles.searchInput}
                            autoCapitalize="none"
                        />
                    </View>

                    {/* Свитчер вкладок */}
                    <View style={styles.tabsRow}>
                        {TABS.map((t) => {
                            const activeTab = t.key === active;
                            return (
                                <TouchableOpacity
                                    key={t.key}
                                    onPress={() => setActive(t.key)}
                                    style={[styles.tab, activeTab && styles.tabActive]}
                                >
                                    <Text
                                        style={[styles.tabText, activeTab && styles.tabTextActive]}
                                    >
                                        {t.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {/* Список */}
                <FlatList
                    data={data}
                    keyExtractor={(i) => i.id}
                    renderItem={renderItem}
                    style={{ flex: 1 }}
                    contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8 }}
                    showsVerticalScrollIndicator={false}
                />
            </View>
        </SafeAreaView>
    );
}

/* ---------- Карточки ---------- */

function ConfirmedCard({ driver }) {
    return (
        <View style={styles.card}>
            <Image source={{ uri: driver.avatar }} style={styles.avatar} />

            <View style={{ flex: 1, marginLeft: 10 }}>
                {/* Имя + рейтинг */}
                <View style={styles.rowBetween}>
                    <Text style={styles.name}>{driver.name}</Text>
                    <View style={styles.row}>
                        <Ionicons name="star" size={14} color="#F5B000" />
                        <Text style={styles.rating}>{driver.rating.toFixed(1)}</Text>
                    </View>
                </View>

                {/* Статус доступности + синий линк */}
                <TouchableOpacity>
                    <Text style={styles.link}>Доступен</Text>
                </TouchableOpacity>

                {/* Машина */}
                <View style={[styles.rowBetween, { marginTop: 4 }]}>
                    <Text style={styles.plate}>{driver.car.plate}</Text>
                    <View style={styles.row}>
                        <Ionicons name="car-sport-outline" size={16} color="#6E7781" />
                        <Text style={styles.carText}>
                            {driver.car.model}  {driver.car.color}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Индикатор активных заказов (справа кружок) */}
            <View style={styles.counterBubble}>
                <Text style={styles.counterText}>{driver.ordersActive ?? 0}</Text>
            </View>
        </View>
    );
}

function PendingCard({ driver, onPress }) {
    return (
        <View style={styles.cardLarge}>
            {/* верх: аватар+имя | номер+авто */}
            <View style={styles.topRow}>
                <View style={styles.leftCol}>
                    <Image source={{ uri: driver.avatar }} style={styles.avatar} />
                    <View style={{ marginLeft: 10, flexShrink: 1 }}>
                        <Text style={styles.name}>{driver.name}</Text>
                        <Text style={styles.mutedSmall}>Не подтвержден</Text>
                    </View>
                </View>

                <View style={styles.rightCol}>
                    <Text style={styles.plate}>{driver.car.plate}</Text>
                    <Text style={styles.carText} numberOfLines={1}>
                        {driver.car.model} {driver.car.color}
                    </Text>
                </View>
            </View>

            {/* единый CTA-блок */}
            <TouchableOpacity
                activeOpacity={0.8}
                style={styles.ctaBox}
                onPress={() => onPress?.(driver)}
            >
                <Text style={styles.ctaText}>Просмотреть данные</Text>
            </TouchableOpacity>
        </View>
    );
}



/* ---------- Стили ---------- */

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: "#FFFFFF" },
    container: { flex: 1 },

    header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8, backgroundColor: "#FFFFFF" },

    // Поиск
    searchBox: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F4F6FA",
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 40,
        borderWidth: 1,
        borderColor: "#E6EAF0",
    },
    searchInput: { flex: 1, marginLeft: 8, paddingVertical: 0, color: "#0D1220" },

    // Табы
    tabsRow: { flexDirection: "row", marginTop: 12 },
    tab: {
        paddingHorizontal: 14,
        height: 34,
        borderRadius: 17,
        borderWidth: 1,
        borderColor: "#E3E8EF",
        backgroundColor: "#FFFFFF",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 8,
    },
    tabActive: { backgroundColor: "#0B0F10", borderColor: "#0B0F10" },
    tabText: { color: "#0B0F10", fontWeight: "600" },
    tabTextActive: { color: "#FFFFFF", fontWeight: "700" },

    // Общие
    row: { flexDirection: "row", alignItems: "center" },
    rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    muted: { color: "#6E7781" },

    // Карточка (подтвержден)
    card: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: "#E6EAF0",
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 6,
        shadowOffset: { height: 2, width: 0 },
        elevation: 2,
    },
    avatar: { width: 48, height: 48, borderRadius: 24 },
    name: { color: "#0D1220", fontWeight: "700" },
    link: { color: "#2F6BFF", marginTop: 2, fontWeight: "600" },
    rating: { marginLeft: 4, color: "#0D1220", fontWeight: "600" },


    counterBubble: {
        marginLeft: 10,
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#F1F3F6",
    },
    counterText: { color: "#0D1220", fontWeight: "700" },

    // Карточка (не подтвержден)
    cardLarge: {
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "#E6EAF0",
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 6,
        shadowOffset: { height: 2, width: 0 },
        elevation: 2,
    },
    grayBox: {
        marginTop: 10,
        backgroundColor: "#F1F3F6",
        height: 48,
        borderRadius: 10,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
    },
    viewLink: {
        color: "#2F6BFF",
        fontWeight: "700",
        marginTop: 10,
    },

    topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
    leftCol: { flexDirection: "row", alignItems: "center", flex: 1, minWidth: 0 },
    rightCol: { alignItems: "flex-end", marginLeft: 12 },

    mutedSmall: { color: "#6E7781", fontSize: 13, lineHeight: 16, marginTop: 2 },
    plate: { color: "#0D1220", fontWeight: "700", fontSize: 14, letterSpacing: 0.4, lineHeight: 18 },
    carText: { color: "#6E7781", fontSize: 13, lineHeight: 16 },

    // ЗАМЕНА прежним grayBox + viewLink
    ctaBox: {
        marginTop: 10,
        backgroundColor: "#F1F3F6",
        height: 46,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
    },
    ctaText: { color: "#2F6BFF", fontWeight: "700" },

});
