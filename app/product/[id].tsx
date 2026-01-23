import { ExternalLink } from "@/components/ExternalLink";
import {
  ExternalPathString,
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useProducts } from "../products-context";
import { ProductGroup } from "../types";
import { sanitizeDescription } from "../utils";

type Variant = ProductGroup["variants"][0];

export default function ProductPage() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { loading, groups } = useProducts();

  const variants = groups[String(id)]?.variants ?? [];

  const isPackVariantExist = variants.some((v) => v.isPack);
  const isPackVariantAvailable = variants.some((v) => v.isPack && v.available);
  const isBlockVariantExist = variants.some((v) => v.isBlock);

  const [currentVariant, setVariant] = useState<Variant>(
    variants.find((v) => v.isPack) || variants?.[0] || {},
  );
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState(false);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Pressable
        onPress={() => router.back()}
        style={[styles.button, { alignSelf: "flex-start" }]}
      >
        <Text style={styles.buttonText}>Назад</Text>
      </Pressable>

      {loading && (
        <View
          style={{
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            marginTop: 24,
          }}
        >
          <ActivityIndicator />
          <Text style={styles.muted}>Загружаю товары…</Text>
        </View>
      )}

      {!currentVariant?.name && (
        <Text style={styles.title} numberOfLines={3}>
          Товар не найден
        </Text>
      )}

      {!!currentVariant?.name && (
        <>
          {currentVariant.picture && !imageError ? (
            <View style={{ alignItems: "center", justifyContent: "center" }}>
              <Image
                source={{ uri: currentVariant.picture }}
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

          <Text style={styles.title} numberOfLines={3}>
            {currentVariant?.name}
          </Text>

          {(isPackVariantExist || isBlockVariantExist) && (
            <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
              {isPackVariantExist && (
                <ToggleChip
                  label="пачка"
                  active={currentVariant?.isPack}
                  disabled={!isPackVariantAvailable}
                  onPress={() =>
                    setVariant(
                      variants.find((v) => v.isPack) ?? ({} as Variant),
                    )
                  }
                />
              )}

              {isBlockVariantExist && (
                <ToggleChip
                  label="блок"
                  active={currentVariant?.isBlock}
                  disabled={!isBlockVariantExist}
                  onPress={() =>
                    setVariant(
                      variants.find((v) => v.isBlock) ?? ({} as Variant),
                    )
                  }
                />
              )}
            </View>
          )}

          <Text style={styles.price}>
            {currentVariant.price != null
              ? `${currentVariant.price.toFixed(2)} ₽`
              : "Цена не указана"}
          </Text>

          <Text style={styles.meta}>id: {currentVariant.id}</Text>

          <Text style={styles.meta}>
            categoryId: {String(currentVariant.categoryId)}
          </Text>

          {currentVariant.description ? (
            <>
              <Text style={styles.sectionTitle}>Описание</Text>
              <Text style={styles.desc}>
                {sanitizeDescription(currentVariant.description)}
              </Text>
            </>
          ) : null}

          {currentVariant.url ? (
            <>
              <Text style={styles.sectionTitle}>URL</Text>
              <ExternalLink
                href={(currentVariant?.url as ExternalPathString) ?? null}
                style={styles.link}
              />
            </>
          ) : null}

          <Pressable
            style={[
              styles.button,
              { alignItems: "center", marginTop: 20 },
              !currentVariant.available && styles.chipDisabled,
            ]}
            disabled={!currentVariant.available}
          >
            <Text style={styles.buttonText}>Купить</Text>
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}

function ToggleChip({
  label,
  active,
  disabled,
  onPress,
}: {
  label: string;
  active: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.chip,
        active && styles.chipActive,
        disabled && styles.chipDisabled,
      ]}
    >
      <Text
        style={[
          styles.chipText,
          active && styles.chipTextActive,
          disabled && styles.chipTextDisabled,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 30,
    gap: 12,
  },
  title: { fontSize: 20, fontWeight: "800" },
  price: { fontSize: 16, fontWeight: "800" },
  meta: { color: "#666" },
  sectionTitle: { marginTop: 8, fontSize: 14, fontWeight: "800" },
  desc: { color: "#222", lineHeight: 20 },
  muted: { color: "#666" },

  image: {
    position: "relative",
    width: "100%",
    aspectRatio: 1,
    borderRadius: 16,
    backgroundColor: "#ddd",
    marginTop: 8,
  },
  imagePlaceholder: { alignItems: "center", justifyContent: "center" },

  button: {
    backgroundColor: "#111",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  buttonText: { color: "#fff", fontWeight: "700" },

  link: { color: "#72a2e6", textDecorationLine: "underline" },

  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#e6e6e6",
  },
  chipActive: { backgroundColor: "#111" },
  chipDisabled: { backgroundColor: "#efefef" },
  chipText: { fontSize: 12, fontWeight: "700", color: "#333" },
  chipTextActive: { color: "#fff" },
  chipTextDisabled: { color: "#aaa" },
});
