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
  product_type_id: string;
  variants?: Array<{
    id: string;
    size: string;
    color: string;
    price: number;
    stock_quantity: number;
  }>;
}

interface ProductVariant {
  id: string;
  size: string;
  color: string;
  price: number;
  stock_quantity: number;
}

interface DisplayProduct {
  id: string;
  name: string;
  description: string;
  base_price: number;
  application: string;
  front_image_url?: string;
  back_image_url?: string;
  product_type_id: string;
  variants: ProductVariant[];
  famousLine: string;
  customization: {
    topLine: string;
    bottomLine: string;
  };
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
              price,
              stock_quantity
            )
          `);

        if (productsError) throw productsError;

        // Get the homepage display configuration
        const { data: displayData, error: displayError } = await supabase
          .from("homepage_display")
          .select("*")
          .order("position");

        if (displayError) throw displayError;

        // Ensure we have exactly 4 display positions
        const normalizedDisplayData = Array.from({ length: 4 }, (_, index) => {
          const existingPosition = displayData?.find(d => d.position === index);
          return existingPosition || { position: index, product_id: null };
        });

        // Transform all products to match DisplayProduct interface
        const transformedAllProducts: DisplayProduct[] = (allProducts as DatabaseProduct[])?.map(product => {
          const description = product.description || "BEING UNIQUE";
          
          return {
            id: product.id,
            name: `Famous Since ${description} T-Shirt`,
            description: description,
            base_price: product.base_price,
            application: product.application,
            front_image_url: product.front_image_url,
            back_image_url: product.back_image_url,
            product_type_id: product.product_type_id,
            variants: product.variants || [],
            famousLine: description,
            customization: {
              topLine: "FAMOUS SINCE",
              bottomLine: description
            }
          };
        });

        // Create an array with the exact length of display positions
        const displayProducts: DisplayProduct[] = new Array(4).fill(null);
        const usedProductIds = new Set<string>();

        // First pass: Place specifically assigned products
        normalizedDisplayData.forEach((display, index) => {
          if (display.product_id) {
            const product = transformedAllProducts.find(p => p.id === display.product_id);
            if (product) {
              displayProducts[index] = product;
              usedProductIds.add(product.id);
            }
          }
        });

        // Second pass: Fill remaining positions with random products
        for (let i = 0; i < 4; i++) {
          if (!displayProducts[i]) {
            // Get available products (not yet used)
            const availableProducts = transformedAllProducts.filter(p => !usedProductIds.has(p.id));
            
            if (availableProducts.length > 0) {
              // If we have unused products, use one of those
              const randomIndex = Math.floor(Math.random() * availableProducts.length);
              const selectedProduct = availableProducts[randomIndex];
              displayProducts[i] = selectedProduct;
              usedProductIds.add(selectedProduct.id);
            } else if (transformedAllProducts.length > 0) {
              // If we need to reuse products, try to avoid using the most recently used ones
              const recentlyUsed = new Set(
                displayProducts
                  .slice(Math.max(0, i - 2), i)
                  .filter(Boolean)
                  .map(p => p.id)
              );
              
              const leastRecentlyUsed = transformedAllProducts.filter(p => !recentlyUsed.has(p.id));
              const productPool = leastRecentlyUsed.length > 0 ? leastRecentlyUsed : transformedAllProducts;
              const randomProduct = productPool[Math.floor(Math.random() * productPool.length)];
              displayProducts[i] = randomProduct;
            }
          }
        }

        // Set the products, ensuring all positions are filled and we only have 4
        setProducts(displayProducts.slice(0, 4));
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

  // Add check for empty products
  if (!products || products.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: 'Chalkduster, fantasy' }}>
          NO PRODUCTS YET
        </h2>
        <p className="text-white/60">
          Check back soon for new products!
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8 max-w-7xl mx-auto px-4">
      {products.filter(product => product !== null).map((product, index) => (
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
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleStayFamous = async () => {
    const line = customLine.trim();
    if (!line) {
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Check if any word in the custom line matches an exception
      const words = line.split(/\s+/).map(word => word.toUpperCase());
      
      const { data: exceptions, error: exceptionsError } = await supabase
        .from('exceptions')
        .select('word')
        .in('word', words);

      if (exceptionsError) {
        throw exceptionsError;
      }

      if (exceptions && exceptions.length > 0) {
        setError(
          "While we appreciate your desire to Stay Famous for this, we aim to keep our platform positive and uplifting. " +
          "Please consider sharing a different moment that showcases your unique story in a constructive way."
        );
        return;
      }

      // Store the custom line in localStorage
      localStorage.setItem("customLine", line);
      
      // Navigate to the StayFamous page with the description parameter
      router.push(`/StayFamous/${encodeURIComponent(line.replace(/\s+/g, '_'))}`);
    } catch (error) {
      console.error("Error:", error);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8">
        {/* Main content area */}
        <div className="text-center space-y-8 mb-16 w-full">
          <h1 
            className="text-4xl sm:text-6xl md:text-7xl lg:text-9xl font-bold tracking-tight whitespace-normal sm:whitespace-nowrap" 
            style={{ fontFamily: 'Chalkduster' }}
          >
            FAMOUS SINCE
          </h1>

          {/* Input section directly underneath */}
          <div className="w-full max-w-md mx-auto space-y-4 px-2 sm:px-0">
            <Input
              type="text"
              placeholder="ENTER WHAT MAKES YOU FAMOUS"
              value={customLine.toUpperCase()}
              onChange={(e) => {
                setCustomLine(e.target.value.toUpperCase());
                setError(null);
              }}
              className="w-full bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-white/40 text-center"
            />
            {error && (
              <div className="p-2 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-sm">
                {error}
              </div>
            )}
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
