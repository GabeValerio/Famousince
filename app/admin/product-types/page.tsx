"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Box } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Image from 'next/image';
import { ProductTypeEditModal } from './components/ProductTypeEditModal';
import { ConfirmationModal } from './components/ConfirmationModal';

interface ProductType {
  id: string;
  name: string;
  active: boolean;
  base_price: number;
  stripe_account_id: string | null;
  is_default: boolean;
}

interface ProductTypeImage {
  id: string;
  product_type_id: string;
  image_path: string;
  vertical_offset: number;
}

interface ProductTypeWithImages extends ProductType {
  images: ProductTypeImage[];
}

export default function ProductTypesPage() {
  const [productTypes, setProductTypes] = useState<ProductTypeWithImages[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<ProductType | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchProductTypes();
  }, []);

  const fetchProductTypes = async () => {
    try {
      // Fetch product types
      const { data: types, error: typesError } = await supabase
        .from('product_types')
        .select('*')
        .order('name');

      if (typesError) throw typesError;

      // Fetch images for all product types
      const { data: images, error: imagesError } = await supabase
        .from('product_type_images')
        .select('*');

      if (imagesError) throw imagesError;

      // Combine product types with their images
      const typesWithImages = types.map(type => ({
        ...type,
        images: images.filter(img => img.product_type_id === type.id) || []
      }));

      setProductTypes(typesWithImages);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching product types:', error);
      setError('Failed to fetch product types');
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteConfirm(id);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;

    try {
      const { error } = await supabase
        .from('product_types')
        .delete()
        .eq('id', deleteConfirm);

      if (error) throw error;

      setProductTypes(productTypes.filter(type => type.id !== deleteConfirm));
      setSuccess('Product type deleted successfully!');
      setTimeout(() => setSuccess(null), 2000);
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting product type:', error);
      setError('Failed to delete product type');
    }
  };

  const handleProductTypeUpdate = () => {
    fetchProductTypes();
    setSuccess(editingType ? 'Product type updated successfully!' : 'Product type added successfully!');
    setTimeout(() => setSuccess(null), 2000);
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
        <p className="mt-2 text-white/60">Loading product types...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 
          className="text-white text-2xl md:text-3xl"
          style={{ fontFamily: 'Chalkduster, fantasy' }}
        >
          Product Types
        </h1>
        <Button
          onClick={() => {
            setEditingType(null);
            setIsModalOpen(true);
          }}
          className="bg-white text-black hover:bg-white/90"
          style={{ fontFamily: 'Chalkduster, fantasy' }}
        >
          Add New Product Type
        </Button>
      </div>

      <div className="bg-black/50 backdrop-blur-sm rounded-lg border border-white/20 p-6 relative">
        {success && (
          <div className="mb-4 p-2 bg-green-500/10 border border-green-500/20 rounded text-green-400">
            {success}
          </div>
        )}

        {error && (
          <div className="mb-4 p-2 bg-red-500/10 border border-red-500/20 rounded text-red-400">
            {error}
          </div>
        )}

        {productTypes.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-lg text-white/80">No product types to display yet.</p>
            <p className="mt-2 text-white/60">Click the "Add New Product Type" button to create your first product type.</p>
          </div>
        ) : (
          <div className="relative">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/20">
                    <TableHead className="text-white/60">Name</TableHead>
                    <TableHead className="text-white/60">Status</TableHead>
                    <TableHead className="text-white/60">Base Price</TableHead>
                    <TableHead className="text-white/60">Stripe Account</TableHead>
                    <TableHead className="text-white/60">Preview</TableHead>
                    <TableHead className="text-white/60 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productTypes.map((type) => (
                    <TableRow key={type.id} className="border-white/20">
                      <TableCell className="font-medium text-white">
                        {type.name}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          type.active 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-gray-500/20 text-gray-400'
                        }`}>
                          {type.active ? 'Active' : 'Inactive'}
                        </span>
                      </TableCell>
                      <TableCell className="text-white">
                        ${type.base_price.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-white">
                        {type.stripe_account_id ? (
                          <span className="text-xs font-mono bg-white/10 px-2 py-1 rounded">
                            {type.stripe_account_id.slice(0, 8)}...
                          </span>
                        ) : (
                          <span className="text-white/40">Not set</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {type.images.map((image) => (
                            <div 
                              key={image.id}
                              className="relative w-12 h-12 border border-white/20 rounded overflow-hidden"
                              title={`Vertical offset: ${image.vertical_offset}`}
                            >
                              <Image
                                src={image.image_path}
                                alt={`${type.name} preview`}
                                fill
                                style={{ objectFit: 'cover' }}
                              />
                            </div>
                          ))}
                          {type.images.length === 0 && (
                            <div className="w-12 h-12 bg-white/10 flex items-center justify-center rounded border border-white/20">
                              <Box className="h-6 w-6 text-white/40" />
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            onClick={() => {
                              setEditingType(type);
                              setIsModalOpen(true);
                            }}
                            variant="outline"
                            size="sm"
                            className="border-white/20 bg-black hover:bg-white hover:text-black text-white transition-colors"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() => handleDelete(type.id)}
                            variant="outline"
                            size="sm"
                            className="border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        <ProductTypeEditModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingType(null);
          }}
          editingType={editingType}
          onProductTypeUpdated={handleProductTypeUpdate}
        />

        <ConfirmationModal
          isOpen={!!deleteConfirm}
          onClose={() => setDeleteConfirm(null)}
          onConfirm={confirmDelete}
          title="Delete Product Type"
          message="Are you sure you want to delete this product type? This will also delete all associated sizes and images."
          confirmText="Delete"
          cancelText="Cancel"
          confirmVariant="destructive"
        />
      </div>
    </div>
  );
} 