"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronRight, ChevronDown, Pencil, Eye, Tag, Box } from 'lucide-react';
import DeleteConfirmationModal from "./DeleteConfirmationModal";
import Link from "next/link";

interface Product {
  id: string;
  name: string;
  description?: string;
  front_image_url?: string;
  back_image_url?: string;
  base_price: number;
  application: string;
  garment: string;
  created_at: string;
  updated_at: string;
}

interface ProductVariant {
  id: string;
  product_id: string;
  size: string;
  color: string;
  application: string;
  garment: string;
  price: number;
  front_image_url?: string;
  back_image_url?: string;
}

const ProductManagement: React.FC = () => {
  const { data: session } = useSession();
  const [products, setProducts] = useState<Product[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [frontImage, setFrontImage] = useState<File | null>(null);
  const [backImage, setBackImage] = useState<File | null>(null);
  const [basePrice, setBasePrice] = useState("");
  const [application, setApplication] = useState("Screen Press");
  const [garment, setGarment] = useState("T-Shirt");
  const [addError, setAddError] = useState("");
  const [addSuccess, setAddSuccess] = useState("");
  const [sizes, setSizes] = useState<string[]>(["S", "M", "L", "XL", "2XL"]);
  const [colors, setColors] = useState<string[]>(["Black"]);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isMobileView, setIsMobileView] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    const handleOpenAddProduct = () => {
      setShowAddProduct(true);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('openAddProduct', handleOpenAddProduct);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('openAddProduct', handleOpenAddProduct);
    };
  }, []);

  // Fetch products and their variants
  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setProducts(data || []);
    } catch (error) {
      setError('Failed to fetch products');
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Handle image upload with error handling and progress
  const handleImageUpload = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const data = await response.json();
      return data.secure_url;
    } catch (error) {
      setError('Failed to upload image');
      return null;
    }
  };

  // Add/Edit product handler
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError("");
    setAddSuccess("");

    if (!name.trim()) {
      setAddError("Product name is required");
      return;
    }

    if (!basePrice || isNaN(Number(basePrice))) {
      setAddError("Valid base price is required");
      return;
    }

    try {
      // Upload images if provided
      let frontImageUrl = editingProduct?.front_image_url;
      let backImageUrl = editingProduct?.back_image_url;

      if (frontImage) {
        frontImageUrl = await handleImageUpload(frontImage);
      }
      if (backImage) {
        backImageUrl = await handleImageUpload(backImage);
      }

      const productData = {
        name: name.trim(),
        description: description.trim() || null,
        front_image_url: frontImageUrl,
        back_image_url: backImageUrl,
        base_price: Number(basePrice),
        application: application.trim(),
        garment: garment.trim(),
      };

      let productId = editingProduct?.id;

      if (editingProduct) {
        // Update existing product
      const { error: updateError } = await supabase
          .from("products")
          .update(productData)
          .eq("id", editingProduct.id);

      if (updateError) throw updateError;
      } else {
        // Insert new product
        const { data: newProduct, error: insertError } = await supabase
          .from("products")
          .insert(productData)
          .select()
          .single();

        if (insertError) throw insertError;
        productId = newProduct.id;
      }

      // Handle variants
      if (productId) {
        // Delete existing variants if editing
        if (editingProduct) {
          await supabase
            .from("product_variants")
            .delete()
            .eq("product_id", productId);
        }

        // Create new variants
        const variantsToInsert = sizes
          .filter(size => size.trim())
          .flatMap(size =>
            colors
              .filter(color => color.trim())
              .map(color => ({
                product_id: productId,
              size,
              color,
                application: application.trim(),
                garment: garment.trim(),
                price: Number(basePrice),
                front_image_url: frontImageUrl,
                back_image_url: backImageUrl,
              }))
          );

        if (variantsToInsert.length > 0) {
          const { error: variantsError } = await supabase
            .from("product_variants")
            .insert(variantsToInsert);

          if (variantsError) throw variantsError;
        }
      }

      setAddSuccess(editingProduct ? "Product updated successfully!" : "Product added successfully!");
      resetForm();
      fetchProducts();
    } catch (error: any) {
      setAddError(error.message);
    }
  };

  // Delete product handler
  const handleDeleteProduct = async (productId: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) {
        throw error;
      }

      setProducts(products.filter(product => product.id !== productId));
    } catch (error) {
      setError('Failed to delete product');
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setName(product.name);
    setDescription(product.description || "");
    setBasePrice(product.base_price.toString());
    setApplication(product.application);
    setGarment(product.garment);
    
    // Get existing variants for this product
    const productVariants = variants.filter(v => v.product_id === product.id);
    const uniqueSizes = Array.from(new Set(productVariants.map(v => v.size)));
    const uniqueColors = Array.from(new Set(productVariants.map(v => v.color)));
    
    setSizes(uniqueSizes.length ? uniqueSizes : ["S", "M", "L", "XL", "2XL"]);
    setColors(uniqueColors.length ? uniqueColors : ["Black"]);
    setShowAddProduct(true);
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setFrontImage(null);
    setBackImage(null);
    setBasePrice("");
    setApplication("Screen Press");
    setGarment("T-Shirt");
    setSizes(["S", "M", "L", "XL", "2XL"]);
    setColors(["Black"]);
    setShowAddProduct(false);
    setEditingProduct(null);
    setAddError("");
    setAddSuccess("");
  };

  // Render loading state
  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
        <p className="mt-2 text-white/60">Loading products...</p>
      </div>
    );
  }

  return (
    <div className="bg-black/50 backdrop-blur-sm rounded-lg border border-white/20 p-6">
      {/* Product List */}
      {products.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-lg text-white/80">No products to display yet.</p>
          <p className="mt-2 text-white/60">Click the "Add Product" button to create your first product.</p>
        </div>
      ) : isMobileView ? (
        <div className="space-y-4">
          {products.map((product) => (
            <div key={product.id} className="bg-white/5 border border-white/20 rounded-lg overflow-hidden">
              <div 
                className="p-4 flex items-center cursor-pointer"
                onClick={() => setExpandedId(expandedId === product.id ? null : product.id)}
              >
                {/* Product image */}
                <div className="flex-shrink-0 mr-3">
                  <div className="relative w-16 h-16">
                    {product.front_image_url ? (
                      <Image
                        src={product.front_image_url}
                        alt={product.name}
                        fill
                        className="object-contain rounded"
                        sizes="64px"
                      />
                    ) : (
                      <div className="w-full h-full bg-white/10 flex items-center justify-center rounded">
                        <Box className="h-6 w-6 text-white/40" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-grow min-w-0">
                  <h3 className="font-medium text-white truncate">{product.name}</h3>
                  <p className="text-xs text-white/60 mt-1 flex items-center">
                    <Tag className="h-3 w-3 mr-1" /> ${product.base_price.toFixed(2)}
                  </p>
                  <p className="text-xs text-white/60 capitalize truncate">
                    {product.garment}
                  </p>
                </div>
                
                {/* Chevron */}
                {expandedId === product.id ? (
                  <ChevronDown className="h-5 w-5 text-white/40" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-white/40" />
                )}
              </div>

              {/* Expanded content */}
              {expandedId === product.id && (
                <div className="px-4 pb-4 border-t border-white/10 bg-white/5">
                  <div className="space-y-3 pt-3">
                    {product.description && (
                      <div>
                        <p className="text-xs font-medium text-white/60 uppercase mb-1">Description</p>
                        <Link 
                          href={`/StayFamous/${encodeURIComponent(product.description)}`}
                          className="text-sm text-white/80 hover:text-white hover:underline transition-colors"
                        >
                          {product.description}
                        </Link>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-medium text-white/60 uppercase mb-1">Application</p>
                        <p className="text-sm text-white/80">{product.application}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-white/60 uppercase mb-1">Variants</p>
                        <p className="text-sm text-white/80">
                          {variants.filter(v => v.product_id === product.id).length}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditProduct(product)}
                        className="flex-1 border-white/20 bg-black hover:bg-white hover:text-black text-white transition-colors"
                      >
                        <Pencil className="h-4 w-4 mr-1" /> Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteConfirm(product.id)}
                        className="flex-1 border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-white/20">
                <TableHead className="text-white/60">Images</TableHead>
                <TableHead className="text-white/60">Name</TableHead>
                <TableHead className="text-white/60">Description</TableHead>
                <TableHead className="text-white/60">Base Price</TableHead>
                <TableHead className="text-white/60">Application</TableHead>
                <TableHead className="text-white/60">Garment</TableHead>
                <TableHead className="text-white/60">Variants</TableHead>
                <TableHead className="text-white/60">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id} className="border-white/20">
                  <TableCell>
                    <div className="flex gap-2">
                      {product.front_image_url && (
                        <div className="relative w-16 h-16">
                          <Image
                            src={product.front_image_url}
                            alt={`${product.name} front`}
                            fill
                            className="object-contain rounded-sm"
                          />
                        </div>
                      )}
                      {product.back_image_url && (
                        <div className="relative w-16 h-16">
                          <Image
                            src={product.back_image_url}
                            alt={`${product.name} back`}
                            fill
                            className="object-contain rounded-sm"
                          />
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-white">{product.name}</TableCell>
                  <TableCell className="max-w-xs truncate text-white/80">
                    {product.description ? (
                      <Link 
                        href={`/StayFamous/${encodeURIComponent(product.description)}`}
                        className="hover:text-white hover:underline transition-colors"
                      >
                        {product.description}
                      </Link>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-white">${product.base_price.toFixed(2)}</TableCell>
                  <TableCell className="text-white/80">{product.application}</TableCell>
                  <TableCell className="text-white/80">{product.garment}</TableCell>
                  <TableCell className="text-white/80">
                    {variants.filter(v => v.product_id === product.id).length}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditProduct(product)}
                        className="border-white/20 bg-black hover:bg-white hover:text-black text-white transition-colors"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteConfirm(product.id)}
                        className="border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add/Edit Product Modal */}
      {showAddProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-black rounded-lg border border-white/20 shadow-lg p-6 w-full max-w-4xl relative max-h-[90vh] overflow-y-auto">
            <button
              className="absolute top-2 right-2 text-white/60 hover:text-white text-xl transition-colors"
              onClick={() => {
                if (editingProduct) {
                  const confirmLeave = window.confirm("Are you sure you want to discard your changes?");
                  if (confirmLeave) {
                    resetForm();
                  }
                } else {
                  resetForm();
                }
              }}
            >
              &times;
            </button>
            <h3 
              className="text-lg font-semibold mb-4 text-white"
              style={{ fontFamily: 'Chalkduster, fantasy' }}
            >
              {editingProduct ? "Edit Product" : "Add New Product"}
            </h3>
            <form onSubmit={handleProductSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column - Basic Info */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-1">Name *</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="mt-1 block w-full rounded-md bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-white/40"
                      placeholder="Product Name"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-1">Description</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="mt-1 block w-full rounded-md bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-white/40"
                      rows={3}
                      placeholder="Description"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-1">Base Price *</label>
                    <div className="relative mt-1 rounded-md shadow-sm">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <span className="text-white/60 sm:text-sm">$</span>
                      </div>
                      <input
                        type="number"
                        value={basePrice}
                        onChange={(e) => setBasePrice(e.target.value)}
                        className="block w-full rounded-md bg-white/10 border-white/20 text-white pl-7 pr-12 focus:border-white/40"
                        placeholder="0.00"
                        step="0.01"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-1">Application *</label>
                    <input
                      type="text"
                      value={application}
                      onChange={(e) => setApplication(e.target.value)}
                      className="mt-1 block w-full rounded-md bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-white/40"
                      placeholder="Application"
                      required
                      disabled
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-1">Garment *</label>
                    <input
                      type="text"
                      value={garment}
                      onChange={(e) => setGarment(e.target.value)}
                      className="mt-1 block w-full rounded-md bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-white/40"
                      placeholder="Garment"
                      required
                      disabled
                    />
                  </div>
                </div>
                
                {/* Right Column - Images and Variants */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-1">Front Image</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files && setFrontImage(e.target.files[0])}
                      className="mt-1 block w-full text-white/80
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-md file:border-0
                        file:text-sm file:font-semibold
                        file:bg-white/10 file:text-white
                        file:hover:bg-white/20 file:transition-colors"
                    />
                    {(editingProduct?.front_image_url || frontImage) && (
                      <div className="mt-2 relative w-32 h-32">
                        <Image 
                          src={frontImage ? URL.createObjectURL(frontImage) : editingProduct?.front_image_url || ""}
                          alt="Front preview"
                          fill
                          className="object-contain rounded-md"
                        />
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-1">Back Image</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files && setBackImage(e.target.files[0])}
                      className="mt-1 block w-full text-white/80
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-md file:border-0
                        file:text-sm file:font-semibold
                        file:bg-white/10 file:text-white
                        file:hover:bg-white/20 file:transition-colors"
                    />
                    {(editingProduct?.back_image_url || backImage) && (
                      <div className="mt-2 relative w-32 h-32">
                        <Image 
                          src={backImage ? URL.createObjectURL(backImage) : editingProduct?.back_image_url || ""}
                          alt="Back preview"
                          fill
                          className="object-contain rounded-md"
                        />
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">Sizes</label>
                    <div className="grid grid-cols-3 gap-2">
                      {sizes.map((size) => (
                        <div key={size} className="text-sm text-white/80 p-2 bg-white/10 border border-white/20 rounded">
                          {size}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">Colors</label>
                    <div className="grid grid-cols-3 gap-2">
                      {colors.map((color) => (
                        <div key={color} className="text-sm text-white/80 p-2 bg-white/10 border border-white/20 rounded">
                          {color}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-2 pt-4 border-t border-white/20">
                <button
                  type="button"
                  onClick={() => {
                    if (editingProduct) {
                      const confirmLeave = window.confirm("Are you sure you want to discard your changes?");
                      if (confirmLeave) {
                        resetForm();
                      }
                    } else {
                      resetForm();
                    }
                  }}
                  className="px-4 py-2 border border-white/20 rounded-md shadow-sm text-sm font-medium text-white hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-white text-black rounded-md shadow-sm text-sm font-medium hover:bg-white/90 transition-colors"
                  style={{ fontFamily: 'Chalkduster, fantasy' }}
                >
                  {editingProduct ? "Update Product" : "Add Product"}
                </button>
              </div>
              
              {addError && (
                <div className="text-red-400 bg-red-500/10 border border-red-500/20 p-2 rounded text-sm mt-2">
                  {addError}
                </div>
              )}
              {addSuccess && (
                <div className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-2 rounded text-sm mt-2">
                  {addSuccess}
                </div>
              )}
            </form>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && handleDeleteProduct(deleteConfirm)}
      />
    </div>
  );
};

export default ProductManagement;
