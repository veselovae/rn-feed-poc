import Constants, { ExecutionEnvironment } from "expo-constants";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  PermissionsAndroid,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { BleManager, Device } from "react-native-ble-plx";
import { describeCharacteristic, describeService, flagsShort } from "../utils";

type UiDevice = {
  id: string;
  name: string;
  rssi?: number | null;
};

export type DiscoveredChar = {
  uuid: string;
  isReadable?: boolean;
  isWritableWithResponse?: boolean;
  isWritableWithoutResponse?: boolean;
  isNotifiable?: boolean;
  isIndicatable?: boolean;
};

type DiscoveredService = {
  uuid: string;
  characteristics: DiscoveredChar[];
};

export async function ensureAndroidPermissions() {
  if (Platform.OS !== "android") return true;

  const apiLevel = Number(Platform.Version);

  if (apiLevel >= 31) {
    const scan = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
    );
    const connect = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
    );

    return scan === "granted" && connect === "granted";
  } else {
    const fine = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    );
    return fine === "granted";
  }
}

export default function BluetoothScreen() {
  const managerRef = useRef<BleManager | null>(null);

  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState<Record<string, UiDevice>>({});
  const [connected, setConnected] = useState<Device | null>(null);

  const [isConnecting, setIsConnecting] = useState(false);
  const [connectedCheck, setConnectedCheck] = useState<string>("-");
  const [services, setServices] = useState<DiscoveredService[]>([]);

  const isExpoGo =
    Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

  useEffect(() => {
    if (isExpoGo) return;

    managerRef.current = new BleManager();

    return () => {
      managerRef.current?.destroy();
      managerRef.current = null;
    };
  }, []);

  const devicesList = useMemo(
    () =>
      Object.values(devices).sort(
        (a, b) => (b.rssi ?? -999) - (a.rssi ?? -999),
      ),
    [devices],
  );

  const startScan = async () => {
    const manager = managerRef.current;
    if (!manager) return;

    setDevices({});
    setServices([]);
    setConnected(null);
    setConnectedCheck("-");

    setIsScanning(true);

    try {
      const ok = await ensureAndroidPermissions();
      if (!ok) {
        setIsScanning(false);
        Alert.alert("Разрешения", "Требуются Bluetooth разрешения");
        return;
      }

      manager.startDeviceScan(
        null,
        { allowDuplicates: false },
        (error, device) => {
          if (error) {
            manager.stopDeviceScan();
            setIsScanning(false);
            Alert.alert("Ошибка сканирования", error.message);
            return;
          }
          if (!device) return;

          const name = device.name ?? device.localName ?? "Unknown";
          setDevices((prev) => ({
            ...prev,
            [device.id]: { id: device.id, name, rssi: device.rssi },
          }));
        },
      );

      setTimeout(() => {
        manager.stopDeviceScan();
        setIsScanning(false);
      }, 20000);
    } catch (e: any) {
      setIsScanning(false);
      Alert.alert("Error", e?.message ?? "Unknown error");
    }
  };

  const stopScan = () => {
    const manager = managerRef.current;
    if (!manager) return;
    manager.stopDeviceScan();
    setIsScanning(false);
  };

  const connectTo = async (id: string) => {
    const manager = managerRef.current;
    if (!manager) return;

    try {
      stopScan();

      setIsConnecting(true);
      setConnected(null);
      setServices([]);
      setConnectedCheck("-");

      const state = await manager.state();
      if (state !== "PoweredOn") {
        Alert.alert(
          "Bluetooth",
          `Bluetooth state: ${state}. Включите Bluetooth и попробуйте снова.`,
        );
        return;
      }

      const device = await manager.connectToDevice(id, {
        timeout: 15000,
        autoConnect: false,
      });

      const isConn1 = await device.isConnected();
      setConnectedCheck(String(isConn1));

      const ready = await device.discoverAllServicesAndCharacteristics();

      const isConn2 = await ready.isConnected();
      setConnectedCheck(String(isConn2));

      const svcs = await ready.services();

      const discovered: DiscoveredService[] = [];
      for (const s of svcs) {
        try {
          const chars = await s.characteristics();
          discovered.push({
            uuid: s.uuid,
            characteristics: chars.map((c) => ({
              uuid: c.uuid,
              isReadable: c.isReadable,
              isWritableWithResponse: c.isWritableWithResponse,
              isWritableWithoutResponse: c.isWritableWithoutResponse,
              isNotifiable: c.isNotifiable,
              isIndicatable: c.isIndicatable,
            })),
          });
        } catch (e: any) {
          discovered.push({
            uuid: s.uuid,
            characteristics: [],
          });
        }
      }

      setServices(discovered);
      setConnected(ready);

      const shownName = ready.name ?? ready.localName ?? ready.id;

      Alert.alert("Подключено", shownName);
    } catch (e: any) {
      Alert.alert("Ошибка подключения", e?.message ?? "Unknown error");
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = async () => {
    const manager = managerRef.current;
    if (!manager || !connected) return;

    try {
      await manager.cancelDeviceConnection(connected.id);
      setConnected(null);
      setServices([]);
      setConnectedCheck("-");
    } catch (e: any) {
      Alert.alert("Ошибка отключения", e?.message ?? "Unknown error");
    }
  };

  if (isExpoGo) {
    return (
      <View style={{ flex: 1, padding: 16 }}>
        <View
          style={{
            paddingTop: 12,
            paddingBottom: 12,
            borderRadius: 12,
            gap: 10,
          }}
        >
          <Text style={styles.cardTitle}>Недоступно в Expo Go</Text>
          <Text style={{ marginTop: 8, color: "#666" }}>
            BLE доступен только в EAS Dev Build / Preview / Production. В Expo
            Go нативные модули Bluetooth отсутствуют.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bluetooth (BLE)</Text>

      <View style={styles.row}>
        <Pressable
          style={[
            styles.button,
            (isScanning || isConnecting) && styles.buttonDisabled,
          ]}
          onPress={startScan}
          disabled={isScanning || isConnecting}
        >
          <Text style={styles.buttonText}>Поиск</Text>
        </Pressable>

        <Pressable
          style={[styles.button, !isScanning && styles.buttonDisabled]}
          onPress={stopScan}
          disabled={!isScanning}
        >
          <Text style={styles.buttonText}>Остановить</Text>
        </Pressable>

        <Pressable
          style={[
            styles.button,
            (!connected || isConnecting) && styles.buttonDisabled,
          ]}
          onPress={disconnect}
          disabled={!connected || isConnecting}
        >
          <Text style={styles.buttonText}>Отключиться</Text>
        </Pressable>
      </View>

      {(isScanning || isConnecting) && (
        <View style={styles.scanRow}>
          <ActivityIndicator />
          <Text style={styles.muted}>
            {isScanning ? "Поиск..." : "Подключение и чтение сервисов..."}
          </Text>
        </View>
      )}

      {connected ? (
        <View style={styles.connectedBox}>
          <Text style={styles.connectedTitle}>Подключен</Text>
          <Text style={styles.muted}>
            {connected.name ?? connected.localName ?? "Unknown"} ({connected.id}
            )
          </Text>
          <Text style={styles.muted}>
            device.isConnected(): {connectedCheck}
          </Text>
        </View>
      ) : null}

      {!!services.length && (
        <View style={styles.servicesBox}>
          <Text style={styles.servicesTitle}>Services / Characteristics</Text>
          <ScrollView style={{ maxHeight: 180 }}>
            {services.map((s) => (
              <View key={s.uuid} style={styles.serviceItem}>
                <Text style={styles.serviceUuid}>
                  {describeService(s.uuid)}
                </Text>
                <Text style={styles.muted}>{s.uuid}</Text>

                {s.characteristics.length ? (
                  s.characteristics.map((c) => (
                    <Text key={c.uuid} style={styles.charLine}>
                      • {describeCharacteristic(c.uuid)}{" "}
                      <Text style={styles.charFlags}>({flagsShort(c)})</Text>
                      {"\n"}
                      <Text style={styles.muted}>{c.uuid}</Text>
                    </Text>
                  ))
                ) : (
                  <Text style={styles.muted}>- характеристики не доступны</Text>
                )}
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      <FlatList
        data={devicesList}
        keyExtractor={(d) => d.id}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        contentContainerStyle={{ paddingVertical: 12 }}
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => connectTo(item.id)}
            disabled={isConnecting}
          >
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={styles.deviceName} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.muted} numberOfLines={1}>
                {item.id}
              </Text>
            </View>
            <Text style={styles.rssi}>{item.rssi ?? ""}</Text>
          </Pressable>
        )}
        ListEmptyComponent={
          !isScanning ? (
            <Text style={styles.muted}>
              Устройства не обнаружены. Нажмите &quot;Поиск&quot;
            </Text>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  title: { fontSize: 20, fontWeight: "800" },
  muted: { color: "#666" },

  row: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  button: {
    backgroundColor: "#111",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  buttonDisabled: { opacity: 0.45 },
  buttonText: { color: "#fff", fontWeight: "700" },

  scanRow: { flexDirection: "row", alignItems: "center", gap: 8 },

  connectedBox: {
    backgroundColor: "#eef7ee",
    padding: 12,
    borderRadius: 12,
    gap: 4,
  },
  connectedTitle: { fontWeight: "800" },

  servicesBox: {
    backgroundColor: "#fff7ee",
    padding: 12,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: "#f1d2b8",
  },
  servicesTitle: { fontWeight: "800" },
  serviceItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  serviceUuid: {
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    fontWeight: "700",
  },
  charLine: { color: "#333", marginTop: 4 },
  charFlags: { color: "#666" },

  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#f3f3f3",
    padding: 12,
    borderRadius: 12,
  },
  cardTitle: { fontWeight: "800", fontSize: 16 },

  deviceName: { fontSize: 14, fontWeight: "700" },
  rssi: { width: 50, textAlign: "right", color: "#333", fontWeight: "700" },
});
