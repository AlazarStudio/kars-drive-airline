// src/screens/RoutePreviewScreen.js
import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

// Маршрут по дорогам через публичный OSRM
async function fetchRouteOSRM(origin, destination) {
  const o = `${origin.longitude},${origin.latitude}`;
  const d = `${destination.longitude},${destination.latitude}`;
  const url = `https://router.project-osrm.org/route/v1/driving/${o};${d}?overview=full&geometries=geojson`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`OSRM ${res.status}`);
  const data = await res.json();
  if (!data.routes?.length) throw new Error("OSRM: route not found");

  const route = data.routes[0];
  const coords = route.geometry.coordinates.map(([lon, lat]) => ({
    latitude: lat,
    longitude: lon,
  }));
  return {
    coords,
    distanceKm: route.distance / 1000,
    durationMin: route.duration / 60,
  };
}

export default function RoutePreviewScreen({ navigation, route }) {
  const { fromLabel, toLabel, fromCoords, toCoords } = route.params || {};
  const mapRef = useRef(null);
  const insets = useSafeAreaInsets();

  const origin = fromCoords && { latitude: fromCoords.lat, longitude: fromCoords.lng };
  const destination = toCoords && { latitude: toCoords.lat, longitude: toCoords.lng };

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [line, setLine] = useState([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function buildRoute() {
      if (!origin || !destination) return;
      setLoading(true);
      try {
        const r = await fetchRouteOSRM(origin, destination);
        if (cancelled) return;
        setLine(r.coords);
        setSummary({ distanceKm: r.distanceKm, durationMin: r.durationMin });
        mapRef.current?.fitToCoordinates(r.coords, {
          edgePadding: { top: 60, right: 60, bottom: 200, left: 60 },
          animated: true,
        });
      } catch (e) {
        if (cancelled) return;
        setLine([origin, destination]);
        setSummary(null);
        Alert.alert("Маршрут", "Не удалось получить маршрут по дорогам. Показана прямая линия.");
        mapRef.current?.fitToCoordinates([origin, destination], {
          edgePadding: { top: 60, right: 60, bottom: 200, left: 60 },
          animated: true,
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    buildRoute();
    return () => { cancelled = true; };
  }, [fromCoords, toCoords]);

  const moveToUser = async () => {
    mapRef.current?.animateToRegion({
      latitude: origin?.latitude || 55.7558,
      longitude: origin?.longitude || 37.6176,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    }, 500);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        showsUserLocation
        initialRegion={{
          latitude: fromCoords?.lat || 55.7558,
          longitude: fromCoords?.lng || 37.6176,
          latitudeDelta: 0.08,
          longitudeDelta: 0.08,
        }}
      >
        {origin && (
          <Marker coordinate={origin} title="Откуда" description={fromLabel} pinColor="green" />
        )}
        {destination && (
          <Marker coordinate={destination} title="Куда" description={toLabel} pinColor="red" />
        )}
        {line.length >= 2 && (
          <Polyline coordinates={line} strokeWidth={5} strokeColor="#2F6BFF" />
        )}
      </MapView>

      {/* Кнопка "моё местоположение" в развёрнутом состоянии */}
      {expanded && (
        <TouchableOpacity style={styles.fabLocate} onPress={moveToUser} activeOpacity={0.9}>
          <Ionicons name="locate-outline" size={22} color="#0D1220" />
        </TouchableOpacity>
      )}

      {/* НИЖНЯЯ ЗОНА */}
      <SafeAreaView edges={["bottom"]} style={styles.bottomWrap}>
        {expanded ? (
          // Развёрнутая карточка
          <View style={styles.bottomCard}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8, justifyContent: "space-between" }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
                  <Ionicons name="chevron-back" size={20} color="#0D1220" />
                </TouchableOpacity>
                <Text style={styles.title}>Маршрут</Text>
              </View>
              <TouchableOpacity onPress={() => setExpanded(false)}>
                <Text style={{ color: "#2F6BFF", fontWeight: "700" }}>Скрыть</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.addrTitle}>Откуда</Text>
            <Text style={styles.addrText}>{fromLabel}</Text>

            <Text style={[styles.addrTitle, { marginTop: 10 }]}>Куда</Text>
            <Text style={styles.addrText}>{toLabel}</Text>

            <View style={styles.divider} />

            {loading ? (
              <View style={styles.rowCenter}>
                <ActivityIndicator />
                <Text style={{ marginLeft: 8, color: "#6E7781" }}>Строим маршрут…</Text>
              </View>
            ) : summary ? (
              <View style={styles.rowBetween}>
                <Text style={styles.sumText}>Расстояние: {summary.distanceKm.toFixed(1)} км</Text>
                <Text style={styles.sumText}>В пути: {Math.round(summary.durationMin)} мин</Text>
              </View>
            ) : (
              <Text style={{ color: "#6E7781" }}>Показана прямая линия</Text>
            )}
          </View>
        ) : (
          // Свёрнуто: Назад + Подробнее + Моё местоположение
          <View style={styles.compactBar}>
            <TouchableOpacity style={[styles.flatBtn, styles.flatBack]} onPress={() => navigation.goBack()} activeOpacity={0.9}>
              <Ionicons name="chevron-back" size={18} color="#0D1220" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.flatBtn, styles.flatMore]} onPress={() => setExpanded(true)} activeOpacity={0.9}>
              <Ionicons name="information-circle-outline" size={18} color="#2F6BFF" />
              <Text style={[styles.flatText, { color: "#2F6BFF" }]}>Подробнее</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.flatBtn, styles.flatLocateBtn]} onPress={moveToUser} activeOpacity={0.9}>
              <Ionicons name="locate-outline" size={20} color="#0D1220" />
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomWrap: { position: "absolute", left: 0, right: 0, bottom: 0 },

  // развёрнутая карточка
  bottomCard: {
    margin: 12,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.96)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E6EAF0",
    shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: -2 },
  },
  iconBtn: {
    width: 36, height: 36, borderRadius: 8,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "#F4F6FA", marginRight: 8,
  },
  title: { fontSize: 16, fontWeight: "700", color: "#0D1220" },
  addrTitle: { color: "#6E7781", fontSize: 12, fontWeight: "700", marginTop: 6 },
  addrText: { color: "#0D1220", marginTop: 2 },
  divider: { height: 1, backgroundColor: "#E6EAF0", marginVertical: 10 },
  rowCenter: { flexDirection: "row", alignItems: "center" },
  rowBetween: { flexDirection: "row", justifyContent: "space-between" },
  sumText: { color: "#0D1220", fontWeight: "700" },

  // свёрнутая нижняя панель
  compactBar: {
    margin: 12,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E6EAF0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: -2 },
  },
  flatBtn: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  flatBack: { width: 44, borderColor: "#E6EAF0", backgroundColor: "#F4F6FA" },
  flatMore: { flex: 1, borderColor: "#B9C7FF", backgroundColor: "#EEF3FF" },
  flatLocateBtn: { width: 44, height: 44, borderColor: "#E6EAF0", backgroundColor: "#F4F6FA" },
  flatText: { fontWeight: "700", color: "#0D1220" },

  // плавающая кнопка в развёрнутом состоянии
  fabLocate: {
    position: "absolute",
    right: 20,
    bottom: 280,
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E6EAF0",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
});
