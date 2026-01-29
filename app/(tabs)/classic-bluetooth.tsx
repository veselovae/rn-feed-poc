import Constants, { ExecutionEnvironment } from "expo-constants";
import * as IntentLauncher from "expo-intent-launcher";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  NativeModules,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import RNBluetoothClassic, {
  BluetoothDevice,
} from "react-native-bluetooth-classic";
import { ensureAndroidPermissions } from "./bluetooth-ble";

type ClassicModule = {
  isBluetoothAvailable: () => Promise<boolean>;
  isBluetoothEnabled: () => Promise<boolean>;
  getBondedDevices: () => Promise<BluetoothDevice[]>;
  isDeviceConnected: (address: string) => Promise<boolean>;
};

function openBtSettings() {
  if (Platform.OS === "android") {
    IntentLauncher.startActivityAsync(
      IntentLauncher.ActivityAction.BLUETOOTH_SETTINGS,
    );
    return;
  }
  Linking.openURL("app-settings:");
}

function deviceKey(d: BluetoothDevice) {
  return d.address ?? d.id ?? `${d.name ?? "device"}-${Math.random()}`;
}

export default function ClassicalBluetoothScreen() {
  const isExpoGo =
    Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

  const Classic = NativeModules.RNBluetoothClassic as ClassicModule | undefined;

  const [loading, setLoading] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [enabled, setEnabled] = useState<boolean | null>(null);

  const [bonded, setBonded] = useState<BluetoothDevice[]>([]);
  const [appConnected, setAppConnected] = useState<BluetoothDevice[]>([]);
  const [errorText, setErrorText] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (isExpoGo) return;

    if (!Classic) {
      setErrorText(
        "Нативный модуль Classic Bluetooth не найден. Проверь сборку (prebuild + assembleDebug) и что приложение не Expo Go.",
      );
      return;
    }

    setLoading(true);
    setErrorText(null);

    if (Platform.OS !== "android") {
      setAvailable(null);
      setEnabled(null);
      setBonded([]);
      setAppConnected([]);
      return;
    }

    try {
      const ok = await ensureAndroidPermissions();
      if (!ok) {
        Alert.alert("Разрешения", "Требуются Bluetooth разрешения");
        return;
      }

      const isAvail = await RNBluetoothClassic.isBluetoothAvailable();
      setAvailable(isAvail);

      const isEn = await RNBluetoothClassic.isBluetoothEnabled();
      setEnabled(isEn);

      const bondedDevices = await RNBluetoothClassic.getBondedDevices();
      const list = Array.isArray(bondedDevices) ? bondedDevices : [];
      setBonded(list);

      const connectedForApp: BluetoothDevice[] = [];
      for (const d of list) {
        const addr = (d as any).address as string | undefined;
        if (!addr) continue;

        try {
          const ok = await Classic.isDeviceConnected(addr);
          if (ok) connectedForApp.push(d);
        } catch {}
      }

      setAppConnected(connectedForApp);
    } catch (e: any) {
      setErrorText(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }, [Classic, isExpoGo]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const appConnectedSet = useMemo(() => {
    const s = new Set<string>();
    for (const d of appConnected) {
      const key = d.address ?? d.id;
      if (key) s.add(key);
    }
    return s;
  }, [appConnected]);

  if (isExpoGo) {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Недоступно в Expo Go</Text>
          <Text style={styles.muted}>
            Classic Bluetooth требует нативных модулей. Expo Go их не включает.
            Открой это в EAS Dev Build / Preview / Production.
          </Text>

          <Pressable
            style={[styles.button, { alignItems: "center", width: 250 }]}
            onPress={openBtSettings}
          >
            <Text style={styles.buttonText}>Открыть Bluetooth настройки</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 80 }}
    >
      <View style={styles.row}>
        <Pressable style={styles.button} onPress={openBtSettings}>
          <Text style={styles.buttonText}>Открыть Bluetooth настройки</Text>
        </Pressable>
        <Pressable
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={refresh}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Обновить</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Classic Bluetooth</Text>
        <Text style={styles.text}>
          Наушники/колонки/клавиатуры/часы подключаются через системные
          настройки Bluetooth. Приложение может показать список{" "}
          <Text style={{ fontWeight: "800" }}>сопряжённых</Text> устройств.
          Определение “подключено сейчас” для таких устройств часто недоступно.
        </Text>

        <View style={{ marginTop: 12, gap: 6 }}>
          <Text style={styles.step}>1) Откройте Bluetooth настройки</Text>
          <Text style={styles.step}>2) Включите Bluetooth</Text>
          <Text style={styles.step}>3) Сопрягите/подключите устройство</Text>
          <Text style={styles.step}>4) Вернитесь и нажмите “Обновить”</Text>
        </View>

        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Bluetooth доступен</Text>
            <Text style={styles.statusValue}>
              {available === null ? "—" : available ? "Да" : "Нет"}
            </Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Bluetooth включен</Text>
            <Text style={styles.statusValue}>
              {enabled === null ? "—" : enabled ? "Да" : "Нет"}
            </Text>
          </View>

          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Сопряжённых устройств</Text>
            <Text style={styles.statusValue}>{bonded.length}</Text>
          </View>

          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>
              Соединение с приложением (SPP/RFCOMM)
            </Text>
            <Text style={styles.statusValue}>{appConnected.length}</Text>
          </View>

          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator />
              <Text style={styles.muted}>Загрузка…</Text>
            </View>
          ) : null}

          {errorText ? (
            <Text style={[styles.muted, { marginTop: 8 }]}>
              Ошибка: {errorText}
            </Text>
          ) : null}

          {Platform.OS === "android" ? (
            <Text style={[styles.muted, { marginTop: 8 }]}>
              Примечание: “Соединение с приложением” относится только к
              устройствам, которые поддерживают Classic SPP (последовательный
              порт) и к которым приложение само может открыть соединение.
            </Text>
          ) : (
            <Text style={[styles.muted, { marginTop: 8 }]}>
              iOS: список Classic устройств и их статус обычно недоступны. Эта
              вкладка в основном про “открыть настройки” и UX.
            </Text>
          )}
        </View>

        <Text style={styles.sectionTitle}>Сопряжённые устройства</Text>

        <Pressable
          onPress={() => {
            Alert.alert(
              "Почему нельзя подключать тут?",
              "Для большинства Classic устройств (наушники/колонки/клавиатуры/часы) подключение управляется системой. Приложение показывает список сопряжённых устройств и даёт кнопку в настройки.",
              [{ text: "OK" }],
            );
          }}
        >
          <Text style={styles.link}>
            Почему нельзя подключить прямо в приложении?
          </Text>
        </Pressable>

        <FlatList
          data={bonded}
          keyExtractor={(d) => deviceKey(d)}
          scrollEnabled={false}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          contentContainerStyle={{ paddingBottom: 16 }}
          ListEmptyComponent={
            <Text style={styles.muted}>
              {Platform.OS === "android"
                ? 'Список пуст. Сопрягите устройство в настройках Bluetooth и нажмите "Обновить".'
                : "На iOS список часто недоступен."}
            </Text>
          }
          renderItem={({ item }) => {
            const addr = ((item as any).address ?? (item as any).id) as
              | string
              | undefined;
            const appConn = addr ? appConnectedSet.has(addr) : false;

            return (
              <View style={styles.deviceCard}>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={styles.deviceName} numberOfLines={1}>
                    {(item as any).name ?? "Unknown"}
                  </Text>
                  <Text style={styles.muted} numberOfLines={1}>
                    {addr ?? "—"}
                  </Text>
                  {Platform.OS === "android" ? (
                    <Text style={styles.muted}>Тип: {item.type}</Text>
                  ) : null}
                </View>

                <View style={{ alignItems: "flex-end", gap: 6 }}>
                  <Text style={[styles.badge, styles.badgeOff]}>Сопряжено</Text>
                  {appConn ? (
                    <Text style={[styles.badge, styles.badgeOn]}>
                      Соединение с приложением
                    </Text>
                  ) : null}
                </View>
              </View>
            );
          }}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12, paddingBottom: 70 },
  sectionTitle: { fontSize: 14, fontWeight: "800", marginTop: 4 },

  muted: { color: "#666" },
  link: { color: "#2a6", fontWeight: "700", fontSize: 12 },

  row: { flexDirection: "row", gap: 10, flexWrap: "wrap" },

  card: {
    backgroundColor: "#f3f3f3",
    paddingTop: 12,
    paddingBottom: 12,
    borderRadius: 12,
    gap: 10,
  },
  cardTitle: { fontWeight: "800", fontSize: 16 },
  text: { color: "#444" },

  button: {
    backgroundColor: "#111",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  buttonDisabled: { opacity: 0.45 },
  buttonText: { color: "#fff", fontWeight: "700" },

  step: { color: "#333" },

  statusCard: {
    backgroundColor: "#eef7ff",
    padding: 12,
    borderRadius: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: "#cfe6ff",
  },
  statusRow: { flexDirection: "row", justifyContent: "space-between" },
  statusLabel: { color: "#333", fontWeight: "700" },
  statusValue: { color: "#333", fontWeight: "800" },

  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },

  deviceCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#f3f3f3",
    padding: 12,
    borderRadius: 12,
  },
  deviceName: { fontSize: 14, fontWeight: "800" },

  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    fontWeight: "800",
    fontSize: 12,
    overflow: "hidden",
  },
  badgeOn: { backgroundColor: "#d9f7df", color: "#1c7a2b" },
  badgeOff: { backgroundColor: "#eee", color: "#333" },
});
