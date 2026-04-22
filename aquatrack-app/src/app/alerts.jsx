import { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Swipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import { RectButton } from "react-native-gesture-handler";
import { useFocusEffect } from "@react-navigation/native";
import { theme } from "../theme";
import { getAlertHistory, saveAlertHistory } from "../services/alerts";

const colorByLevel = {
  critical: "#7f1d1d",
  warning: "#78350f",
  info: "#1e3a8a",
};

export default function AlertsScreen() {
  const [alerts, setAlerts] = useState([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    (async () => {
      const loaded = await getAlertHistory();
      setAlerts(loaded);
    })();
  }, []);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const loaded = await getAlertHistory();
        setAlerts(loaded);
      })();
    }, [])
  );

  const filtered = useMemo(() => {
    if (filter === "all") return alerts;
    return alerts.filter((item) => item.level === filter);
  }, [alerts, filter]);

  const activeAlert = filtered[0] || alerts[0];

  const dismissOne = async (id) => {
    const next = alerts.filter((a) => a.id !== id);
    setAlerts(next);
    await saveAlertHistory(next);
  };

  const clearAll = async () => {
    setAlerts([]);
    await saveAlertHistory([]);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.activeCard, { backgroundColor: colorByLevel[activeAlert?.level] || theme.colors.card }]}>
        <Text style={styles.activeTitle}>{activeAlert ? `${activeAlert.level.toUpperCase()} ALERT` : "No active alerts"}</Text>
        {activeAlert ? (
          <>
            <Text style={styles.activeMsg}>{activeAlert.message}</Text>
            <Text style={styles.activeMeta}>{new Date(activeAlert.createdAt).toLocaleString()}</Text>
          </>
        ) : (
          <Text style={styles.activeMeta}>Save predictions to generate alerts.</Text>
        )}
      </View>

      <View style={styles.tabs}>
        {["all", "critical", "warning", "info"].map((tab) => (
          <TouchableOpacity key={tab} style={[styles.tab, filter === tab && styles.tabOn]} onPress={() => setFilter(tab)}>
            <Text style={[styles.tabText, filter === tab && styles.tabTextOn]}>{tab[0].toUpperCase() + tab.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={<Text style={styles.empty}>No alerts in this filter.</Text>}
        renderItem={({ item }) => (
          <Swipeable
            renderRightActions={() => (
              <RectButton style={styles.deleteAction} onPress={() => dismissOne(item.id)}>
                <Text style={styles.deleteText}>Dismiss</Text>
              </RectButton>
            )}
          >
            <View style={styles.row}>
              <Text style={styles.icon}>{item.level === "critical" ? "⛔" : item.level === "warning" ? "⚠️" : "ℹ️"}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowMessage}>{item.message}</Text>
                <Text style={styles.rowMeta}>
                  {timeAgo(item.createdAt)} - {Math.round(Number(item.score || 0) * 100)}%
                </Text>
              </View>
            </View>
          </Swipeable>
        )}
      />

      <TouchableOpacity style={styles.clearBtn} onPress={clearAll}>
        <Text style={styles.clearTxt}>Clear All</Text>
      </TouchableOpacity>
    </View>
  );
}

function timeAgo(dateString) {
  const diff = Date.now() - new Date(dateString).getTime();
  const mins = Math.max(1, Math.floor(diff / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background, padding: 16 },
  activeCard: { borderRadius: 14, borderWidth: 1, borderColor: theme.colors.border, padding: 14, marginBottom: 10 },
  activeTitle: { color: "#fff", fontFamily: theme.fonts.bodyBold, fontSize: 14 },
  activeMsg: { color: "#fff", fontFamily: theme.fonts.body, marginTop: 6, lineHeight: 18 },
  activeMeta: { color: "#dbeafe", fontFamily: theme.fonts.body, marginTop: 6, fontSize: 12 },
  tabs: { flexDirection: "row", gap: 6, marginBottom: 10 },
  tab: { flex: 1, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 10, paddingVertical: 8, alignItems: "center" },
  tabOn: { backgroundColor: theme.colors.cyan, borderColor: theme.colors.cyan },
  tabText: { color: theme.colors.text, fontFamily: theme.fonts.body, fontSize: 12 },
  tabTextOn: { color: theme.colors.background, fontFamily: theme.fonts.bodyBold },
  row: { backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, padding: 10, marginBottom: 8, flexDirection: "row", gap: 8, alignItems: "center" },
  icon: { fontSize: 16 },
  rowMessage: { color: theme.colors.text, fontFamily: theme.fonts.body, fontSize: 12, lineHeight: 18 },
  rowMeta: { color: theme.colors.muted, fontFamily: theme.fonts.body, marginTop: 4, fontSize: 11 },
  empty: { color: theme.colors.muted, fontFamily: theme.fonts.body, textAlign: "center", marginTop: 16 },
  deleteAction: { backgroundColor: theme.colors.high, width: 90, justifyContent: "center", alignItems: "center", marginBottom: 8, borderRadius: 12 },
  deleteText: { color: "#fff", fontFamily: theme.fonts.bodyBold },
  clearBtn: { marginTop: 6, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 10, paddingVertical: 11, alignItems: "center" },
  clearTxt: { color: theme.colors.text, fontFamily: theme.fonts.bodyBold },
});
