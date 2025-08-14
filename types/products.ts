export type ProductType = {
  id: string;
  name: string;
  active: boolean;
  base_price: number;
  stripe_account_id: string | null;
  is_default: boolean;
  is_branded_item: boolean;
  created_at: string;
  updated_at: string;
};

export type SimplifiedProductType = {
  id: string;
  name: string;
  active: boolean;
  images?: ProductTypeImage[];
};

export type BrandedProductType = {
  id: string;
  name: string;
  description: string | null;
  base_price: number;
  is_branded_item: boolean;
  active: boolean;
};

export type StayFamousProductType = {
  id: string;
  name: string;
  active: boolean;
  images?: ProductTypeImage[];
  base_price: number;
  is_default: boolean;
};

export type ProductTypeImage = {
  id: string;
  product_type_id: string;
  image_path: string;
  vertical_offset: number;
  is_default_model: boolean;
};

export type ProductSize = {
  id: string;
  product_type_id: string;
  size: string;
  size_order: number;
  created_at?: string;
  updated_at?: string;
};

export type PendingProductSize = Omit<ProductSize, 'created_at' | 'updated_at'>;

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  product_type_id: string;
  created_at: string;
  updated_at: string;
}; 