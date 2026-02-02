import { CategoryNode } from "@/app/types";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

type CategoryItemProps = {
  item: CategoryNode;
  level?: number;
};

export const CategoryItem = ({ item, level = 0 }: CategoryItemProps) => {
  const router = useRouter();

  return (
    <View>
      <Pressable
        onPress={() =>
          router.push({
            pathname: "/category/[id]",
            params: { id: String(item.id) },
          })
        }
        style={[styles.categoryRow, { paddingLeft: 16 + level * 16 }]}
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

      {item?.children?.length > 0 &&
        item?.children.map((child) => (
          <CategoryItem key={child.id} item={child} level={level + 1} />
        ))}
    </View>
  );
};

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
