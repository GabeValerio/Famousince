"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Star, Check } from 'lucide-react';
import { useCart } from '@/lib/CartContext';
import Image from 'next/image';
import { BrandedProductType, ProductTypeImage, ProductSize } from '@/types/products';

interface ProductVariant {
  id: string;
  product_id: string;
  size: string;
  color: string;
  price: number;
  stock_quantity: number;
  front_image_url?: string;
  back_image_url?: string;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  base_price: number;
  front_image_url?: string;
  back_image_url?: string;
  product_type_id: string;
  created_at: string;
  updated_at: string;
  product_variants: ProductVariant[];
}

export default function BrandedProductPage() {
  const params = useParams();
  const productTypeSlug = params['product-type'] as string;
  const { addToCart } = useCart();
  
  const [productType, setProductType] = useState<BrandedProductType | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (productTypeSlug) {
      fetchProductType();
    }
  }, [productTypeSlug]);

  const fetchProductType = async () => {
    try {
      setLoading(true);
      
      console.log('Looking for product type with slug:', productTypeSlug);
      
      // First, let's see what branded product types exist
      const { data: allBrandedTypes, error: listError } = await supabase
        .from('product_types')
        .select('*')
        .eq('is_branded_item', true)
        .eq('active', true);
      
      if (listError) {
        console.error('Error listing branded types:', listError);
        throw listError;
      }
      
      console.log('Available branded product types:', allBrandedTypes);
      
      // Try to find exact match first
      let types = allBrandedTypes.find(type => 
        type.name.toLowerCase().replace(/\s+/g, '-') === productTypeSlug.toLowerCase()
      );
      
      // If no exact match, try partial match
      if (!types) {
        types = allBrandedTypes.find(type => 
          type.name.toLowerCase().includes(productTypeSlug.toLowerCase()) ||
          productTypeSlug.toLowerCase().includes(type.name.toLowerCase().replace(/\s+/g, ''))
        );
      }
      
      if (!types) {
        console.error('No product type found for slug:', productTypeSlug);
        console.error('Available types:', allBrandedTypes.map(t => t.name));
        throw new Error(`Product type not found for: ${productTypeSlug}. Available types: ${allBrandedTypes.map(t => t.name).join(', ')}`);
      }

      console.log('Found product type:', types);

      setProductType(types);

      // Fetch products of this type
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select(`
          *,
          product_variants (*)
        `)
        .eq('product_type_id', types.id);

      if (productsError) throw productsError;
      setProducts(productsData || []);

      // Set default selections
      if (productsData && productsData.length > 0) {
        const firstProduct = productsData[0];
        if (firstProduct.product_variants && firstProduct.product_variants.length > 0) {
          const firstVariant = firstProduct.product_variants[0];
          setSelectedSize(firstVariant.size);
          setSelectedColor(firstVariant.color);
          setSelectedVariant(firstVariant);
        }
      }

    } catch (error) {
      console.error('Error fetching product type:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load product';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!selectedVariant || !productType) return;

    const cartItem = {
      id: selectedVariant.id,
      product_id: selectedVariant.product_id,
      quantity: quantity,
      price: selectedVariant.price,
      name: `${productType.name} - ${selectedSize} ${selectedColor}`,
      description: productType.description || '',
      size: selectedSize,
      color: selectedColor,
      front_image_url: selectedVariant.front_image_url,
      back_image_url: selectedVariant.back_image_url
    };

    addToCart(cartItem);
  };

  const getAvailableVariants = () => {
    const variants: ProductVariant[] = [];
    products.forEach(product => {
      if (product.product_variants) {
        variants.push(...product.product_variants);
      }
    });
    return variants;
  };

  const getAvailableSizes = () => {
    const variants = getAvailableVariants();
    return [...new Set(variants.map(v => v.size))].sort();
  };

  const getAvailableColors = () => {
    const variants = getAvailableVariants();
    return [...new Set(variants.map(v => v.color))].sort();
  };

  const updateSelectedVariant = () => {
    if (!selectedSize || !selectedColor) return;

    const variants = getAvailableVariants();
    const variant = variants.find(v => v.size === selectedSize && v.color === selectedColor);
    setSelectedVariant(variant || null);
  };

  useEffect(() => {
    updateSelectedVariant();
  }, [selectedSize, selectedColor]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto"></div>
          <p className="mt-4">Loading product...</p>
        </div>
      </div>
    );
  }

  if (error || !productType) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
          <p className="text-gray-400">{error || 'This product type does not exist or is not available.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-12">
          {/* Product Images */}
          <div className="space-y-6">
            <div className="relative aspect-square bg-white/5 rounded-lg overflow-hidden">
              {selectedVariant?.front_image_url ? (
                <Image
                  src={selectedVariant.front_image_url}
                  alt={productType.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-white/40">
                  <span>No image available</span>
                </div>
              )}
            </div>
            
            {selectedVariant?.back_image_url && (
              <div className="relative aspect-square bg-white/5 rounded-lg overflow-hidden">
                <Image
                  src={selectedVariant.back_image_url}
                  alt={`${productType.name} - Back`}
                  fill
                  className="object-cover"
                />
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl font-bold mb-2">{productType.name}</h1>
              {productType.description && (
                <p className="text-white/70 text-lg">{productType.description}</p>
              )}
            </div>

            {/* Price */}
            <div className="text-3xl font-bold">
              ${selectedVariant?.price ? selectedVariant.price.toFixed(2) : productType.base_price.toFixed(2)}
            </div>

            {/* Size Selection */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Size</h3>
              <div className="flex flex-wrap gap-2">
                {getAvailableSizes().map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`px-4 py-2 rounded border transition-colors ${
                      selectedSize === size
                        ? 'border-white bg-white text-black'
                        : 'border-white/20 hover:border-white/40'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Selection */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Color</h3>
              <div className="flex flex-wrap gap-2">
                {getAvailableColors().map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`px-4 py-2 rounded border transition-colors ${
                      selectedColor === color
                        ? 'border-white bg-white text-black'
                        : 'border-white/20 hover:border-white/40'
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Quantity</h3>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded border border-white/20 hover:border-white/40 flex items-center justify-center"
                >
                  -
                </button>
                <span className="text-xl font-semibold w-16 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 rounded border border-white/20 hover:border-white/40 flex items-center justify-center"
                >
                  +
                </button>
              </div>
            </div>

            {/* Add to Cart */}
            <Button
              onClick={handleAddToCart}
              disabled={!selectedVariant || !selectedSize || !selectedColor}
              className="w-full bg-white text-black hover:bg-white/90 py-3 text-lg font-semibold"
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              Add to Cart
            </Button>


          </div>
        </div>
      </div>
    </div>
  );
}
