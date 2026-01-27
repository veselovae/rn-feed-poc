import { Link, Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Not Found" }} />

      <View style={styles.container}>
        <Text style={styles.title}>404</Text>
        <Text style={styles.text}>Страница не найдена</Text>

        <Link href="/" style={styles.link}>
          На главную
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 24,
  },
  title: {
    fontSize: 48,
    fontWeight: "800",
  },
  text: {
    fontSize: 16,
    color: "#666",
  },
  link: {
    marginTop: 16,
    fontSize: 16,
    color: "#0a58ca",
  },
});
