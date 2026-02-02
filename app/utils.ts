import { DiscoveredChar } from "./(tabs)/bluetooth-ble";
import {
  EVariants,
  STANDARD_CHARACTERISTICS,
  STANDARD_SERVICES,
} from "./consts";
import { CategoryNode, Product, ProductGroup, RawCategory } from "./types";

export const normalizeProductId = (id: string) => {
  return id.split("_")[0];
};

export const sanitizeDescription = (input?: string): string => {
  if (!input) return "";

  return input
    .replace(/&nbsp;/gi, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")

    .replace(/<br\s*\/?>/gi, "\n")

    .replace(/<\/?[^>]+>/g, "")

    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n/g, "\n\n")
    .trim();
};

const isBlockName = (name: string) => /блок/i.test(name);
const isPackName = (name: string) => /пачка/i.test(name);

export const getProductVariant = (name: string) => {
  let variant: EVariants | null = null;

  if (isBlockName(name)) variant = EVariants.BLOCK;
  if (isPackName(name)) variant = EVariants.PACK;

  return variant;
};

export const parseCategories = (
  categories: RawCategory[],
  items: Product[],
): CategoryNode[] => {
  if (!categories) return [];

  const list = Array.isArray(categories) ? categories : [categories];

  const ownCountById = new Map<number, number>();
  for (const item of items ?? []) {
    const cId = Number((item as any).categoryId);
    if (!Number.isFinite(cId)) continue;
    ownCountById.set(cId, (ownCountById.get(cId) ?? 0) + 1);
  }

  const byParent = new Map<number | null, RawCategory[]>();
  for (const c of list) {
    const parentId =
      c["parentId"] === undefined ||
      c["parentId"] === null ||
      c["parentId"] === ""
        ? null
        : Number(c["parentId"]);

    const arr = byParent.get(parentId);
    if (arr) arr.push(c);
    else byParent.set(parentId, [c]);
  }

  const build = (parentId: number | null): CategoryNode[] => {
    const children = byParent.get(parentId) ?? [];

    const nodes = children.map((c) => {
      const id = Number(c["id"]);
      const own = ownCountById.get(id) ?? 0;

      const childNodes = build(id);
      const childrenTotal = childNodes.reduce(
        (sum, ch) => sum + ch.totalProductCount,
        0,
      );

      return {
        id,
        name: String(c["#text"] ?? "").trim(),
        productCount: own,
        totalProductCount: own + childrenTotal,
        children: [...childNodes].sort(
          (a, b) => b.totalProductCount - a.totalProductCount,
        ),
      };
    });

    const sorted = [...nodes].sort(
      (a, b) => b.totalProductCount - a.totalProductCount,
    );

    console.log("sorted", sorted);
    return sorted;
  };

  return build(null);
};

export const getCategoryDictionary = (rowCategory: RawCategory[]) => {
  return rowCategory?.reduce(
    (dic, cat) => {
      if (Number(cat?.id) in dic) {
        return dic;
      }

      dic[Number(cat?.id)] = cat;
      return dic;
    },
    {} as Record<number, RawCategory>,
  );
};

export const buildGroups = (
  products: Product[],
): Record<string, ProductGroup> => {
  return products.reduce(
    (groups, product) => {
      if (groups[product.id]) {
        groups[product.id].variants.push({
          ...product,
          variant: getProductVariant(product?.name),
        });

        return groups;
      }

      groups[product.id] = {
        id: product.id,
        variants: [
          {
            ...product,
            variant: getProductVariant(product?.name),
          },
        ],
      };

      return groups;
    },
    {} as Record<string, ProductGroup>,
  );
};

//BLE

export const normalizeUuid = (uuid: string) => uuid.toLowerCase();

export const describeService = (uuid: string): string => {
  const key = normalizeUuid(uuid);
  return STANDARD_SERVICES[key] ?? "Manufacturer-specific service";
};

export const describeCharacteristic = (uuid: string): string => {
  const key = normalizeUuid(uuid);
  return (
    STANDARD_CHARACTERISTICS[key] ?? "Manufacturer-specific characteristic"
  );
};

export const flagsShort = (c: DiscoveredChar) => {
  return [
    c.isReadable ? "R" : null,
    c.isWritableWithResponse ? "W" : null,
    c.isWritableWithoutResponse ? "WNR" : null,
    c.isNotifiable ? "N" : null,
    c.isIndicatable ? "I" : null,
  ]
    .filter(Boolean)
    .join(", ");
};
