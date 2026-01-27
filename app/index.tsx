import { Stack, useRouter } from "expo-router";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useProducts } from "./products-context";

export default function CategoriesScreen() {
  const router = useRouter();
  const { loading, error, categories, shopName } = useProducts();

  if (loading) return <Text>Загрузка…</Text>;
  if (error) return <Text>{error}</Text>;

  return (
    <>
      <Stack.Screen
        options={{
          title: `${shopName ? `${shopName}: ` : ""} Каталог`,
        }}
      />

      <FlatList
        data={categories}
        keyExtractor={(c) => String(c.id)}
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              router.push({
                pathname: "/category/[id]",
                params: { id: String(item.id) },
              })
            }
            style={styles.categoryRow}
          >
            <View style={styles.row}>
              <Text style={styles.categoryName}>{item.name}</Text>
              <View
                style={[
                  styles.countBadge,
                  item.productCount === 0 && styles.countBadgeDisabled,
                ]}
              >
                <Text
                  style={[
                    styles.countText,
                    item.productCount === 0 && styles.countTextDisabled,
                  ]}
                >
                  {item.productCount}
                </Text>
              </View>
            </View>
          </Pressable>
        )}
      />
    </>
  );
}

const styles = StyleSheet.create({
  categoryRow: {
    padding: 16,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  categoryName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
  },

  countBadge: {
    minWidth: 28,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
  },
  countBadgeDisabled: {
    backgroundColor: "#e0e0e0",
  },

  countText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#fff",
  },
  countTextDisabled: {
    color: "#888",
  },
});
