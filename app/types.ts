import { EVariants } from "./consts";

export type Product = {
  available: boolean;
  categoryId: number;
  currencyId: string;
  description: string;
  id: string;
  name: string;
  price: number | null;
  picture?: string | null;
  url: string;

  oldId?: string | null;
  variant: string | null;
};

type Variants = EVariants | null;

export type ProductWithVariant = Product & {
  variant: Variants;
};

export type ProductGroup = {
  id: string;
  variants: ProductWithVariant[];
};

//Raw api data
export type RawCategory = {
  "#text": string;
  id: string;
};

export type RawShopData = {
  categories: { category: RawCategory[] };
  company: string;
  currencies: {
    currency: {
      id: string;
      rete: string;
    };
  };
  name: string;
  offers: {
    offer: Product[];
  };
  url: string;
};

// Parsed api data
export type ParsedData = {
  categories: RawCategory[];
  name: string;
  items: Product[];
};

export type Category = {
  id: number;
  name: string;
  productCount: number;
};
