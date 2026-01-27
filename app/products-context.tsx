import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { fetchFeedXml, parseProductsFromXml } from "./feedApi";
import { type Category, type Product, type ProductGroup } from "./types";
import { buildGroups, getProductVariant, parseCategories } from "./utils";

type ProductsState = {
  loading: boolean;
  error: string | null;
  products: Product[];
  groups: Record<string, ProductGroup>;
  categories: Category[];
  shopName: string;
};

type ProductsContextValue = ProductsState & {
  reload: () => Promise<void>;
};

const ProductsContext = createContext<ProductsContextValue | null>(null);

export function ProductsProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ProductsState>({
    loading: false,
    error: null,
    products: [],
    groups: {},
    categories: [],
    shopName: "",
  });

  const reload = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));

    try {
      const xml = await fetchFeedXml();
      const {
        items,
        categories: rawCategories,
        name,
      } = parseProductsFromXml(xml);

      const itemsFixIds = items?.reduce((acc, item) => {
        const variant = getProductVariant(item?.name);

        if (acc.find((i) => i.id === item.id)) {
          acc.push({
            ...item,
            oldId: item.id,
            id: item.id + "_" + Math.random().toString(36).substr(2, 5),
            variant,
          });

          return acc;
        }

        acc.push({ ...item, variant });
        return acc;
      }, [] as Product[]);

      const groups = buildGroups(items);

      const categories = parseCategories(rawCategories, items);

      setState({
        loading: false,
        error:
          items.length === 0 ? "Фид загрузился, но товары не найдены." : null,
        products: itemsFixIds,
        groups,
        categories: categories,
        shopName: name ?? "",
      });
    } catch (e: any) {
      setState((s) => ({
        ...s,
        loading: false,
        error: e?.message ?? "Неизвестная ошибка загрузки",
      }));
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const value: ProductsContextValue = {
    ...state,
    reload,
  };

  return (
    <ProductsContext.Provider value={value}>
      {children}
    </ProductsContext.Provider>
  );
}

export function useProducts() {
  const ctx = useContext(ProductsContext);
  if (!ctx) throw new Error("useProducts must be used inside ProductsProvider");
  return ctx;
}
