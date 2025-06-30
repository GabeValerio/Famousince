"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import Image from "next/image";
import { Box, Save, Shuffle, Download } from 'lucide-react';
import { downloadFamousPreset } from "@/app/utils/downloadFamousPreset";

interface Product {
  id: string;
  name: string;
  description?: string;
  front_image_url?: string;
  back_image_url?: string;
  base_price: number;
  application: string;
  garment: string;
}

interface HomepageDisplay {
  position: number;
  product_id: string | null;
}

interface Notification {
  type: 'success' | 'error';
  message: string;
}

const HomePageDisplay: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<{ [key: number]: string }>({});
  const [randomPositions, setRandomPositions] = useState<number[]>([]);
  const [notification, setNotification] = useState<Notification | null>(null);
  const numPositions = 4;

  useEffect(() => {
    fetchProducts();
    fetchHomepageDisplay();

    // Add event listener for save layout
    const handleSaveLayout = () => {
      handleSave();
    };

    window.addEventListener('saveLayout', handleSaveLayout);

    return () => {
      window.removeEventListener('saveLayout', handleSaveLayout);
    };
  }, []);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      console.log("Fetched products:", data);
      setProducts(data || []);
    } catch (error) {
      console.error("Error fetching products:", error);
      setNotification({ type: 'error', message: 'Failed to load products' });
    }
  };

  const fetchHomepageDisplay = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("homepage_display")
        .select("*")
        .order("position");

      if (error) throw error;

      console.log("Fetched homepage display:", data);

      const displayConfig: { [key: number]: string } = {};
      const randomPos: number[] = [];

      data?.forEach((item: HomepageDisplay) => {
        if (item.product_id) {
          displayConfig[item.position] = item.product_id;
        } else {
          // If no product is selected, mark this position as random
          randomPos.push(item.position);
        }
      });

      // Assign random products to random positions
      randomPos.forEach(position => {
        const randomProduct = getRandomProduct(displayConfig);
        if (randomProduct) {
          displayConfig[position] = randomProduct.id;
        }
      });

      setRandomPositions(randomPos);
      setSelectedProducts(displayConfig);
    } catch (error) {
      console.error("Error fetching homepage display:", error);
      setNotification({ type: 'error', message: 'Failed to load homepage configuration' });
    } finally {
      setLoading(false);
    }
  };

  const getRandomProduct = (currentConfig: { [key: number]: string }) => {
    // Get all currently selected product IDs
    const selectedIds = Object.values(currentConfig);
    
    // Filter out products that are already selected
    const availableProducts = products.filter(product => !selectedIds.includes(product.id));
    
    if (availableProducts.length === 0) return null;
    
    // Return a random product from available ones
    return availableProducts[Math.floor(Math.random() * availableProducts.length)];
  };

  const handleProductSelect = (position: number, value: string) => {
    console.log("Selecting product:", { position, value });
    setSelectedProducts(prev => {
      const newState = { ...prev };
      
      if (value === "none") {
        delete newState[position];
        setRandomPositions(prev => prev.filter(p => p !== position));
      } else if (value === "random") {
        // For random selection, remove any existing selection and mark position as random
        delete newState[position];
        setRandomPositions(prev => [...prev, position]);
      } else {
        newState[position] = value;
        setRandomPositions(prev => prev.filter(p => p !== position));
      }
      
      return newState;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      for (let position = 0; position < numPositions; position++) {
        const isRandom = randomPositions.includes(position);
        const { error } = await supabase
          .from("homepage_display")
          .upsert({
            position,
            product_id: isRandom ? null : (selectedProducts[position] || null)
          }, {
            onConflict: "position"
          });

        if (error) throw error;
      }

      setNotification({ type: 'success', message: 'Homepage display configuration saved' });
      // Refresh the display to get new random products
      fetchHomepageDisplay();
    } catch (error) {
      console.error("Error saving homepage display:", error);
      setNotification({ type: 'error', message: 'Failed to save homepage configuration' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
        <p className="mt-2 text-white/60">Loading products...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {notification && (
        <div 
          className={`p-4 rounded-lg ${
            notification.type === 'success' 
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
              : 'bg-red-500/10 border border-red-500/20 text-red-400'
          }`}
        >
          {notification.message}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: numPositions }).map((_, index) => (
          <div key={index} className="bg-white/5 rounded-lg p-4 border border-white/20">
            <h3 className="text-sm font-medium text-white/80 mb-2">
              Position {index + 1} {index === 0 && "(Most Famous)"}
            </h3>
            
            <Select
              value={selectedProducts[index] || "none"}
              onValueChange={(value) => handleProductSelect(index, value)}
            >
              <SelectTrigger className="w-full bg-white/10 border-white/20 text-white">
                <SelectValue>
                  {selectedProducts[index] ? (
                    products.find(p => p.id === selectedProducts[index])?.description || "Select a product"
                  ) : (
                    "Select a product"
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-black border border-white/20 text-white z-50">
                <SelectItem value="none" className="text-white hover:bg-white/10">None</SelectItem>
                {products.map((product) => (
                  <SelectItem 
                    key={product.id} 
                    value={product.id}
                    className="text-white hover:bg-white/10"
                  >
                    {product.description || product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="mt-4">
              {selectedProducts[index] && !randomPositions.includes(index) && (
                <div className="relative w-full aspect-square">
                  {products.find(p => p.id === selectedProducts[index])?.front_image_url ? (
                    <Image
                      src={products.find(p => p.id === selectedProducts[index])?.front_image_url || ""}
                      alt="Selected product"
                      fill
                      className="object-contain rounded"
                    />
                  ) : (
                    <div className="w-full h-full bg-white/10 flex items-center justify-center rounded">
                      <Box className="h-8 w-8 text-white/40" />
                    </div>
                  )}
                </div>
              )}

              {selectedProducts[index] && !randomPositions.includes(index) && (
                <div className="flex justify-end mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const product = products.find(p => p.id === selectedProducts[index]);
                      if (product?.description) {
                        downloadFamousPreset(product.description).catch(console.error);
                      }
                    }}
                    className="w-full border-white/20 bg-black hover:bg-white hover:text-black text-white transition-colors"
                    disabled={!products.find(p => p.id === selectedProducts[index])?.description}
                  >
                    <Download className="h-4 w-4 mr-1" /> Famous Preset
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HomePageDisplay; 