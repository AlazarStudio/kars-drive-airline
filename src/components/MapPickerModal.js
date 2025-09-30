// src/components/MapPickerModal.js
import React, { useEffect, useRef, useState } from "react";
import {
    Modal, View, Text, StyleSheet, TouchableOpacity,
    ActivityIndicator, TextInput, Keyboard, Pressable, ScrollView, Platform
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";

export default function MapPickerModal({
    visible,
    onClose,
    onPick,                 // ({ coords:{lat,lng}, address }) => void
    initial,               // { lat, lng } | null — если передан, показываем маркер сразу
    title = "Выберите место",
}) {
    const insets = useSafeAreaInsets();
    const mapRef = useRef(null);

    // выбранная точка (нет — пока не выбирали)
    const [coord, setCoord] = useState(null);      // {lat,lng} | null
    const [address, setAddress] = useState("");    // строка адреса
    const [loadingAddr, setLoadingAddr] = useState(false);

    // строка поиска
    const [search, setSearch] = useState("");

    // запоминаем последний регион (город), чтобы след. открытия начинались «там же»
    // region: { latitude, longitude, latitudeDelta, longitudeDelta }
    const [lastRegion, setLastRegion] = useState(null);

    // высота нижней панели (для позиционирования FAB)
    const [sheetH, setSheetH] = useState(180);

    // подъем панели на высоту клавиатуры
    const [kbHeight, setKbHeight] = useState(0);
    useEffect(() => {
        const showEvt = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
        const hideEvt = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
        const onShow = (e) => setKbHeight(e?.endCoordinates?.height ?? 0);
        const onHide = () => setKbHeight(0);
        const s = Keyboard.addListener(showEvt, onShow);
        const h = Keyboard.addListener(hideEvt, onHide);
        return () => { s.remove(); h.remove(); };
    }, []);
    const lift = Math.max(0, kbHeight - (insets.bottom || 0)) - 4;

    // обратное геокодирование — по действиям/initial
    const reverse = async ({ lat, lng }) => {
        try {
            setLoadingAddr(true);
            const r = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
            const a = r?.[0];
            const line = a
                ? [a.country, a.region, a.city, a.street, a.name || a.streetNumber].filter(Boolean).join(", ")
                : "Адрес не найден";
            setAddress(line);
        } finally {
            setLoadingAddr(false);
        }
    };

    // ---- КЛЮЧЕВОЕ: центрируем только один раз на открытие ----
    const centeredOnceRef = useRef(false);

    // сбрасываем флаг при каждом открытии
    useEffect(() => {
        if (visible) centeredOnceRef.current = false;
    }, [visible]);

    // при открытии: initial → на неё; иначе → на город пользователя; иначе → прошлый регион / мир
    useEffect(() => {
        if (!visible) return;
        if (centeredOnceRef.current) return; // уже центрировали в этом открытии
        setSearch(""); // очистка поиска

        let cancelled = false;
        const toRegion = (lat, lng, zoom = 0.2) => ({
            latitude: lat,
            longitude: lng,
            latitudeDelta: zoom,      // ~городской масштаб
            longitudeDelta: zoom,
        });

        (async () => {
            // 1) initial → сразу показываем маркер и адрес, центрируемся
            if (initial) {
                setCoord(initial);
                setAddress("");
                await reverse(initial);
                if (cancelled) return;
                const reg = toRegion(initial.lat, initial.lng, 0.08);
                mapRef.current?.animateToRegion(reg, 0);
                setLastRegion(reg);
                centeredOnceRef.current = true;
                return;
            }

            // 2) без initial → пытаемся центрироваться на городе пользователя (без выбора точки)
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status === "granted") {
                    const pos = await Location.getCurrentPositionAsync({
                        accuracy: Location.Accuracy.Balanced,
                        maximumAge: 60000,
                    });
                    if (cancelled) return;
                    const reg = toRegion(pos.coords.latitude, pos.coords.longitude, 0.2);
                    setCoord(null);
                    setAddress("");
                    mapRef.current?.animateToRegion(reg, 0);
                    setLastRegion(reg);
                    centeredOnceRef.current = true;
                    return;
                }
            } catch { }

            // 3) фоллбек: прошлый регион или «мировой» вид
            const fallback = lastRegion || toRegion(30, 0, 40);
            setCoord(null);
            setAddress("");
            mapRef.current?.animateToRegion(fallback, 0);
            centeredOnceRef.current = true;
        })();

        return () => { cancelled = true; };
    }, [visible, initial]); // <-- ВАЖНО: без зависимости от lastRegion

    // тап по карте выбирает точку
    const onMapPress = (e) => {
        const { latitude, longitude } = e.nativeEvent.coordinate;
        const c = { lat: latitude, lng: longitude };
        setCoord(c);
        reverse(c);
        Keyboard.dismiss();
    };

    // «моё местоположение» — осознанное действие: ставим маркер и центрируемся ближе
    const locateMe = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") return;
            const p = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced, maximumAge: 15000 });
            const c = { lat: p.coords.latitude, lng: p.coords.longitude };
            setCoord(c);
            reverse(c);
            const reg = { latitude: c.lat, longitude: c.lng, latitudeDelta: 0.08, longitudeDelta: 0.08 };
            mapRef.current?.animateToRegion(reg, 400);
            setLastRegion(reg);
        } catch { }
    };

    // поиск адреса — выбирает точку и центрирует
    const runSearch = async () => {
        const q = search.trim();
        if (!q) return;
        Keyboard.dismiss();
        try {
            const res = await Location.geocodeAsync(q);
            const g = res?.[0];
            if (!g) return;
            const c = { lat: g.latitude, lng: g.longitude };
            setCoord(c);
            reverse(c);
            const reg = { latitude: c.lat, longitude: c.lng, latitudeDelta: 0.08, longitudeDelta: 0.08 };
            mapRef.current?.animateToRegion(reg, 400);
            setLastRegion(reg);
        } catch { }
    };

    // подтверждение — только если точка выбрана
    const confirm = () => {
        if (!coord) return;
        onPick?.({ coords: coord, address });
        setSearch("");
        onClose?.();
    };

    // закрытие без выбора — очищаем локальное, lastRegion сохраняем
    const handleClose = () => {
        setCoord(null);
        setAddress("");
        setSearch("");
        onClose?.();
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
            <Pressable style={{ flex: 1, backgroundColor: "#fff" }} onPress={Keyboard.dismiss}>
                {/* КАРТА */}
                <MapView
                    ref={mapRef}
                    style={StyleSheet.absoluteFillObject}
                    onPress={onMapPress}
                    showsUserLocation
                    toolbarEnabled={false}
                    showsMyLocationButton={false}
                    // initialRegion — только при первом маунте
                    initialRegion={
                        lastRegion || { latitude: 30, longitude: 0, latitudeDelta: 40, longitudeDelta: 40 }
                    }
                >
                    {coord && (
                        <Marker
                            coordinate={{ latitude: coord.lat, longitude: coord.lng }}
                            draggable
                            onDragEnd={(e) => {
                                const { latitude, longitude } = e.nativeEvent.coordinate;
                                const c = { lat: latitude, lng: longitude };
                                setCoord(c);
                                reverse(c);
                            }}
                        />
                    )}
                </MapView>

                {/* FAB: Назад (закрывает без выбора) */}
                <TouchableOpacity
                    onPress={handleClose}
                    activeOpacity={0.9}
                    style={[
                        styles.backFab,
                        {
                            left: 16 + (insets.left || 0),
                            bottom: sheetH + (insets.bottom || 0) + 12 + lift,
                        },
                    ]}
                >
                    <Ionicons name="chevron-back" size={22} color="#0D1220" />
                </TouchableOpacity>

                {/* FAB: Моё местоположение */}
                <TouchableOpacity
                    onPress={locateMe}
                    activeOpacity={0.9}
                    style={[
                        styles.locFab,
                        {
                            right: 16 + (insets.right || 0),
                            bottom: sheetH + (insets.bottom || 0) + 12 + lift,
                        },
                    ]}
                >
                    <Ionicons name="locate" size={18} color="#0D1220" />
                </TouchableOpacity>

                {/* НИЖНЯЯ ПАНЕЛЬ */}
                <View
                    pointerEvents="box-none"
                    style={[styles.sheetAvoider, { transform: [{ translateY: -lift }] }]}
                >
                    <View
                        style={[styles.sheetWrap, { paddingBottom: (insets.bottom || 0) + 8 }]}
                        onLayout={(e) => setSheetH(e.nativeEvent.layout.height)}
                    >
                        <ScrollView
                            keyboardShouldPersistTaps="handled"
                            contentContainerStyle={{ paddingBottom: 4 }}
                            showsVerticalScrollIndicator={false}
                        >
                            <View style={styles.handle} />
                            <Text style={styles.sheetTitle}>{title}</Text>

                            {/* Поиск */}
                            <View style={styles.searchRow}>
                                <Ionicons name="search" size={16} color="#6E7781" />
                                <TextInput
                                    value={search}
                                    onChangeText={setSearch}
                                    placeholder="Поиск адреса"
                                    placeholderTextColor="#9AA4AD"
                                    style={styles.searchInput}
                                    returnKeyType="search"
                                    onSubmitEditing={runSearch}
                                />
                                {!!search && (
                                    <TouchableOpacity onPress={() => setSearch("")}>
                                        <Ionicons name="close-circle" size={18} color="#9AA4AD" />
                                    </TouchableOpacity>
                                )}
                                <TouchableOpacity style={styles.findBtn} onPress={runSearch}>
                                    <Text style={styles.findBtnText}>Найти</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Адрес выбранной точки */}
                            <Text style={styles.addrLabel}>Адрес выбранной точки</Text>
                            <View style={styles.addrBox}>
                                {loadingAddr ? (
                                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                                        <ActivityIndicator />
                                        <Text style={styles.addrText}>  Определяем адрес…</Text>
                                    </View>
                                ) : coord ? (
                                    <Text style={styles.addrText} numberOfLines={2}>{address || "—"}</Text>
                                ) : (
                                    <Text style={[styles.addrText, { color: "#9AA4AD" }]}>
                                        Точка не выбрана — нажмите на карте или выполните поиск
                                    </Text>
                                )}
                            </View>

                            <TouchableOpacity
                                style={[
                                    styles.primaryBtn,
                                    (!coord || loadingAddr) && { opacity: 0.5 },
                                ]}
                                onPress={confirm}
                                disabled={!coord || loadingAddr}
                                activeOpacity={0.95}
                            >
                                <Text style={styles.primaryText}>Выбрать место</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Pressable>
        </Modal>
    );
}

const styles = StyleSheet.create({
    // FAB
    backFab: {
        position: "absolute",
        zIndex: 5,
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: "#fff",
        alignItems: "center", justifyContent: "center",
        shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 3 },
        elevation: 4,
    },
    locFab: {
        position: "absolute",
        zIndex: 5,
        width: 44, height: 44, borderRadius: 12,
        backgroundColor: "#fff",
        alignItems: "center", justifyContent: "center",
        shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 3 },
        elevation: 4,
    },

    // нижняя панель (управляем translateY)
    sheetAvoider: {
        position: "absolute",
        left: 0, right: 0, bottom: 0,
        zIndex: 4,
    },
    sheetWrap: {
        backgroundColor: "#fff",
        borderTopLeftRadius: 18,
        borderTopRightRadius: 18,
        paddingHorizontal: 14,
        paddingTop: 8,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderColor: "#E6EAF0",
        shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 12, shadowOffset: { width: 0, height: -2 },
        elevation: 8,
    },
    handle: {
        alignSelf: "center", width: 36, height: 4, borderRadius: 2, backgroundColor: "#DDE3EA", marginBottom: 8,
    },
    sheetTitle: { fontWeight: "700", color: "#0D1220", textAlign: "center", marginBottom: 8 },

    searchRow: {
        height: 40, borderRadius: 10, backgroundColor: "#F4F6FA",
        borderWidth: 1, borderColor: "#E6EAF0",
        paddingHorizontal: 10,
        flexDirection: "row", alignItems: "center", gap: 8,
    },
    searchInput: { flex: 1, color: "#0D1220", padding: 0 },
    findBtn: {
        height: 28, paddingHorizontal: 10, borderRadius: 7,
        backgroundColor: "#2F6BFF",
        alignItems: "center", justifyContent: "center",
    },
    findBtnText: { color: "#fff", fontWeight: "700", fontSize: 12 },

    addrLabel: { color: "#6E7781", marginTop: 10, marginBottom: 6, fontSize: 12 },
    addrBox: {
        minHeight: 48, borderRadius: 10, backgroundColor: "#F4F6FA",
        borderWidth: 1, borderColor: "#E6EAF0",
        padding: 10, justifyContent: "center",
    },
    addrText: { color: "#0D1220" },

    primaryBtn: {
        marginTop: 10, marginBottom: 2,
        height: 52, borderRadius: 14,
        backgroundColor: "#2F6BFF",
        alignItems: "center", justifyContent: "center",
    },
    primaryText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
