'use client';

import { useEffect, useState } from 'react';
import ImageGenerator from '@/app/components/ImageGenerator';
import { supabase } from '@/lib/supabaseClient';
import { SimplifiedProductType } from '@/types/products';

export default function MockUpPage() {
  const [productTypes, setProductTypes] = useState<SimplifiedProductType[]>([]);

  useEffect(() => {
    const fetchProductTypes = async () => {
      const { data, error } = await supabase
        .from('product_types')
        .select('id, name, active, images(id, product_type_id, image_path, vertical_offset, is_default_model)')
        .eq('active', true);

      if (error) {
        console.error('Error fetching product types:', error);
        return;
      }

      setProductTypes(data || []);
    };

    fetchProductTypes();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8 text-center" style={{ fontFamily: 'Chalkduster, fantasy' }}>
          Design Your Own
        </h1>
        <div className="h-[calc(100%-3rem)]">
          <ImageGenerator productTypes={productTypes} />
        </div>
      </div>
    </div>
  );
}
