import { Stack } from "expo-router";
import { FlatList, Text } from "react-native";
import { CategoryItem } from "../../components/CategoryItem";
import { useProducts } from "../products-context";
export default function CategoriesScreen() {
  const { loading, error, categories } = useProducts();

  if (loading) return <Text>Загрузка…</Text>;
  if (error) return <Text>{error}</Text>;

  return (
    <>
      <Stack.Screen
        options={{
          title: "Каталог",
        }}
      />

      <FlatList
        data={categories}
        keyExtractor={(c) => String(c.id)}
        renderItem={({ item }) => <CategoryItem item={item} />}
      />
    </>
  );
}
