import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { fetchFeedXml, parseProductsFromXml } from "./feedApi";
import type { Product, ProductGroup } from "./types";

type ProductsState = {
  loading: boolean;
  error: string | null;
  products: Product[];
  groups: Record<string, ProductGroup>;
};

type ProductsContextValue = ProductsState & {
  reload: () => Promise<void>;
};

const ProductsContext = createContext<ProductsContextValue | null>(null);

function isBlockName(name: string) {
  return /блок/i.test(name);
}

function isPackName(name: string) {
  return /пачка/i.test(name);
}

const buildGroups = (products: Product[]): Record<string, ProductGroup> => {
  return products.reduce(
    (groups, product) => {
      if (groups[product.id]) {
        groups[product.id].variants.push({
          ...product,
          isPack: isPackName(product.name),
          isBlock: isBlockName(product.name),
        });

        return groups;
      }

      groups[product.id] = {
        id: product.id,
        variants: [
          {
            ...product,
            isPack: isPackName(product.name),
            isBlock: isBlockName(product.name),
          },
        ],
      };

      return groups;
    },
    {} as Record<string, ProductGroup>,
  );
};

export function ProductsProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ProductsState>({
    loading: false,
    error: null,
    products: [],
    groups: {},
  });

  const reload = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));

    try {
      const xml = await fetchFeedXml();
      const items = parseProductsFromXml(xml);
      const itemsFixIds = items.reduce((acc, item) => {
        if (acc.find((i) => i.id === item.id)) {
          acc.push({
            ...item,
            oldId: item.id,
            id: item.id + "_" + Math.random().toString(36).substr(2, 5),
          });

          return acc;
        }

        acc.push(item);
        return acc;
      }, [] as Product[]);

      const groups = buildGroups(items);

      setState({
        loading: false,
        error:
          items.length === 0 ? "Фид загрузился, но товары не найдены." : null,
        products: itemsFixIds,
        groups,
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
