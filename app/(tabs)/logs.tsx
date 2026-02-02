import * as Clipboard from "expo-clipboard";
import { useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  LogEntry,
  LogLevel,
  LogSource,
  safeStringify,
  useLogs,
} from "../logs-context";

const SOURCES: (LogSource | "all")[] = [
  "all",
  "network",
  "bluetooth",
  "system",
];
const LEVELS: (LogLevel | "all")[] = ["all", "debug", "info", "warn", "error"];

export default function LogsScreen() {
  const { logs, clear } = useLogs();

  const [source, setSource] = useState<(typeof SOURCES)[number]>("all");
  const [level, setLevel] = useState<(typeof LEVELS)[number]>("all");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return logs.filter((l) => {
      if (source !== "all" && l.source !== source) return false;
      if (level !== "all" && l.level !== level) return false;
      if (!query) return true;
      const hay = `${l.message} ${safeStringify(l.data ?? "")}`.toLowerCase();
      return hay.includes(query);
    });
  }, [logs, source, level, q]);

  const copyAll = async () => {
    const text = filtered.slice().reverse().map(formatLogLine).join("\n\n");
    await Clipboard.setStringAsync(text);
  };

  return (
    <View style={styles.container}>
      <View style={styles.controls}>
        <TextInput
          placeholder="Поиск..."
          value={q}
          onChangeText={setQ}
          style={styles.search}
          placeholderTextColor="#999"
        />

        <View style={styles.row}>
          <ChipGroup
            label="Source"
            values={SOURCES}
            active={source}
            onChange={setSource}
          />
        </View>

        <View style={styles.row}>
          <ChipGroup
            label="Level"
            values={LEVELS}
            active={level}
            onChange={setLevel}
          />
        </View>

        <View style={styles.actions}>
          <Pressable style={styles.button} onPress={copyAll}>
            <Text style={styles.buttonText}>Скопировать</Text>
          </Pressable>
          <Pressable style={[styles.button, styles.danger]} onPress={clear}>
            <Text style={styles.buttonText}>Очистить</Text>
          </Pressable>
        </View>

        <Text style={styles.meta}>
          Показано: {filtered.length} / всего: {logs.length}
        </Text>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ paddingBottom: 24 }}
        renderItem={({ item }) => <LogRow item={item} />}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={<Text style={styles.muted}>Логов пока нет.</Text>}
      />
    </View>
  );
}

function formatLogLine(l: LogEntry) {
  const dt = new Date(l.ts);
  const time = `${String(dt.getHours()).padStart(2, "0")}:${String(dt.getMinutes()).padStart(2, "0")}:${String(dt.getSeconds()).padStart(2, "0")}`;
  const head = `[${time}] [${l.source}] [${l.level}] ${l.message}`;
  if (l.data === undefined) return head;
  return `${head}\n${safeStringify(l.data)}`;
}

function LogRow({ item }: { item: LogEntry }) {
  return (
    <View style={styles.card}>
      <Text style={styles.line} numberOfLines={2}>
        {formatLogLine({ ...item, data: undefined })}
      </Text>
      {item.data !== undefined ? (
        <Text style={styles.data} numberOfLines={6}>
          {safeStringify(item.data)}
        </Text>
      ) : null}
    </View>
  );
}

function ChipGroup<T extends string>({
  label,
  values,
  active,
  onChange,
}: {
  label: string;
  values: readonly T[];
  active: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={styles.groupLabel}>{label}</Text>
      <View style={styles.chips}>
        {values.map((v) => (
          <Pressable
            key={v}
            onPress={() => onChange(v)}
            style={[styles.chip, active === v && styles.chipActive]}
          >
            <Text
              style={[styles.chipText, active === v && styles.chipTextActive]}
            >
              {v}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  muted: { color: "#666" },

  controls: { gap: 10 },
  search: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#111",
  },
  row: { flexDirection: "row", flexWrap: "wrap" },
  groupLabel: { fontSize: 12, fontWeight: "800", color: "#333" },

  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#efefef",
  },
  chipActive: { backgroundColor: "#111" },
  chipText: { fontSize: 12, fontWeight: "800", color: "#333" },
  chipTextActive: { color: "#fff" },

  actions: { flexDirection: "row", gap: 10 },
  button: {
    backgroundColor: "#111",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  danger: { opacity: 0.85 },
  buttonText: { color: "#fff", fontWeight: "800" },

  meta: { color: "#666", fontSize: 12 },

  card: {
    backgroundColor: "#f3f3f3",
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  line: { color: "#111", fontWeight: "800", fontSize: 12 },
  data: { color: "#333", fontSize: 12 },
});
