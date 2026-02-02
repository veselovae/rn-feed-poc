import React, {
  createContext,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";

export type LogLevel = "debug" | "info" | "warn" | "error";

export type LogSource = "network" | "bluetooth" | "system";

export type LogEntry = {
  id: string;
  ts: number;
  level: LogLevel;
  source: LogSource;
  message: string;
  data?: any;
};

type LogsContextValue = {
  logs: LogEntry[];
  addLog: (entry: Omit<LogEntry, "id" | "ts"> & { ts?: number }) => void;
  clear: () => void;
};

const LogsContext = createContext<LogsContextValue | null>(null);

const MAX_LOGS = 500;

function safeStringify(value: any) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function normalizeError(e: any) {
  if (!e) return { message: "Unknown error" };
  if (e instanceof Error) return { message: e.message, stack: e.stack };
  if (typeof e === "string") return { message: e };
  return { message: "Error", raw: e };
}

export function LogsProvider({ children }: { children: React.ReactNode }) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const counter = useRef(0);

  const addLog: LogsContextValue["addLog"] = (entry) => {
    const ts = entry.ts ?? Date.now();
    counter.current += 1;

    const item: LogEntry = {
      id: `${ts}-${counter.current}`,
      ts,
      level: entry.level,
      source: entry.source,
      message: entry.message,
      data: entry.data,
    };

    setLogs((prev) => {
      const next = [item, ...prev];
      if (next.length > MAX_LOGS) next.length = MAX_LOGS;
      return next;
    });
  };

  const clear = () => setLogs([]);

  const value = useMemo(() => ({ logs, addLog, clear }), [logs]);

  return <LogsContext.Provider value={value}>{children}</LogsContext.Provider>;
}

export function useLogs() {
  const ctx = useContext(LogsContext);
  if (!ctx) throw new Error("useLogs must be used inside LogsProvider");
  return ctx;
}

export function logError(
  addLog: LogsContextValue["addLog"],
  source: LogSource,
  e: any,
  message?: string,
) {
  const ne = normalizeError(e);
  addLog({
    level: "error",
    source,
    message: message ?? ne.message,
    data: ne,
  });
}

export { safeStringify };
