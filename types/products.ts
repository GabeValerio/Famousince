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

export type ProductSize = {
  id: string;
  product_type_id: string;
  size: string;
  created_at: string;
  updated_at: string;
};

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