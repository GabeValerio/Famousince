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
import { EditProductModal } from "./EditProductModal";
import Link from "next/link";
import { downloadFamousPreset } from "@/app/utils/downloadFamousPreset";
import { ProductType } from '@/types/products';

interface Product {
  id: string;
  name: string;
  description: string | null;
  base_price: number;
  front_image_url?: string;
  back_image_url?: string;
  application: string;
  product_type_id: string;
  created_at: string;
  updated_at: string;
  product_types?: {
    id: string;
    name: string;
  };
}

interface ProductVariant {
  id: string;
  product_id: string;
  size: string;
  color: string;
  price: number;
  stock_quantity: number;
  front_image_url?: string;
  back_image_url?: string;
}

interface ProductWithType extends Omit<Product, 'product_types'> {
  product_types: {
    id: string;
    name: string;
  };
  variants: ProductVariant[];
}

const ProductManagement: React.FC = () => {
  const { data: session } = useSession();
  const [products, setProducts] = useState<ProductWithType[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isMobileView, setIsMobileView] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [loadingProductTypes, setLoadingProductTypes] = useState(true);

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

  const fetchProductTypes = async () => {
    setLoadingProductTypes(true);
    try {
      const { data, error } = await supabase
        .from("product_types")
        .select("*");

      if (error) throw error;
      setProductTypes(data || []);
    } catch (error) {
      console.error("Error fetching product types:", error);
      setError("Failed to load product types");
    } finally {
      setLoadingProductTypes(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          variants:product_variants(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
      setLoading(false);
    } catch (error) {
      setError('Failed to fetch products');
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.all([fetchProducts(), fetchProductTypes()]);
  }, []);

  // Get product type name
  const getProductTypeName = (productTypeId: string) => {
    const productType = productTypes.find(type => type.id === productTypeId);
    return productType?.name || 'Loading...';
  };

  // Get product type info
  const getProductType = (productTypeId: string) => {
    return productTypes.find(type => type.id === productTypeId);
  };

  // Get appropriate link for product
  const getProductLink = (product: ProductWithType) => {
    const productType = getProductType(product.product_type_id);
    
    if (!productType) return '#';
    
    if (productType.is_branded_item) {
      // For branded items, link to branded shop
      const productTypeSlug = productType.name.toLowerCase().replace(/\s+/g, '-');
      return `/shop/branded/${productTypeSlug}`;
    } else {
      // For custom products, link to StayFamous page
      return product.description ? `/StayFamous/${encodeURIComponent(product.description)}` : '#';
    }
  };

  const handleDeleteProduct = async () => {
    if (!deleteConfirm) return;
    setIsDeleting(true);

    try {
      // Delete all variants first
      const { error: variantError } = await supabase
        .from("product_variants")
        .delete()
        .eq("product_id", deleteConfirm);

      if (variantError) throw variantError;

      // Then delete the product
      const { error: productError } = await supabase
        .from("products")
        .delete()
        .eq("id", deleteConfirm);

      if (productError) throw productError;

      setDeleteConfirm(null);
      setIsDeleting(false);
      fetchProducts();
      setSuccess("Product deleted successfully!");
      setTimeout(() => setSuccess(null), 2000);
    } catch (error) {
      console.error("Error deleting product:", error);
      setError("Failed to delete product");
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

  const handleProductUpdate = () => {
    // Show success message
    setSuccess(editingProduct ? "Product updated successfully!" : "Product added successfully!");
    // Clear success message after 2 seconds
    setTimeout(() => setSuccess(null), 2000);
    // Refresh products from server
    fetchProducts();
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
                  <h3 className="font-medium text-white truncate">
                    <Link 
                      href={getProductLink(product)}
                      className="hover:text-white hover:underline transition-colors"
                    >
                      {product.name}
                    </Link>
                  </h3>
                  <p className="text-xs text-white/60 mt-1 flex items-center">
                    <Tag className="h-3 w-3 mr-1" /> ${product.base_price.toFixed(2)}
                  </p>
                  <p className="text-xs text-white/60 capitalize truncate">
                    {getProductTypeName(product.product_type_id)}
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
                        <p className="text-sm text-white/80">{product.description}</p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-medium text-white/60 uppercase mb-1">Application</p>
                        <p className="text-sm text-white/80">{product.application}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-white/60 uppercase mb-1">Type</p>
                        <p className="text-sm text-white/80">{getProductTypeName(product.product_type_id)}</p>
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

                    {/* Variant information */}
                    <div className="mt-2 space-y-2">
                      {product.variants && product.variants.length > 0 ? (
                        product.variants.map((variant) => (
                          <div key={variant.id} className="flex items-center justify-between text-sm text-white/60">
                            <span>
                              {variant.size} - {variant.color}
                            </span>
                            <div className="flex items-center space-x-4">
                              <span>${variant.price.toFixed(2)}</span>
                              <span>Stock: {variant.stock_quantity}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-white/40 italic">No variants available</div>
                      )}
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
                  <TableHead className="text-white/60">Type</TableHead>
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
                    <TableCell className="font-medium text-white">
                      <Link 
                        href={getProductLink(product)}
                        className="hover:text-white hover:underline transition-colors"
                      >
                        {product.name}
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-white/80">
                      {product.description || 'No description'}
                    </TableCell>
                    <TableCell className="text-white">${product.base_price.toFixed(2)}</TableCell>
                    <TableCell className="text-white/80">{product.application}</TableCell>
                    <TableCell className="text-white/80">{getProductTypeName(product.product_type_id)}</TableCell>
                    <TableCell className="text-white/80">
                      {product.variants?.length || 0}
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
        </div>
      )}

      {showAddProduct && (
        <EditProductModal
          isOpen={showAddProduct}
          onClose={() => {
            setShowAddProduct(false);
            setEditingProduct(null);
          }}
          editingProduct={editingProduct}
          onProductUpdated={handleProductUpdate}
        />
      )}
      
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
            await handleDeleteProduct();
          }
        }}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default ProductManagement;
