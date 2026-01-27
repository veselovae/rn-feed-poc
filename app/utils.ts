import { EVariants } from "./consts";
import { Category, Product, ProductGroup, RawCategory } from "./types";

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
): Category[] => {
  if (!categories) return [];

  const list = Array.isArray(categories) ? categories : [categories];

  return list.map((c: RawCategory) => {
    const id = Number(c["id"]);
    const productCount =
      items?.filter(({ categoryId }) => Number(categoryId) === id)?.length ?? 0;

    return {
      id,
      name: String(c["#text"] ?? "").trim(),
      productCount,
    };
  });
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
