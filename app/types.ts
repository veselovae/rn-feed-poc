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
};

type Variants = {
  isPack: boolean;
  isBlock: boolean;
};

export type ProductGroup = {
  id: string;
  variants: (Product & Variants)[];
};
