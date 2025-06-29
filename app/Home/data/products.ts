export interface ProductVariant {
  size: string;
  color: string;
  price: number;
  id: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  famousLine: string;
  description?: string;
  variants: ProductVariant[];
}

export const products: Product[] = [
  {
    id: "1",
    name: "Classic T-Shirt",
    price: 29.99,
    image: "/images/IMG_6206.jpg",
    famousLine: "Being Awesome",
    variants: [
      { id: "1-s-black", size: "S", color: "Black", price: 28.00 },
      { id: "1-m-black", size: "M", color: "Black", price: 28.00 },
      { id: "1-l-black", size: "L", color: "Black", price: 28.00 },
      { id: "1-xl-black", size: "XL", color: "Black", price: 28.00 },
      { id: "1-2xl-black", size: "2XL", color: "Black", price: 28.00 },
    ]
  },
  {
    id: "2",
    name: "Classic Tee",
    famousLine: "THAT NIGHT IN VEGAS",
    price: 28.00,
    image: "/images/since_vegas.png",
    variants: [
      { id: "2-s-black", size: "S", color: "Black", price: 28.00 },
      { id: "2-m-black", size: "M", color: "Black", price: 28.00 },
      { id: "2-l-black", size: "L", color: "Black", price: 28.00 },
      { id: "2-xl-black", size: "XL", color: "Black", price: 28.00 },
      { id: "2-2xl-black", size: "2XL", color: "Black", price: 28.00 },
    ]
  },
  {
    id: "3",
    name: "Classic Tee",
    famousLine: "LAST NIGHT",
    price: 28.00,
    image: "/images/Last_Night.jpeg",
    variants: [
      { id: "3-s-black", size: "S", color: "Black", price: 28.00 },
      { id: "3-m-black", size: "M", color: "Black", price: 28.00 },
      { id: "3-l-black", size: "L", color: "Black", price: 28.00 },
      { id: "3-xl-black", size: "XL", color: "Black", price: 28.00 },
      { id: "3-2xl-black", size: "2XL", color: "Black", price: 28.00 },
    ]
  },
  {
    id: "4",
    name: "Classic Tee",
    famousLine: "TRUST THE PROCESS",
    price: 28.00,
    image: "/images/IMG_7568.jpeg",
    variants: [
      { id: "4-s-black", size: "S", color: "Black", price: 28.00 },
      { id: "4-m-black", size: "M", color: "Black", price: 28.00 },
      { id: "4-l-black", size: "L", color: "Black", price: 28.00 },
      { id: "4-xl-black", size: "XL", color: "Black", price: 28.00 },
      { id: "4-2xl-black", size: "2XL", color: "Black", price: 28.00 },
    ]
  },
]; 