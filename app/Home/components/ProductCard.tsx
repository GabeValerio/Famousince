"use client";

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import Image from "next/image"
import { ShoppingCart } from "lucide-react"
import type { Product } from "../data/products"
import { MostFamousLabel } from "./MostFamousLabel"
import { useState, useCallback, useMemo, useEffect } from "react"
import { useCart } from "@/lib/CartContext"
import { useRouter } from "next/navigation"
import React from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabaseClient"

interface ProductVariant {
  id: string;
  size: string;
  color: string;
  price: number;
  stock_quantity: number;
}

interface ProductWithVariants {
  id: string;
  name: string;
  description?: string;
  base_price: number;
  application: string;
  front_image_url?: string;
  back_image_url?: string;
  product_type_id: string;
  variants: ProductVariant[];
  image?: string;
  famousLine?: string;
}

interface ProductCardProps {
  product: ProductWithVariants;
  onAddToCart?: (product: ProductWithVariants) => void;
  showAddToCart?: boolean;
  isMostFamous?: boolean;
}

interface SizeButtonProps {
  size: string;
  isSelected: boolean;
  onSelect: (size: string) => void;
}

interface ColorButtonProps {
  color: string;
  isSelected: boolean;
  onSelect: (color: string) => void;
}

const PLACEHOLDER_IMAGE = "/images/placeholder.jpg";

const SizeButton = React.memo(({ size, isSelected, onSelect }: SizeButtonProps) => (
  <button
    type="button"
    className={`
      px-2 py-1 text-xs rounded-md border border-white/20
      transition-colors duration-100
      ${isSelected 
        ? 'bg-white text-black' 
        : 'bg-black/40 text-white hover:bg-white/10'
      }
    `}
    onClick={() => onSelect(size)}
  >
    {size}
  </button>
));

SizeButton.displayName = 'SizeButton';

const ColorButton = React.memo(({ color, isSelected, onSelect }: ColorButtonProps) => (
  <button
    type="button"
    className={`
      px-2 py-1 text-xs rounded-md border border-white/20
      transition-colors duration-100
      ${isSelected 
        ? 'bg-white text-black' 
        : 'bg-black/40 text-white hover:bg-white/10'
      }
    `}
    onClick={() => onSelect(color)}
  >
    {color}
  </button>
));

ColorButton.displayName = 'ColorButton';

export const ProductCard = ({ product, onAddToCart, showAddToCart = true, isMostFamous }: ProductCardProps) => {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedBy, setExpandedBy] = useState<'cart' | 'buy' | null>(null);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("Black"); // Default to Black
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState("");
  const { addToCart } = useCart();

  // Get unique sizes from variants
  const availableSizes = useMemo(() => {
    const sizes = new Set(product.variants.map(v => v.size));
    return Array.from(sizes);
  }, [product.variants]);

  // Get unique colors from variants
  const availableColors = useMemo(() => {
    const colors = new Set(product.variants.map(v => v.color));
    return Array.from(colors);
  }, [product.variants]);

  const handleAddToCart = () => {
    if (!selectedSize) {
      setError("Please select a size");
      return;
    }

    const variant = product.variants.find(
      v => v.size === selectedSize && v.color === selectedColor
    );

    if (!variant) {
      setError("Selected variant not available");
      return;
    }

    if (variant.stock_quantity <= 0) {
      setError("Selected variant is out of stock");
      return;
    }

    addToCart(product, variant, quantity);
    setError("");
    setIsExpanded(false);
    setExpandedBy(null);
  };

  const onBuyNow = useCallback(() => {
    if (!isExpanded) {
      setIsExpanded(true);
      setExpandedBy('buy');
      return;
    }

    if (!selectedSize) {
      setError("Please select a size");
      return;
    }

    const variant = product.variants.find(
      v => v.size === selectedSize && v.color === selectedColor
    );

    if (!variant) {
      setError("Selected variant not available");
      return;
    }

    if (variant.stock_quantity <= 0) {
      setError("Selected variant is out of stock");
      return;
    }

    addToCart(product, variant, quantity);
    setError("");
    setIsExpanded(false);
    setExpandedBy(null);
    router.push('/shop/checkout');
  }, [isExpanded, selectedSize, selectedColor, product, quantity, addToCart, router]);

  const onCartClick = useCallback(() => {
    setIsExpanded(!isExpanded);
    setExpandedBy(isExpanded ? null : 'cart');
  }, [isExpanded]);

  const handleQuantityChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuantity(Math.max(1, parseInt(e.target.value)));
  }, []);

  const handleSizeSelect = useCallback((size: string) => {
    setSelectedSize(size);
  }, []);

  const handleColorSelect = useCallback((color: string) => {
    setSelectedColor(color);
  }, []);

  // Memoize size buttons
  const sizeButtons = useMemo(() => (
    availableSizes.map((size) => (
      <SizeButton
        key={size}
        size={size}
        isSelected={selectedSize === size}
        onSelect={handleSizeSelect}
      />
    ))
  ), [selectedSize, handleSizeSelect, availableSizes]);

  // Memoize color buttons
  const colorButtons = useMemo(() => (
    availableColors.map((color) => (
      <ColorButton
        key={color}
        color={color}
        isSelected={selectedColor === color}
        onSelect={handleColorSelect}
      />
    ))
  ), [selectedColor, handleColorSelect, availableColors]);

  return (
    <div className="border border-white/30 rounded-lg p-4 md:p-6 hover:border-white/50 transition-colors relative bg-black/40 backdrop-blur-sm">
      {isMostFamous && <MostFamousLabel />}

      {/* Famous Since Text */}
      <div className="text-center mb-4">
        <h3 className="text-xl md:text-2xl font-bold" style={{ fontFamily: 'Chalkduster, fantasy' }}>FAMOUS SINCE</h3>
      </div>

      {/* Product Image */}
      <div className="relative aspect-square mb-4 overflow-hidden rounded-lg">
        <Image
          src={product.front_image_url || product.back_image_url || product.image || PLACEHOLDER_IMAGE}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          className="object-cover"
          priority={isMostFamous}
        />
      </div>

      {/* For What Text */}
      <div className="text-center mb-4">
        <Link 
          href={`/StayFamous/${encodeURIComponent(product.description || '')}`}
          className="text-sm md:text-lg italic hover:text-white hover:underline transition-colors"
          style={{ fontFamily: 'Chalkduster, fantasy' }}
        >
          {product.famousLine}
        </Link>
      </div>

      {/* Product Details */}
      <div className="flex items-center space-x-4">
        <p className="text-lg md:text-2xl font-bold">${product.base_price.toFixed(2)}</p>
        
        <div className="flex items-center gap-2 ml-auto">
          <Button
            variant="outline"
            size="icon"
            className="bg-white/10 border-white/20 hover:bg-white/20"
            onClick={onCartClick}
          >
            <ShoppingCart className="h-4 w-4 md:h-5 md:w-5" />
          </Button>
          <Button
            variant="outline"
            className="bg-white/10 border-white/20 hover:bg-white/20"
            onClick={onBuyNow}
          >
            Buy Now
          </Button>
        </div>
      </div>

      {/* Expanded Section */}
      {isExpanded && (
        <div className="mt-4 space-y-4">
          {/* Size Selection */}
          <div>
            <Label className="text-sm text-white/60 mb-2">Size</Label>
            <div className="flex flex-wrap gap-2">
              {sizeButtons}
            </div>
          </div>

          {/* Color Selection */}
          <div>
            <Label className="text-sm text-white/60 mb-2">Color</Label>
            <div className="flex flex-wrap gap-2">
              {colorButtons}
            </div>
          </div>

          {/* Quantity */}
          <div>
            <Label className="text-sm text-white/60 mb-2">Quantity</Label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={handleQuantityChange}
              className="w-20 px-2 py-1 text-sm bg-black/40 border border-white/20 rounded-md text-white"
            />
          </div>

          {/* Error Message */}
          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          {/* Action Button */}
          <Button
            className="w-full bg-white text-black hover:bg-white/90"
            onClick={expandedBy === 'buy' ? onBuyNow : handleAddToCart}
          >
            {expandedBy === 'buy' ? 'Buy Now' : 'Add to Cart'}
          </Button>
        </div>
      )}
    </div>
  );
}; 