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
  product_type_id: string;
}

interface HomepageDisplay {
  position: number;
  product_id: string | null;
}

interface Notification {
  type: 'success' | 'error';
  message: string;
}

interface ProductWithVariants extends Product {
  variants: {
    id: string;
    size: string;
    color: string;
    price: number;
    stock_quantity: number;
  }[];
}

const HomePageDisplay: React.FC = () => {
  const [products, setProducts] = useState<ProductWithVariants[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<{ [key: number]: string }>({});
  const [randomPositions, setRandomPositions] = useState<number[]>([]);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [error, setError] = useState<string | null>(null);
  const numPositions = 4;
  
  // Add ref to track state changes
  const stateRef = React.useRef<{
    selectedProducts: { [key: number]: string };
    randomPositions: number[];
  }>({
    selectedProducts: {},
    randomPositions: []
  });

  // Update ref when state changes
  useEffect(() => {
    stateRef.current.selectedProducts = selectedProducts;
    stateRef.current.randomPositions = randomPositions;
  }, [selectedProducts, randomPositions]);

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
        .select(`
          *,
          variants:product_variants (
            id,
            size,
            color,
            price,
            stock_quantity
          )
        `)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Supabase error fetching products:", error);
        throw error;
      }
      
      setProducts(data || []);
    } catch (error) {
      console.error("Error fetching products:", error);
      setError("Failed to fetch products");
      setNotification({ type: 'error', message: 'Failed to load products' });
    } finally {
      setLoading(false);
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

      // Initialize state objects
      const displayConfig: { [key: number]: string } = {};
      const randomPos: number[] = [];

      // First, check if all positions are random
      const allRandom = data?.every(item => item.product_id === null);
      
      if (allRandom) {
        // If all positions are random, add all positions to randomPos
        for (let i = 0; i < numPositions; i++) {
          randomPos.push(i);
        }
      } else {
        // Otherwise, process each position normally
        data?.forEach((item: HomepageDisplay) => {
          if (item.product_id === null) {
            randomPos.push(item.position);
          } else {
            displayConfig[item.position] = item.product_id;
          }
        });
      }
      
      // Update both state and ref
      setSelectedProducts(displayConfig);
      setRandomPositions(randomPos);
      stateRef.current = {
        selectedProducts: displayConfig,
        randomPositions: randomPos
      };
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
    // Create new state objects based on current ref state
    const newSelectedProducts = { ...stateRef.current.selectedProducts };
    const newRandomPositions = [...stateRef.current.randomPositions];
    
    if (value === "none") {
      delete newSelectedProducts[position];
      const randomIndex = newRandomPositions.indexOf(position);
      if (randomIndex > -1) {
        newRandomPositions.splice(randomIndex, 1);
      }
    } else if (value === "random") {
      delete newSelectedProducts[position];
      if (!newRandomPositions.includes(position)) {
        newRandomPositions.push(position);
      }
    } else {
      newSelectedProducts[position] = value;
      const randomIndex = newRandomPositions.indexOf(position);
      if (randomIndex > -1) {
        newRandomPositions.splice(randomIndex, 1);
      }
    }
    
    // Update both state and ref immediately
    stateRef.current = {
      selectedProducts: newSelectedProducts,
      randomPositions: newRandomPositions
    };
    
    // Update React state
    setSelectedProducts(newSelectedProducts);
    setRandomPositions(newRandomPositions);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = Array.from({ length: numPositions }).map((_, position) => {
        const isRandom = stateRef.current.randomPositions.includes(position);
        const productId = stateRef.current.selectedProducts[position];
        
        return {
          position,
          product_id: isRandom ? null : (productId || null),
          updated_at: new Date().toISOString()
        };
      });

      // First delete all existing entries
      const { error: deleteError } = await supabase
        .from("homepage_display")
        .delete()
        .neq("position", -1);

      if (deleteError) throw deleteError;

      // Then insert the new configuration
      const { error: insertError } = await supabase
        .from("homepage_display")
        .insert(updates);

      if (insertError) throw insertError;

      // Verify the save
      const { data: verificationData } = await supabase
        .from("homepage_display")
        .select("*")
        .order("position");

      setNotification({ type: 'success', message: 'Homepage display configuration saved' });
      
      // Refresh the display
      await fetchHomepageDisplay();
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
              value={randomPositions.includes(index) ? "random" : (selectedProducts[index] || "none")}
              onValueChange={(value) => handleProductSelect(index, value)}
            >
              <SelectTrigger className="w-full bg-white/10 border-white/20 text-white">
                <SelectValue>
                  {randomPositions.includes(index) ? (
                    "Random"
                  ) : selectedProducts[index] ? (
                    products.find(p => p.id === selectedProducts[index])?.description || "Select a product"
                  ) : (
                    "Select a product"
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-black border border-white/20 text-white z-50">
                <SelectItem value="none" className="text-white hover:bg-white/10">None</SelectItem>
                <SelectItem value="random" className="text-white hover:bg-white/10">Random</SelectItem>
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