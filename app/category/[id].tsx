import { Redirect, Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useProducts } from "../products-context";
import { Product } from "../types";
import { normalizeProductId } from "../utils";

export default function Index() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { loading, error, products, reload, categories } = useProducts();

  const categoryId = Number(id);
  const categoryName = categories?.find(
    (category) => category.id === Number(id),
  )?.name;

  const filtered = products.filter((p) => p.categoryId === categoryId);

  if (!id) {
    return <Redirect href={{ pathname: "/+not-found" as any }} />;
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: categoryName ?? `Категория ${id}`,
        }}
      />
      <View style={styles.container}>
        {loading && (
          <View style={styles.center}>
            <ActivityIndicator />
            <Text style={styles.muted}>Загружаю товары…</Text>
          </View>
        )}

        {!loading && error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorTitle}>Ошибка</Text>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable onPress={reload} style={styles.button}>
              <Text style={styles.buttonText}>Повторить</Text>
            </Pressable>
          </View>
        )}

        {!filtered?.length && (
          <Text style={{ fontSize: 20, fontWeight: "800" }}>
            Товары не найдены
          </Text>
        )}

        {!loading && !error && (
          <FlatList
            data={filtered}
            keyExtractor={(p) => p.id}
            contentContainerStyle={{ paddingBottom: 24 }}
            renderItem={({ item }) => (
              <ProductRow
                item={item}
                onOpen={() =>
                  router.push({
                    pathname: "/product/[id]",
                    params: {
                      id: normalizeProductId(item.id),
                      variant: item.variant,
                    },
                  })
                }
              />
            )}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          />
        )}
      </View>
    </>
  );
}

function ProductRow({ item, onOpen }: { item: Product; onOpen: () => void }) {
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState(false);

  return (
    <Pressable onPress={onOpen} style={styles.card}>
      {!!item.picture && !imageError ? (
        <View style={{ alignItems: "center", justifyContent: "center" }}>
          <Image
            source={{ uri: item.picture }}
            style={styles.image}
            resizeMode="cover"
            onError={() => {
              setImageLoading(false);
              setImageError(true);
            }}
            onLoadStart={() => setImageLoading(true)}
            onLoadEnd={() => setImageLoading(false)}
          />
          {imageLoading && (
            <View style={{ position: "absolute" }}>
              <ActivityIndicator />
            </View>
          )}
        </View>
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]}>
          <Text style={styles.muted}>no image</Text>
        </View>
      )}

      <View style={{ flex: 1, gap: 6 }}>
        <Text style={styles.title} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.price}>
          {item.price != null ? `${item.price} ₽` : "Цена не указана"}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 10, paddingHorizontal: 16 },
  header: { fontSize: 22, fontWeight: "700", marginBottom: 12 },
  center: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 24,
  },
  muted: { color: "#666" },

  errorBox: { backgroundColor: "#fee", padding: 12, borderRadius: 12, gap: 8 },
  errorTitle: { fontSize: 16, fontWeight: "700", color: "#900" },
  errorText: { color: "#900" },
  button: {
    backgroundColor: "#111",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "600" },

  card: {
    flexDirection: "row",
    gap: 12,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "#f3f3f3",
  },
  image: { width: 86, height: 86, borderRadius: 12, backgroundColor: "#ddd" },
  imagePlaceholder: { alignItems: "center", justifyContent: "center" },
  title: { fontSize: 16, fontWeight: "600" },
  price: { fontSize: 14, fontWeight: "700" },
});
