import { Stack } from "expo-router";
import { ProductsProvider } from "./products-context";

export default function RootLayout() {
  return (
    <ProductsProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </ProductsProvider>
  );
}
