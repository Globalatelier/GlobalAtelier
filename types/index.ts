export type ProductImage = {
  publicId: string;
  url: string;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  price: number | null;
  originalPrice: number | null;
  manufacturerUrl: string | null;
  brand: string | null;
  category: string | null;
  sizes: string[];
  images: ProductImage[];
  available: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ShopSettings = {
  shopName: string;
  whatsappNumber: string;
  instagramUrl: string;
};

export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  sku: string;
  image: string | null;
  size: string | null;
  quantity: number;
  price: number | null;
  originalPrice: number | null;
};

export type ProductInput = {
  name: string;
  price: number | null;
  originalPrice: number | null;
  manufacturerUrl: string | null;
  brand: string | null;
  category: string | null;
  sizes: string[];
  images: ProductImage[];
  available: boolean;
};
