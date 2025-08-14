"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { ShoppingBag, Star } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface ProductType {
  id: string;
  name: string;
  description: string | null;
  base_price: number;
  is_branded_item: boolean;
  active: boolean;
}

interface ProductTypeImage {
  id: string;
  product_type_id: string;
  image_path: string;
  vertical_offset: number;
  is_default_model: boolean;
}

interface ProductTypeWithImages extends ProductType {
  images: ProductTypeImage[];
}

export default function BrandedItemsPage() {
  const [brandedProductTypes, setBrandedProductTypes] = useState<ProductTypeWithImages[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBrandedProductTypes();
  }, []);

  const fetchBrandedProductTypes = async () => {
    try {
      setLoading(true);
      
      // Fetch only branded product types
      const { data: types, error: typesError } = await supabase
        .from('product_types')
        .select('*')
        .eq('is_branded_item', true)
        .eq('active', true)
        .order('name');

      if (typesError) throw typesError;

      // Fetch images for these product types
      const { data: images, error: imagesError } = await supabase
        .from('product_type_images')
        .select('*')
        .in('product_type_id', types.map(t => t.id));

      if (imagesError) throw imagesError;

      // Combine product types with their images
      const typesWithImages = types.map(type => ({
        ...type,
        images: images.filter(img => img.product_type_id === type.id) || []
      }));

      setBrandedProductTypes(typesWithImages);
    } catch (error) {
      console.error('Error fetching branded product types:', error);
      setError('Failed to load branded items');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto"></div>
          <p className="mt-4">Loading branded items...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Error</h1>
          <p className="text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4" style={{ fontFamily: 'Chalkduster, fantasy' }}>
            Branded Merchandise
          </h1>
          <p className="text-xl text-white/70 max-w-2xl mx-auto">
            Show your love for Famousince with our exclusive branded items. 
            No customization needed - just pure branded goodness!
          </p>
        </div>

        {/* Product Types Grid */}
        {brandedProductTypes.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingBag className="h-24 w-24 text-white/20 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">No Branded Items Available</h2>
            <p className="text-white/60">
              Check back soon for new branded merchandise!
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {brandedProductTypes.map((productType) => {
              const defaultImage = productType.images.find(img => img.is_default_model) || productType.images[0];
              const productTypeSlug = productType.name.toLowerCase().replace(/\s+/g, '-');
              
              return (
                <div 
                  key={productType.id}
                  className="bg-white/5 border border-white/20 rounded-lg overflow-hidden hover:bg-white/10 transition-colors group"
                >
                  {/* Product Image */}
                  <div className="relative aspect-square bg-white/5">
                    {defaultImage ? (
                      <Image
                        src={defaultImage.image_path}
                        alt={productType.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-white/40">
                        <ShoppingBag className="h-16 w-16" />
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="p-6">
                    <h3 className="text-xl font-semibold mb-2">{productType.name}</h3>
                    
                    {productType.description && (
                      <p className="text-white/70 mb-4 line-clamp-2">
                        {productType.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between mb-4">
                      <span className="text-2xl font-bold">
                        ${(productType.base_price / 100).toFixed(2)}
                      </span>
                      <div className="flex items-center text-yellow-400">
                        <Star className="h-4 w-4 fill-current" />
                        <Star className="h-4 w-4 fill-current" />
                        <Star className="h-4 w-4 fill-current" />
                        <Star className="h-4 w-4 fill-current" />
                        <Star className="h-4 w-4 fill-current" />
                      </div>
                    </div>

                    <Link href={`/shop/branded/${productTypeSlug}`}>
                      <Button className="w-full bg-white text-black hover:bg-white/90">
                        <ShoppingBag className="mr-2 h-4 w-4" />
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Call to Action */}
        <div className="text-center mt-16 p-8 bg-white/5 border border-white/20 rounded-lg">
          <h2 className="text-2xl font-semibold mb-4">Looking for Custom Products?</h2>
          <p className="text-white/70 mb-6">
            Create your own unique famous moments with our custom product designer!
          </p>
          <Link href="/">
            <Button variant="outline" className="border-white/20 bg-transparent hover:bg-white/10">
              Go to Custom Designer
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
