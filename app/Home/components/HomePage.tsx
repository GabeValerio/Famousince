"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ProductCard } from "./ProductCard"
import { supabase } from "@/lib/supabaseClient"

interface DatabaseProduct {
  id: string;
  name: string;
  description?: string;
  front_image_url?: string;
  back_image_url?: string;
  base_price: number;
  application: string;
  garment: string;
  variants?: Array<{
    id: string;
    size: string;
    color?: string;
    price?: number;
  }>;
}

interface ProductVariant {
  id: string;
  size: string;
  color: string;
  price: number;
}

interface DisplayProduct {
  id: string;
  product_id: string;
  variant_id: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  image: string;
  size: string;
  color: string;
  famousLine: string;
  customization: {
    topLine: string;
    bottomLine: string;
  };
  variants: ProductVariant[];
}

interface HomepageDisplay {
  position: number;
  product_id: string | null;
}

function ShirtProductsGrid() {
  const [products, setProducts] = useState<DisplayProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHomepageProducts = async () => {
      try {
        // First get all available products
        const { data: allProducts, error: productsError } = await supabase
          .from("products")
          .select(`
            *,
            variants:product_variants(
              id,
              size,
              color,
              price
            )
          `);

        if (productsError) throw productsError;

        // Get the homepage display configuration
        const { data: displayData, error: displayError } = await supabase
          .from("homepage_display")
          .select("*")
          .order("position");

        if (displayError) throw displayError;

        // Transform all products to match DisplayProduct interface
        const transformedAllProducts: DisplayProduct[] = (allProducts as DatabaseProduct[])?.map(product => {
          const defaultVariant = (product.variants && product.variants[0]) || { size: 'M', color: 'Black', price: product.base_price };
          const description = product.description || "BEING UNIQUE";
          
          return {
            id: `${product.id}-${defaultVariant.size}-${defaultVariant.color || 'Black'}-${encodeURIComponent(description)}`,
            product_id: product.id,
            variant_id: `${defaultVariant.size}-${defaultVariant.color || 'Black'}`,
            name: `Famous Since ${description} T-Shirt`,
            description: description,
            price: product.base_price,
            quantity: 1,
            image: product.front_image_url || "",
            size: defaultVariant.size,
            color: defaultVariant.color || 'Black',
            famousLine: description,
            customization: {
              topLine: "FAMOUS SINCE",
              bottomLine: description
            },
            variants: (product.variants || []).map(v => ({
              id: v.id,
              size: v.size,
              color: v.color || "Black",
              price: v.price || product.base_price
            }))
          };
        });

        // Create an array with the exact length of display positions, initialized with undefined
        const displayProducts: (DisplayProduct | undefined)[] = new Array(displayData.length).fill(undefined);
        const usedProductIds = new Set<string>();

        // First pass: Place specifically assigned products
        displayData.forEach((display: HomepageDisplay, index: number) => {
          if (display.product_id) {
            const product = transformedAllProducts.find(p => p.product_id === display.product_id);
            if (product) {
              displayProducts[index] = product;
              usedProductIds.add(product.id);
            }
          }
        });

        // Second pass: Fill random positions
        displayData.forEach((display: HomepageDisplay, index: number) => {
          if (!display.product_id && displayProducts[index] === undefined) {
            // Get available products (not yet used)
            const availableProducts = transformedAllProducts.filter(p => !usedProductIds.has(p.id));
            
            if (availableProducts.length > 0) {
              const randomIndex = Math.floor(Math.random() * availableProducts.length);
              const selectedProduct = availableProducts[randomIndex];
              displayProducts[index] = selectedProduct;
              usedProductIds.add(selectedProduct.id);
            }
          }
        });

        // Filter out any undefined positions and set the products
        setProducts(displayProducts.filter((product): product is DisplayProduct => product !== undefined));
      } catch (error) {
        console.error("Error fetching homepage products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHomepageProducts();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8 max-w-7xl mx-auto px-4">
        {[...Array(4)].map((_, index) => (
          <div 
            key={index}
            className="aspect-[3/4] bg-white/5 rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8 max-w-7xl mx-auto px-4">
      {products.map((product, index) => (
        <ProductCard
          key={product.id}
          product={product}
          isMostFamous={index === 0}
        />
      ))}
    </div>
  );
}

export default function Component() {
  const [customLine, setCustomLine] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleStayFamous = async () => {
    if (!customLine.trim()) {
      return;
    }

    setLoading(true);
    try {
      // Store the custom line in localStorage
      localStorage.setItem("customLine", customLine);
      
      // Navigate to the StayFamous page with the description parameter
      router.push(`/StayFamous/${encodeURIComponent(customLine.replace(/\s+/g, '_'))}`);
    } catch (error) {
      console.error("Error navigating:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        {/* Main content area */}
        <div className="text-center space-y-4 mb-16">
          <h1 
            className="text-6xl md:text-8xl lg:text-9xl font-bold tracking-tight" 
            style={{ fontFamily: 'Chalkduster' }}
          >
            FAMOUS SINCE
          </h1>

          {/* Input section directly underneath */}
          <div className="max-w-md mx-auto space-y-4">
            <Input
              type="text"
              placeholder="ENTER WHAT MAKES YOU FAMOUS"
              value={customLine.toUpperCase()}
              onChange={(e) => setCustomLine(e.target.value.toUpperCase())}
              className="w-full bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-white/40 text-center"
            />
            <Button
              onClick={handleStayFamous}
              variant="outline"
              className="px-8 bg-white text-black hover:bg-white/90 relative"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="opacity-0">Stay Famous</span>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                  </div>
                </>
              ) : (
                'stay famous'
              )}
            </Button>
          </div>
        </div>

        {/* Shirt products section */}
        <ShirtProductsGrid />
      </div>
    </div>
  )
}
