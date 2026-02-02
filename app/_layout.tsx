import { Stack } from "expo-router";
import { useEffect } from "react";
import { LogsProvider, useLogs } from "./logs-context";
import { ProductsProvider } from "./products-context";

function AppBootLogger() {
  const { addLog } = useLogs();

  useEffect(() => {
    addLog({
      level: "info",
      source: "system",
      message: "App started",
      data: { ts: new Date().toISOString() },
    });
  }, [addLog]);

  return null;
}

export default function RootLayout() {
  return (
    <LogsProvider>
      <AppBootLogger />
      <ProductsProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </ProductsProvider>
    </LogsProvider>
  );
}
