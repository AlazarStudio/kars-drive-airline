import React, { useMemo, useState, useEffect } from "react";
import {
    View, Text, StyleSheet, ScrollView, TextInput,
    TouchableOpacity, Alert, KeyboardAvoidingView, Platform
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import EmployeePickerModal from "../components/EmployeePickerModal";
import MapPickerModal from "../components/MapPickerModal";
import DateTimePicker from "@react-native-community/datetimepicker";

import { useNavigation } from "@react-navigation/native";

const VEH_GROUPS = [
    { key: "1-4", label: "1-4" },
    { key: "6-8", label: "6-8" },
    { key: "10-15", label: "10-15" },
    { key: "30-40", label: "30-40" },
];

function chooseGroupByCount(n) {
    if (n <= 4) return "1-4";
    if (n <= 8) return "6-8";
    if (n <= 15) return "10-15";
    return "30-40";
}

const fmt = (isoOrText) => {
    const d = new Date(isoOrText);
    if (isNaN(d)) return isoOrText || "—";
    return d.toLocaleString("ru-RU", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

export default function AirlineHomeScreen() {
    const navigation = useNavigation(); // <-- добавили

    const [activeOrder, setActiveOrder] = useState(null);

    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const [fromCoords, setFromCoords] = useState(null);
    const [toCoords, setToCoords] = useState(null);

    const [employees, setEmployees] = useState([]);
    const [vehGroup, setVehGroup] = useState("1-4");
    const [notes, setNotes] = useState("");

    const [empModal, setEmpModal] = useState(false);
    const [mapModal, setMapModal] = useState({ open: false, target: "from" });

    const [date, setDate] = useState(new Date());
    const [showDate, setShowDate] = useState(false);
    const [showTime, setShowTime] = useState(false);

    const fmtDate = (d) =>
        d.toLocaleDateString("ru-RU", { day: "2-digit", month: "long", year: "numeric" });
    const fmtTime = (d) =>
        d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });

    useEffect(() => {
        setVehGroup(chooseGroupByCount(employees.length || 1));
    }, [employees.length]);

    const canCreate = useMemo(() => {
        return from.trim() && to.trim() && employees.length > 0;
    }, [from, to, employees.length]);

    const resetForm = () => {
        setFrom("");
        setTo("");
        setFromCoords(null);
        setToCoords(null);
        setEmployees([]);
        setVehGroup("1-4");      // или оставить на автоподбор через useEffect
        setNotes("");
        setDate(new Date());     // или поставь null, если хочешь пустое
        setShowDate(false);
        setShowTime(false);
        setEmpModal(false);
        setMapModal({ open: false, target: "from" });
    };

    const createOrder = () => {
        if (!canCreate) {
            return Alert.alert("Заполните поля", "Откуда, Куда и выберите сотрудников");
        }
        const id = String(Math.floor(Math.random() * 100000));
        const order = {
            id,
            status: "pending",
            from,
            to,
            date: date.toISOString(),
            fromCoords,
            toCoords,
            employees,
            requirements: {
                pax: Math.max(1, employees.length),
                vehicleGroup: vehGroup,
                notes,
            },
            // ---- добавили timeline и ratings ----
            timeline: {
                createdAt: new Date().toISOString(),
                assignedAt: null,
                arrivedAtPickup: null,
                departedAt: null,
                arrivedAtDropoff: null,
                finishedAt: null,
                travelTimeSec: null,
            },
            ratings: { driver: null, passenger: null },
        };
        setActiveOrder(order);
        resetForm();
        Alert.alert("Заявка создана", `#${id} отправлена диспетчеру`);
    };

    if (activeOrder) {
        const o = activeOrder;
        return (
            <SafeAreaView style={styles.safe} edges={["top"]}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Заявка #{o.id}</Text>
                    <View style={{ width: 24 }} />
                </View>

                <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
                    <Text style={styles.sectionTitle}>Маршрут</Text>
                    <View style={styles.card}>
                        <Text style={styles.row}>Откуда: <Text style={styles.bold}>{o.from}</Text></Text>
                        <Text style={[styles.row, { marginTop: 6 }]}>Куда: <Text style={styles.bold}>{o.to}</Text></Text>
                        <Text style={[styles.row, { marginTop: 6 }]}>Когда: <Text style={styles.bold}>{fmt(o.date)}</Text></Text>
                    </View>

                    <Text style={styles.sectionTitle}>Сотрудники ({o.employees.length})</Text>
                    <View style={styles.card}>
                        {o.employees.map(e => (
                            <View key={e.id} style={styles.empRow}>
                                <Ionicons name="person-circle-outline" size={20} color="#6E7781" />
                                <Text style={styles.empText}>{e.name}{e.dept ? ` • ${e.dept}` : ""}</Text>
                            </View>
                        ))}
                    </View>

                    <Text style={styles.sectionTitle}>Параметры</Text>
                    <View style={styles.card}>
                        <Text style={styles.row}>Пассажиров: <Text style={styles.bold}>{o.employees.length}</Text></Text>
                        <Text style={[styles.row, { marginTop: 6 }]}>Машина: <Text style={styles.bold}>{o.requirements.vehicleGroup}</Text></Text>
                    </View>

                    <Text style={styles.sectionTitle}>Комментарий</Text>
                    <View style={styles.grayBox}><Text style={styles.grayText}>{o.requirements.notes || "—"}</Text></View>

                    <Text style={styles.sectionTitle}>Хронология</Text>
                    <View style={styles.card}>
                        <Row label="Время заявки" value={fmt(o.timeline?.createdAt)} />
                        <Row label="Назначен водитель" value={o.timeline?.assignedAt ? fmt(o.timeline.assignedAt) : "—"} />
                        <Row label="Прибыл к пассажиру" value={o.timeline?.arrivedAtPickup ? fmt(o.timeline.arrivedAtPickup) : "—"} />
                        <Row label="Выехали" value={o.timeline?.departedAt ? fmt(o.timeline.departedAt) : "—"} />
                        <Row label="Прибытие" value={o.timeline?.arrivedAtDropoff ? fmt(o.timeline.arrivedAtDropoff) : "—"} />
                        <Row label="Завершение поездки" value={o.timeline?.finishedAt ? fmt(o.timeline.finishedAt) : "—"} />
                        <Row
                            label="Время в пути"
                            value={o.timeline?.travelTimeSec ? `${Math.floor(o.timeline.travelTimeSec / 60)} мин` : "—"}
                        />
                    </View>

                    <TouchableOpacity
                        style={styles.routeBtn}
                        onPress={() => {
                            if (!o.fromCoords || !o.toCoords) {
                                return Alert.alert(
                                    "Маршрут",
                                    "Нужно выбрать координаты ‘Откуда’ и ‘Куда’. Откройте карту и задайте точки."
                                );
                            }
                            navigation.navigate("RoutePreview", {
                                fromLabel: o.from,
                                toLabel: o.to,
                                fromCoords: o.fromCoords,
                                toCoords: o.toCoords,
                            });
                        }}
                        activeOpacity={0.9}
                    >
                        <Ionicons name="map-outline" size={18} color="#2F6BFF" style={{ marginRight: 8 }} />
                        <Text style={styles.routeBtnText}>Просмотр маршрута</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.dangerBtn, { marginTop: 16 }]}
                        onPress={() => Alert.alert("Отменить", "Вы уверены?", [
                            { text: "Нет" },
                            { text: "Да", style: "destructive", onPress: () => {setActiveOrder(null); resetForm();} },
                        ])}
                        activeOpacity={0.9}
                    >
                        <Text style={styles.dangerText}>Отменить заявку</Text>
                    </TouchableOpacity>
                </ScrollView>
            </SafeAreaView>
        );
    }

    // ===== Форма создания =====
    return (
        <SafeAreaView style={styles.safe} edges={["top"]}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Создать заявку</Text>
                <View style={{ width: 24 }} />
            </View>

            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
                <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }} keyboardShouldPersistTaps="handled">
                    {/* ОТКУДА */}
                    <Text style={styles.label}>ОТКУДА</Text>
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => setMapModal({ open: true, target: "from" })}
                    >
                        <View style={styles.inputWrap}>
                            <TextInput
                                value={from}
                                placeholder="Выбрать на карте"
                                placeholderTextColor="#9AA4AD"
                                style={styles.input}
                                editable={false}
                                showSoftInputOnFocus={false}   // не показывать клавиатуру
                                pointerEvents="none"           // чтобы TouchableOpacity ловил тап
                            />
                        </View>
                    </TouchableOpacity>
                    {!!fromCoords && (
                        <Text style={styles.coords}>
                            lat {fromCoords.lat?.toFixed(5)}, lng {fromCoords.lng?.toFixed(5)}
                        </Text>
                    )}

                    {/* КУДА */}
                    <Text style={[styles.label, { marginTop: 12 }]}>КУДА</Text>
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => setMapModal({ open: true, target: "to" })}
                    >
                        <View style={styles.inputWrap}>
                            <TextInput
                                value={to}
                                placeholder="Выбрать на карте"
                                placeholderTextColor="#9AA4AD"
                                style={styles.input}
                                editable={false}
                                showSoftInputOnFocus={false}
                                pointerEvents="none"
                            />
                        </View>
                    </TouchableOpacity>
                    {!!toCoords && (
                        <Text style={styles.coords}>
                            lat {toCoords.lat?.toFixed(5)}, lng {toCoords.lng?.toFixed(5)}
                        </Text>
                    )}


                    {/* Сотрудники */}
                    <Text style={styles.sectionTitle}>Сотрудники</Text>
                    <TouchableOpacity style={styles.selectBtn} onPress={() => setEmpModal(true)}>
                        <Ionicons name="people-outline" size={18} color="#2F6BFF" />
                        <Text style={styles.selectText}>Выбрать {employees.length ? `(${employees.length})` : ""}</Text>
                    </TouchableOpacity>

                    {/* Кол-во → авто выбор машины + возможность ручного переключения */}
                    <Text style={styles.sectionTitle}>Количество пассажиров</Text>
                    <View style={styles.vehRow}>
                        {VEH_GROUPS.map(g => {
                            const on = vehGroup === g.key;
                            return (
                                <TouchableOpacity key={g.key} onPress={() => setVehGroup(g.key)} style={[styles.vehBtn, on && styles.vehBtnOn]} activeOpacity={0.85}>
                                    <Text style={[styles.vehText, on && { color: "#fff" }]}>{g.label}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                    <Text style={styles.help}>Автовыбор: {chooseGroupByCount(employees.length || 1)} (по числу сотрудников)</Text>

                    {/* Дата/время */}
                    <Text style={styles.label}>ДАТА И ВРЕМЯ</Text>
                    <View style={{ flexDirection: "row", gap: 8 }}>
                        <TouchableOpacity style={[styles.inputWrap, { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }]}
                            onPress={() => setShowDate(true)} activeOpacity={0.8}>
                            <Text style={styles.input}>{fmtDate(date)}</Text>
                            <Ionicons name="calendar-outline" size={18} color="#6E7781" />
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.inputWrap, { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }]}
                            onPress={() => setShowTime(true)} activeOpacity={0.8}>
                            <Text style={styles.input}>{fmtTime(date)}</Text>
                            <Ionicons name="time-outline" size={18} color="#6E7781" />
                        </TouchableOpacity>
                    </View>

                    {/* Pickers (Android — модалка, iOS — встраивается) */}
                    {showDate && (
                        <DateTimePicker
                            value={date}
                            mode="date"
                            display={Platform.OS === "ios" ? "spinner" : "default"}
                            minimumDate={new Date()}          // нельзя выбрать прошлое
                            onChange={(e, d) => {
                                setShowDate(false);
                                if (d) {
                                    const nd = new Date(date);
                                    nd.setFullYear(d.getFullYear(), d.getMonth(), d.getDate());
                                    setDate(nd);
                                }
                            }}
                        />
                    )}
                    {showTime && (
                        <DateTimePicker
                            value={date}
                            mode="time"
                            display={Platform.OS === "ios" ? "spinner" : "default"}
                            onChange={(e, t) => {
                                setShowTime(false);
                                if (t) {
                                    const nd = new Date(date);
                                    nd.setHours(t.getHours(), t.getMinutes(), 0, 0);
                                    setDate(nd);
                                }
                            }}
                        />
                    )}


                    {/* Комментарий */}
                    <Text style={styles.label}>КОММЕНТАРИЙ</Text>
                    <View style={[styles.inputWrap, { minHeight: 80 }]}>
                        <TextInput value={notes} onChangeText={setNotes} style={styles.input} multiline placeholder="Пожелания" />
                    </View>

                    <TouchableOpacity style={[styles.createBtn, !canCreate && { opacity: 0.5 }]} onPress={createOrder} disabled={!canCreate}>
                        <Text style={styles.createText}>Создать заявку</Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* модалки */}
            <EmployeePickerModal
                visible={empModal}
                initial={employees}
                onDone={(list) => setEmployees(list)}
                onClose={() => setEmpModal(false)}
            />
            <MapPickerModal
                visible={mapModal.open}
                initial={mapModal.target === "from" ? fromCoords : toCoords}  // ← сюда
                title={mapModal.target === "from" ? "Точка подачи" : "Точка назначения"}
                onClose={() => setMapModal({ open: false, target: "from" })}
                onPick={({ coords, address }) => {
                    if (mapModal.target === "from") {
                        setFrom(address || "");
                        setFromCoords(coords);
                    } else {
                        setTo(address || "");
                        setToCoords(coords);
                    }
                    setMapModal({ open: false, target: "from" });
                }}
            />

        </SafeAreaView>
    );
}

function Row({ label, value }) {
    return (
        <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 }}>
            <Text style={{ color: "#6E7781" }}>{label}</Text>
            <Text style={{ color: "#0D1220", fontWeight: "700", marginLeft: 12 }}>{value || "—"}</Text>
        </View>
    );
}


const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: "#fff" },
    header: {
        height: 48, paddingHorizontal: 16,
        borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#E6EAF0",
        flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    },
    headerTitle: { fontSize: 18, fontWeight: "700", color: "#0D1220" },

    label: { color: "#8E98A3", fontSize: 12, fontWeight: "700", marginTop: 12, marginBottom: 6 },
    sectionTitle: { marginTop: 16, marginBottom: 8, fontWeight: "700", color: "#0D1220" },

    inputWrap: {
        backgroundColor: "#F4F6FA", borderRadius: 12, borderWidth: 1, borderColor: "#E6EAF0",
        paddingHorizontal: 14, minHeight: 48, justifyContent: "center",
    },
    input: { color: "#0D1220", paddingVertical: 0 },

    rowInput: { flexDirection: "row", alignItems: "center", gap: 8 },
    mapBtn: {
        height: 48, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: "#B9C7FF",
        backgroundColor: "#EEF3FF", flexDirection: "row", alignItems: "center", gap: 6,
    },
    mapBtnText: { color: "#2F6BFF", fontWeight: "700" },
    coords: { color: "#6E7781", marginTop: 4, marginLeft: 4, fontSize: 12 },

    selectBtn: {
        height: 44, borderRadius: 10, borderWidth: 1, borderColor: "#B9C7FF",
        backgroundColor: "#EEF3FF", alignItems: "center", justifyContent: "center", flexDirection: "row",
        gap: 8,
    },
    selectText: { color: "#2F6BFF", fontWeight: "700" },

    vehRow: { flexDirection: "row", gap: 8 },
    vehBtn: { flex: 1, height: 44, borderRadius: 12, borderWidth: 1, borderColor: "#E6EAF0", alignItems: "center", justifyContent: "center", backgroundColor: "#F4F6FA" },
    vehBtnOn: { backgroundColor: "#2F6BFF", borderColor: "#2F6BFF" },
    vehText: { color: "#0D1220", fontWeight: "700" },
    help: { color: "#6E7781", fontSize: 12, marginTop: 6 },

    createBtn: { marginTop: 18, backgroundColor: "#2F6BFF", height: 56, borderRadius: 16, alignItems: "center", justifyContent: "center" },
    createText: { color: "#fff", fontSize: 16, fontWeight: "700" },

    // активная заявка
    card: { backgroundColor: "#fff", borderRadius: 14, borderWidth: 1, borderColor: "#E6EAF0", padding: 12 },
    row: { color: "#0D1220" },
    bold: { fontWeight: "700" },
    grayBox: { backgroundColor: "#F4F6FA", borderRadius: 10, borderWidth: 1, borderColor: "#E6EAF0", minHeight: 44, paddingHorizontal: 12, justifyContent: "center" },
    grayText: { color: "#6E7781" },
    dangerBtn: { height: 48, borderRadius: 12, borderWidth: 1, borderColor: "#F6CDD0", alignItems: "center", justifyContent: "center", backgroundColor: "#FDEEEF" },
    dangerText: { color: "#E53935", fontWeight: "700" },
    empRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 6 },
    empText: { color: "#0D1220", flex: 1 },
    routeBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#EEF3FF",
        borderColor: "#B9C7FF",
        borderWidth: 1,
        borderRadius: 12,
        height: 48,
        marginTop: 12,
    },
    routeBtnText: {
        color: "#2F6BFF",
        fontWeight: "700",
        fontSize: 15,
    },

});
