"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Plus, X, GripVertical, Upload } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Image from 'next/image';

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
  is_default_model: boolean;
}

interface ProductSize {
  id: string;
  product_type_id: string;
  size: string;
  size_order: number;
}

interface ProductTypeEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingType: ProductType | null;
  onProductTypeUpdated: () => void;
}

export const ProductTypeEditModal = ({
  isOpen,
  onClose,
  editingType,
  onProductTypeUpdated,
}: ProductTypeEditModalProps) => {
  const [name, setName] = useState(editingType?.name || '');
  const [active, setActive] = useState(editingType?.active ?? true);
  const [basePrice, setBasePrice] = useState(editingType?.base_price || 0);
  const [stripeAccountId, setStripeAccountId] = useState(editingType?.stripe_account_id || '');
  const [isDefault, setIsDefault] = useState(editingType?.is_default ?? false);
  const [images, setImages] = useState<ProductTypeImage[]>([]);
  const [newImagePath, setNewImagePath] = useState('');
  const [newVerticalOffset, setNewVerticalOffset] = useState(0);
  const [sizes, setSizes] = useState<ProductSize[]>([]);
  const [newSize, setNewSize] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (editingType) {
      setName(editingType.name);
      setActive(editingType.active ?? true);
      setBasePrice(editingType.base_price || 0);
      setStripeAccountId(editingType.stripe_account_id || '');
      setIsDefault(editingType.is_default ?? false);
      fetchImages(editingType.id);
      fetchSizes(editingType.id);
    } else {
      setImages([]);
      setSizes([]);
      setActive(true);
      setBasePrice(0);
      setStripeAccountId('');
      setIsDefault(false);
    }
  }, [editingType]);

  const fetchImages = async (productTypeId: string) => {
    try {
      const { data, error } = await supabase
        .from('product_type_images')
        .select('*')
        .eq('product_type_id', productTypeId);

      if (error) throw error;
      setImages(data || []);
    } catch (error) {
      console.error('Error fetching images:', error);
      setError('Failed to fetch images');
    }
  };

  const fetchSizes = async (productTypeId: string) => {
    try {
      const { data, error } = await supabase
        .from('product_sizes')
        .select('*')
        .eq('product_type_id', productTypeId)
        .order('size_order');

      if (error) throw error;
      setSizes(data || []);
    } catch (error) {
      console.error('Error fetching sizes:', error);
      setError('Failed to fetch sizes');
    }
  };

  const handleAddImage = async () => {
    if (!newImagePath.trim() || !editingType) return;

    try {
      const { data, error } = await supabase
        .from('product_type_images')
        .insert([{
          product_type_id: editingType.id,
          image_path: newImagePath,
          vertical_offset: newVerticalOffset
        }])
        .select()
        .single();

      if (error) throw error;

      setImages([...images, data]);
      setNewImagePath('');
      setNewVerticalOffset(0);
    } catch (error) {
      console.error('Error adding image:', error);
      setError('Failed to add image');
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    try {
      const { error } = await supabase
        .from('product_type_images')
        .delete()
        .eq('id', imageId);

      if (error) throw error;

      setImages(images.filter(img => img.id !== imageId));
    } catch (error) {
      console.error('Error deleting image:', error);
      setError('Failed to delete image');
    }
  };

  const handleUpdateImage = async (imageId: string, updates: Partial<ProductTypeImage>) => {
    try {
      const { error } = await supabase
        .from('product_type_images')
        .update(updates)
        .eq('id', imageId);

      if (error) throw error;

      setImages(images.map(img => 
        img.id === imageId ? { ...img, ...updates } : img
      ));
    } catch (error) {
      console.error('Error updating image:', error);
      setError('Failed to update image');
    }
  };

  const handleAddSize = async () => {
    if (!newSize.trim() || !editingType) return;

    try {
      const nextOrder = sizes.length > 0 
        ? Math.max(...sizes.map(s => s.size_order)) + 1 
        : 1;

      const { data, error } = await supabase
        .from('product_sizes')
        .insert([{
          product_type_id: editingType.id,
          size: newSize.toUpperCase(),
          size_order: nextOrder
        }])
        .select()
        .single();

      if (error) throw error;

      setSizes([...sizes, data]);
      setNewSize('');
    } catch (error) {
      console.error('Error adding size:', error);
      setError('Failed to add size');
    }
  };

  const handleDeleteSize = async (sizeId: string) => {
    try {
      const { error } = await supabase
        .from('product_sizes')
        .delete()
        .eq('id', sizeId);

      if (error) throw error;

      setSizes(sizes.filter(size => size.id !== sizeId));
    } catch (error) {
      console.error('Error deleting size:', error);
      setError('Failed to delete size');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data, error } = await supabase
        .from('product_types')
        .update({
          name: name,
          active: active,
          base_price: basePrice,
          stripe_account_id: stripeAccountId || null,
          is_default: isDefault,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingType?.id);

      if (error) throw error;

      onProductTypeUpdated();
      onClose();
    } catch (error) {
      setError('Failed to update product type');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setName('');
    setBasePrice(0);
    setStripeAccountId('');
    setImages([]);
    setNewImagePath('');
    setNewVerticalOffset(0);
    setSizes([]);
    setNewSize('');
    setError(null);
    setSuccess(null);
    setIsSubmitting(false);
    onClose();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !editingType) return;
    
    const file = e.target.files[0];
    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('uploadType', 'product-type');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload image');
      }

      const data = await response.json();
      
      // Add the uploaded image to the product type
      const { error: supabaseError } = await supabase
        .from('product_type_images')
        .insert([{
          product_type_id: editingType.id,
          image_path: data.secure_url,
          vertical_offset: 0
        }])
        .select()
        .single();

      if (supabaseError) throw supabaseError;

      // Refresh images
      await fetchImages(editingType.id);
      setSuccess('Image uploaded successfully');
    } catch (error) {
      console.error('Error uploading image:', error);
      setError(error instanceof Error ? error.message : 'Failed to upload image');
    } finally {
      setIsUploading(false);
      // Reset the input
      e.target.value = '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 ${isOpen ? '' : 'hidden'}`}>
      <div className="bg-black border border-white/20 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-white">
            {editingType ? 'Edit Product Type' : 'New Product Type'}
          </h2>
          <Button variant="ghost" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Name
            </label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-black/40 border-white/20 text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Base Price ($)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60">$</span>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={basePrice}
                onChange={(e) => setBasePrice(parseFloat(e.target.value) || 0)}
                className="bg-black/40 border-white/20 text-white pl-7"
                required
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Stripe Connected Account ID
            </label>
            <Input
              type="text"
              value={stripeAccountId}
              onChange={(e) => setStripeAccountId(e.target.value)}
              className="bg-black/40 border-white/20 text-white"
              placeholder="acct_..."
            />
          </div>

          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-white">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="rounded border-white/20 bg-black/40"
              />
              <span>Active (Available in store)</span>
            </label>
          </div>

          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-white">
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="rounded border-white/20 bg-black/40"
              />
              <span>Default Product Type (Used for StayFamous button)</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">Model Images</label>
            <div className="space-y-4">
              {/* Add image upload button */}
              <div className="flex gap-2">
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={isUploading || !editingType}
                    className="hidden"
                    id="imageUpload"
                  />
                  <label 
                    htmlFor="imageUpload" 
                    className={`w-full flex items-center justify-center px-4 py-2 rounded-md cursor-pointer
                      ${isUploading || !editingType 
                        ? 'bg-white/10 text-white/50' 
                        : 'bg-white/10 border-dashed border-2 border-white/20 text-white hover:bg-white/20'}`}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    <span>{isUploading ? 'Uploading...' : 'Upload Image'}</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center text-sm text-white/60">
                <span className="mr-2">Or</span>
                <div className="flex-1 border-t border-white/20"></div>
              </div>

              {/* Existing manual image path input */}
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    value={newImagePath}
                    onChange={(e) => setNewImagePath(e.target.value)}
                    placeholder="Enter image path"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                    disabled={isSubmitting || !editingType}
                  />
                </div>
                <div className="w-24">
                  <Input
                    type="number"
                    value={newVerticalOffset}
                    onChange={(e) => setNewVerticalOffset(parseInt(e.target.value) || 0)}
                    placeholder="Offset"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                    disabled={isSubmitting || !editingType}
                  />
                </div>
                <Button
                  type="button"
                  onClick={handleAddImage}
                  disabled={!newImagePath.trim() || isSubmitting || !editingType}
                  className="bg-white text-black hover:bg-white/90"
                >
                  Add
                </Button>
              </div>

              {/* Existing images */}
              {images.length > 0 && (
                <div className="grid grid-cols-2 gap-4">
                  {images.map((image) => (
                    <div 
                      key={image.id} 
                      className="bg-white/5 border border-white/20 rounded-lg p-3 space-y-2"
                    >
                      <div className="relative w-full aspect-[3/4] max-h-[500px] border border-white/20 rounded overflow-hidden">
                        <Image
                          src={image.image_path}
                          alt="Model preview"
                          fill
                          priority
                          sizes="(max-width: 768px) 100vw, 50vw"
                          style={{ objectFit: "contain" }}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Input
                          value={image.image_path}
                          onChange={(e) => handleUpdateImage(image.id, { image_path: e.target.value })}
                          className="flex-1 bg-white/10 border-white/20 text-white text-sm"
                          disabled={isSubmitting}
                        />
                        <Input
                          type="number"
                          value={image.vertical_offset}
                          onChange={(e) => handleUpdateImage(image.id, { vertical_offset: parseInt(e.target.value) || 0 })}
                          className="w-20 bg-white/10 border-white/20 text-white text-sm"
                          disabled={isSubmitting}
                        />
                        <Button
                          type="button"
                          onClick={() => handleDeleteImage(image.id)}
                          variant="outline"
                          size="sm"
                          className="border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                          disabled={isSubmitting}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex items-center mt-2">
                        <label className="flex items-center space-x-2 text-sm font-medium text-white">
                          <input
                            type="checkbox"
                            checked={image.is_default_model}
                            onChange={(e) => handleUpdateImage(image.id, { is_default_model: e.target.checked })}
                            className="rounded border-white/20 bg-black/40"
                            disabled={isSubmitting}
                          />
                          <span>Default Model</span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {editingType && (
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Manage Sizes</label>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={newSize}
                    onChange={(e) => setNewSize(e.target.value)}
                    placeholder="Enter size (e.g., S, M, L)"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                    disabled={isSubmitting}
                  />
                  <Button
                    type="button"
                    onClick={handleAddSize}
                    disabled={!newSize.trim() || isSubmitting}
                    className="bg-white text-black hover:bg-white/90"
                  >
                    Add Size
                  </Button>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow className="border-white/20">
                      <TableHead className="text-white/60">Size</TableHead>
                      <TableHead className="text-white/60">Order</TableHead>
                      <TableHead className="text-white/60 w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sizes.map((size) => (
                      <TableRow key={size.id} className="border-white/20">
                        <TableCell className="font-medium text-white">
                          {size.size}
                        </TableCell>
                        <TableCell className="text-white">
                          {size.size_order}
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            onClick={() => handleDeleteSize(size.id)}
                            variant="outline"
                            size="sm"
                            className="border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                            disabled={isSubmitting}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="bg-black/40 border-white/20 text-white hover:bg-black/60"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-white text-black hover:bg-white/90"
            >
              {isSubmitting ? 'Saving...' : editingType ? 'Save Changes' : 'Create Product Type'}
            </Button>
          </div>

          {error && (
            <div className="text-red-400 text-sm mt-2">{error}</div>
          )}
          {success && (
            <div className="text-green-400 text-sm mt-2">{success}</div>
          )}
        </form>
      </div>
    </div>
  );
}; 