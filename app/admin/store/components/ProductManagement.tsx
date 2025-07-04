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
import { ChevronRight, ChevronDown, Pencil, Eye, Tag, Box, Download } from 'lucide-react';
import DeleteConfirmationModal from "./DeleteConfirmationModal";
import EditProductModal from "./EditProductModal";
import Link from "next/link";
import { downloadFamousPreset } from "@/app/utils/downloadFamousPreset";

interface Product {
  id: string;
  name: string;
  description?: string | null;
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
  price: number;
  application: string;
  garment: string;
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
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
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
      setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Delete product handler
  const handleDeleteProduct = async (productId: string) => {
    if (!productId) return;
    
    try {
      setIsDeleting(true);
      setError(null);
      
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) {
        throw error;
      }

      // Only update the UI after successful deletion
      setProducts(products.filter(product => product.id !== productId));
      
    } catch (error) {
      console.error('Error deleting product:', error);
      setError('Failed to delete product');
      throw error; // Propagate error to modal
    } finally {
      setIsDeleting(false);
    }
  };

  // Separate function to handle delete button click
  const handleDeleteClick = (productId: string) => {
    setDeleteConfirm(productId); // This only opens the confirmation modal
  };

  const handleEditProduct = (product: Product) => {
    console.log("Starting product edit for:", {
      productId: product.id,
      currentData: product
    });
    setEditingProduct(product);
    setShowAddProduct(true);
  };

  const handleProductUpdate = (updatedProduct: Product) => {
    // Update the products list without fetching from the server
    setProducts(prevProducts => 
      prevProducts.map(p => 
        p.id === updatedProduct.id ? {
          ...p,
          ...updatedProduct,
          // Ensure description is properly handled
          description: updatedProduct.description ?? undefined
        } : p
      )
    );
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
    <div className="bg-black/50 backdrop-blur-sm rounded-lg border border-white/20 p-6 relative">
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
                        onClick={() => product.description && downloadFamousPreset(product.description).catch(console.error)}
                        className="flex-1 border-white/20 bg-black hover:bg-white hover:text-black text-white transition-colors"
                        disabled={!product.description}
                      >
                        <Download className="h-4 w-4 mr-1" /> Famous Preset
                      </Button>
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditProduct(product)}
                        className="flex-1 border-white/20 bg-black hover:bg-white hover:text-black text-white transition-colors"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteClick(product.id)}
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
        <div className="relative">
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
                          onClick={() => product.description && downloadFamousPreset(product.description).catch(console.error)}
                          className="border-white/20 bg-black hover:bg-white hover:text-black text-white transition-colors"
                          disabled={!product.description}
                        >
                          <Download className="h-4 w-4 mr-1" />
                        </Button>
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
                          onClick={() => handleDeleteClick(product.id)}
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
          
          {/* Add/Edit Product Modal */}
          <EditProductModal
            isOpen={showAddProduct}
            onClose={() => {
              setShowAddProduct(false);
              setEditingProduct(null);
            }}
            editingProduct={editingProduct}
            onProductUpdate={handleProductUpdate}
          />
          
          {/* Delete Confirmation Modal */}
          <DeleteConfirmationModal
            isOpen={!!deleteConfirm}
            onClose={() => {
              if (!isDeleting) {
                setDeleteConfirm(null);
              }
            }}
            onConfirm={async () => {
              if (deleteConfirm) {
                await handleDeleteProduct(deleteConfirm);
              }
            }}
            isDeleting={isDeleting}
          />

          {error && (
            <div className="mt-4 p-2 bg-red-500/10 border border-red-500/20 rounded text-red-400">
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductManagement;
