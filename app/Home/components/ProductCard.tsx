"use client";

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import Image from "next/image"
import { ShoppingCart } from "lucide-react"
import type { Product } from "../data/products"
import { MostFamousLabel } from "./MostFamousLabel"
import { useState, useCallback, useMemo } from "react"
import { useCart } from "@/lib/CartContext"
import { useRouter } from "next/navigation"
import React from "react"

interface ProductCardProps {
  product: Product
  isMostFamous?: boolean
}

const SIZES = ["S", "M", "L", "XL", "2XL"] as const;

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

export function ProductCard({ product, isMostFamous }: ProductCardProps) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedBy, setExpandedBy] = useState<'cart' | 'buy' | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [errorMessage, setErrorMessage] = useState("");
  const { addToCart } = useCart();

  const createCartItem = useCallback(() => {
    if (!selectedSize || !selectedColor) {
      setErrorMessage("Please select both size and color");
      return null;
    }

    const variant = product.variants.find(v => v.size === selectedSize);

    if (!variant) {
      setErrorMessage("Selected size is not available");
      return null;
    }

    return {
      id: `${product.id}-${selectedSize}-${selectedColor}-${encodeURIComponent(product.description || '')}`,
      product_id: product.id,
      variant_id: variant.id,
      name: product.name,
      description: product.description,
      price: variant.price,
      quantity: quantity,
      image: product.image,
      size: selectedSize,
      color: selectedColor
    };
  }, [product, selectedSize, selectedColor, quantity]);

  const handleAddToCart = useCallback(() => {
    const cartItem = createCartItem();
    if (cartItem) {
      addToCart(cartItem);
      setErrorMessage("");
      setIsExpanded(false);
      setExpandedBy(null);
    }
  }, [createCartItem, addToCart]);

  const onBuyNow = useCallback(() => {
    if (!isExpanded) {
      setIsExpanded(true);
      setExpandedBy('buy');
      return;
    }

    const cartItem = createCartItem();
    if (cartItem) {
      addToCart(cartItem);
      setErrorMessage("");
      setIsExpanded(false);
      setExpandedBy(null);
      router.push('/shop/checkout');
    }
  }, [isExpanded, createCartItem, addToCart, router]);

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
    SIZES.map(size => (
      <SizeButton
        key={size}
        size={size}
        isSelected={selectedSize === size}
        onSelect={handleSizeSelect}
      />
    ))
  ), [selectedSize, handleSizeSelect]);

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
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          className="object-cover"
          priority={isMostFamous}
        />
      </div>

      {/* For What Text */}
      <div className="text-center mb-4">
        <p className="text-sm md:text-lg italic" style={{ fontFamily: 'Chalkduster, fantasy' }}>{product.famousLine}</p>
      </div>

      {/* Product Details */}
      <div className="flex items-center space-x-4">
        <p className="text-lg md:text-2xl font-bold">${product.price.toFixed(2)}</p>
        
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
            className="bg-white text-black hover:bg-white/90 text-sm md:text-base whitespace-nowrap"
            onClick={onBuyNow}
          >
            Buy Now
          </Button>
        </div>
      </div>

      {/* Expanded Options */}
      {isExpanded && (
        <div className="mt-4 border-t border-white/20 pt-4 space-y-4">
          {/* Quantity and Size Selection */}
          <div className="space-y-3">
            {/* Quantity Row */}
            <div className="flex items-center gap-4">
              <Label className="text-sm text-white whitespace-nowrap">Quantity:</Label>
              <input 
                type="number"
                value={quantity}
                onChange={handleQuantityChange}
                className="w-16 text-center border border-white/20 rounded-md p-1 bg-black/40 text-white text-sm"
                min="1"
              />
            </div>

            {/* Size and Color Row */}
            <div className="flex items-center gap-4">
              <Label className="text-sm text-white whitespace-nowrap">Size:</Label>
              <div className="flex gap-1">
                {sizeButtons}
              </div>
            </div>

            {/* Color Selection */}
            <div className="flex items-center gap-4">
              <Label className="text-sm text-white whitespace-nowrap">Color:</Label>
              <div className="flex gap-1">
                <ColorButton
                  color="Black"
                  isSelected={selectedColor === "Black"}
                  onSelect={handleColorSelect}
                />
              </div>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="text-red-500 text-sm">
              {errorMessage}
            </div>
          )}

          {/* Action Button */}
          <Button
            className="w-full bg-white text-black hover:bg-white/90"
            onClick={expandedBy === 'cart' ? handleAddToCart : onBuyNow}
          >
            {expandedBy === 'cart' ? 'Add to Cart' : 'Buy Now'}
          </Button>
        </div>
      )}
    </div>
  )
} 