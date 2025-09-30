// src/components/EmployeePickerModal.js
import React, { useEffect, useMemo, useState } from "react";
import {
    Modal, View, Text, StyleSheet, TouchableOpacity,
    FlatList, TextInput, Pressable
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const MOCK_EMPLOYEES = [
    { id: "e1", name: "Иванов Иван", dept: "Экипаж" },
    { id: "e2", name: "Петров Пётр", dept: "Техслужба" },
    { id: "e3", name: "Сидорова Анна", dept: "Кабинный экипаж" },
    { id: "e4", name: "Алиев Камиль", dept: "Офис" },
];

export default function EmployeePickerModal({ visible, onClose, initial = [], onDone }) {
    const [q, setQ] = useState("");
    const [selected, setSelected] = useState(new Map());

    useEffect(() => {
        if (visible) {
            setSelected(new Map(initial.map(e => [e.id, e])));
            setQ("");
        }
    }, [visible]);

    const data = useMemo(() => {
        const s = q.trim().toLowerCase();
        if (!s) return MOCK_EMPLOYEES;
        return MOCK_EMPLOYEES.filter(e =>
            e.name.toLowerCase().includes(s) || (e.dept?.toLowerCase().includes(s))
        );
    }, [q]);

    const toggle = (emp) => {
        setSelected(prev => {
            const next = new Map(prev);
            if (next.has(emp.id)) next.delete(emp.id);
            else next.set(emp.id, emp);
            return next;
        });
    };

    const done = () => {
        onDone?.(Array.from(selected.values()));
        onClose?.();
    };

    return (
        <Modal visible={visible} transparent animationType="slide">
            <Pressable style={styles.backdrop} onPress={onClose} />
            <View style={styles.sheet}>
                <View style={styles.handle} />
                <View style={styles.header}>
                    <Text style={styles.title}>Сотрудники</Text>
                    <TouchableOpacity onPress={done}><Text style={styles.link}>Готово</Text></TouchableOpacity>
                </View>

                <View style={styles.search}>
                    <Ionicons name="search" size={16} color="#6E7781" />
                    <TextInput
                        value={q}
                        onChangeText={setQ}
                        placeholder="Поиск по имени или отделу"
                        placeholderTextColor="#9AA4AD"
                        style={styles.searchInput}
                    />
                </View>

                <FlatList
                    data={data}
                    keyExtractor={(i) => i.id}
                    contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
                    ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
                    renderItem={({ item }) => {
                        const on = selected.has(item.id);
                        return (
                            <TouchableOpacity style={styles.row} onPress={() => toggle(item)} activeOpacity={0.85}>
                                <Ionicons name={on ? "checkbox-outline" : "square-outline"} size={20} color={on ? "#2F6BFF" : "#6E7781"} />
                                <View style={{ marginLeft: 10, flex: 1 }}>
                                    <Text style={styles.name}>{item.name}</Text>
                                    {!!item.dept && <Text style={styles.dept}>{item.dept}</Text>}
                                </View>
                            </TouchableOpacity>
                        );
                    }}
                />

                <View style={styles.footer}>
                    <Text style={{ color: "#6E7781" }}>Выбрано: {selected.size}</Text>
                    <TouchableOpacity style={styles.primaryBtn} onPress={done} activeOpacity={0.9}>
                        <Text style={styles.primaryText}>Добавить</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.35)" },
    sheet: {
        position: "absolute", left: 0, right: 0, bottom: 0,
        backgroundColor: "#fff", borderTopLeftRadius: 18, borderTopRightRadius: 18, maxHeight: "85%",
    },
    handle: { width: 34, height: 4, borderRadius: 2, backgroundColor: "#DDE3EA", alignSelf: "center", marginTop: 8, marginBottom: 4 },
    header: {
        height: 48, paddingHorizontal: 16, borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: "#E6EAF0", flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    },
    title: { fontSize: 16, fontWeight: "700", color: "#0D1220" },
    link: { color: "#2F6BFF", fontWeight: "700" },

    search: {
        marginHorizontal: 16, marginTop: 12, paddingHorizontal: 12, height: 40,
        borderRadius: 10, backgroundColor: "#F4F6FA", borderWidth: 1, borderColor: "#E6EAF0",
        flexDirection: "row", alignItems: "center", gap: 8,
    },
    searchInput: { flex: 1, color: "#0D1220", padding: 0 },

    row: {
        backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: "#E6EAF0",
        padding: 12, flexDirection: "row", alignItems: "center",
    },
    name: { color: "#0D1220", fontWeight: "700" },
    dept: { color: "#6E7781", marginTop: 2, fontSize: 12 },

    footer: {
        borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#E6EAF0",
        padding: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    },
    primaryBtn: { backgroundColor: "#2F6BFF", height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center", paddingHorizontal: 16 },
    primaryText: { color: "#fff", fontWeight: "700" },
});
