import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { ProductType, Product as BaseProduct } from '@/types/products';
import { Input } from "@/components/ui/input";

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

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingProduct: Product | null;
  onProductUpdated: () => void;
}

// Default sizes and colors that can be customized
const DEFAULT_SIZES = ["S", "M", "L", "XL", "2XL"];
const DEFAULT_COLORS = ["Black", "White"];

interface VariantStock {
  size: string;
  color: string;
  quantity: number;
}

export const EditProductModal = ({
  isOpen,
  onClose,
  editingProduct,
  onProductUpdated,
}: EditProductModalProps) => {
  const [name, setName] = useState(editingProduct?.name || "");
  const [description, setDescription] = useState(editingProduct?.description || "");
  const [basePrice, setBasePrice] = useState(editingProduct?.base_price?.toString() || "");
  const [application, setApplication] = useState(editingProduct?.application || "");
  const [frontImage, setFrontImage] = useState<File | null>(null);
  const [backImage, setBackImage] = useState<File | null>(null);
  const [productTypeId, setProductTypeId] = useState(editingProduct?.product_type_id || "");
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addError, setAddError] = useState("");
  const [addSuccess, setAddSuccess] = useState("");
  
  // New state for managing sizes and colors
  const [availableSizes, setAvailableSizes] = useState<string[]>(DEFAULT_SIZES);
  const [availableColors, setAvailableColors] = useState<string[]>(DEFAULT_COLORS);
  const [newSize, setNewSize] = useState("");
  const [newColor, setNewColor] = useState("");

  // Add state for variant stock quantities
  const [variantStocks, setVariantStocks] = useState<Record<string, number>>({});

  useEffect(() => {
    if (editingProduct) {
      setName(editingProduct.name || "");
      setDescription(editingProduct.description || "");
      setBasePrice(editingProduct.base_price?.toString() || "");
      setApplication(editingProduct.application || "Screen Press");
      setFrontImage(null);
      setBackImage(null);
      setProductTypeId(editingProduct.product_type_id || '');
      
      // Fetch existing variants to populate sizes, colors, and stock quantities
      fetchExistingVariants(editingProduct.id);
    }
  }, [editingProduct]);

  useEffect(() => {
    if (isOpen) {
      fetchProductTypes();
    }
  }, [isOpen]);

  const fetchExistingVariants = async (productId: string) => {
    try {
      const { data: variants, error } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', productId);

      if (error) throw error;

      if (variants && variants.length > 0) {
        // Extract unique sizes and colors
        const sizes = [...new Set(variants.map(v => v.size))];
        const colors = [...new Set(variants.map(v => v.color))];
        
        // Create stock quantity map
        const stockMap: Record<string, number> = {};
        variants.forEach(v => {
          stockMap[`${v.size}-${v.color}`] = v.stock_quantity;
        });
        
        setAvailableSizes(sizes);
        setAvailableColors(colors);
        setVariantStocks(stockMap);
      }
    } catch (error) {
      console.error('Error fetching variants:', error);
    }
  };

  const fetchProductTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('product_types')
        .select('*')
        .order('name');

      if (error) throw error;
      setProductTypes(data);
    } catch (error) {
      console.error('Error fetching product types:', error);
    }
  };

  const handleAddSize = () => {
    if (newSize && !availableSizes.includes(newSize)) {
      setAvailableSizes([...availableSizes, newSize]);
      setNewSize("");
    }
  };

  const handleAddColor = () => {
    if (newColor && !availableColors.includes(newColor)) {
      setAvailableColors([...availableColors, newColor]);
      setNewColor("");
    }
  };

  const handleRemoveSize = (size: string) => {
    setAvailableSizes(availableSizes.filter(s => s !== size));
  };

  const handleRemoveColor = (color: string) => {
    setAvailableColors(availableColors.filter(c => c !== color));
  };

  const handleStockChange = (size: string, color: string, quantity: string) => {
    const key = `${size}-${color}`;
    const newQuantity = parseInt(quantity) || 0;
    setVariantStocks({
      ...variantStocks,
      [key]: newQuantity
    });
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setBasePrice("");
    setApplication("Screen Press");
    setFrontImage(null);
    setBackImage(null);
    setAddError("");
    setAddSuccess("");
    setIsSubmitting(false);
    setProductTypeId('');
    setAvailableSizes(DEFAULT_SIZES);
    setAvailableColors(DEFAULT_COLORS);
    setVariantStocks({});
    onClose();
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError("");
    setAddSuccess("");
    setIsSubmitting(true);

    try {
      let frontImageUrl = editingProduct?.front_image_url;
      let backImageUrl = editingProduct?.back_image_url;

      // Handle front image upload
      if (frontImage) {
        const frontImageName = `${Date.now()}_${frontImage.name}`;
        const { error: frontUploadError } = await supabase.storage
          .from("products")
          .upload(frontImageName, frontImage);

        if (frontUploadError) throw frontUploadError;

        const { data: frontUrlData } = supabase.storage
          .from("products")
          .getPublicUrl(frontImageName);
        frontImageUrl = frontUrlData.publicUrl;
      }

      // Handle back image upload
      if (backImage) {
        const backImageName = `${Date.now()}_${backImage.name}`;
        const { error: backUploadError } = await supabase.storage
          .from("products")
          .upload(backImageName, backImage);

        if (backUploadError) throw backUploadError;

        const { data: backUrlData } = supabase.storage
          .from("products")
          .getPublicUrl(backImageName);
        backImageUrl = backUrlData.publicUrl;
      }

      // Create or update product
      const productData = {
        name,
        description,
        base_price: parseFloat(basePrice),
        application,
        front_image_url: frontImageUrl,
        back_image_url: backImageUrl,
        product_type_id: productTypeId,
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
        // Create new product
        const { data: newProduct, error: createError } = await supabase
          .from("products")
          .insert([productData])
          .select()
          .single();

        if (createError) throw createError;
        productId = newProduct.id;
      }

      // Create variants for each size and color
      if (productId) {
        // First, get existing variants to avoid duplicates
        const { data: existingVariants } = await supabase
          .from('product_variants')
          .select('*')
          .eq('product_id', productId);

        // Create a map of existing variants for quick lookup
        const existingVariantMap = new Map(
          existingVariants?.map(v => [`${v.size}-${v.color}`, v]) || []
        );

        // Create or update variants for each size and color
        for (const size of availableSizes) {
          for (const color of availableColors) {
            const variantKey = `${size}-${color}`;
            const existingVariant = existingVariantMap.get(variantKey);

            const variantData = {
              product_id: productId,
              size,
              color,
              price: parseFloat(basePrice), // Using base price for all variants
              stock_quantity: variantStocks[variantKey] || 0, // Use the stock quantity from state
              front_image_url: frontImageUrl,
              back_image_url: backImageUrl,
            };

            if (existingVariant) {
              // Update existing variant
              await supabase
                .from('product_variants')
                .update(variantData)
                .eq('id', existingVariant.id);
            } else {
              // Create new variant
              await supabase
                .from('product_variants')
                .insert([variantData]);
            }
          }
        }

        // Delete variants that no longer exist
        const currentVariantKeys = availableSizes.flatMap(size => 
          availableColors.map(color => `${size}-${color}`)
        );
        const currentVariantKeysSet = new Set(currentVariantKeys);

        for (const variant of existingVariants || []) {
          const variantKey = `${variant.size}-${variant.color}`;
          if (!currentVariantKeysSet.has(variantKey)) {
            await supabase
              .from('product_variants')
              .delete()
              .eq('id', variant.id);
          }
        }
      }

      setAddSuccess("Product saved successfully!");
      onProductUpdated();
      resetForm();
    } catch (error) {
      console.error("Error saving product:", error);
      setAddError("Failed to save product. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get the product type name for display
  const getProductTypeName = () => {
    const productType = productTypes.find(type => type.id === productTypeId);
    return productType?.name || '';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center" style={{ marginTop: '-75px' }}>
      {/* Semi-transparent backdrop */}
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal container with max width for different screen sizes */}
      <div className="relative w-full max-w-[95%] md:max-w-[85%] lg:max-w-4xl mx-auto bg-black rounded-lg border border-white/20 shadow-lg overflow-y-auto" style={{ maxHeight: 'calc(100vh - 80px)' }}>
        {/* Close button */}
        <button
          className="sticky top-2 right-2 float-right text-white/60 hover:text-white text-xl transition-colors z-10 px-2"
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

        {/* Modal content */}
        <div className="p-6">
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
                    disabled={isSubmitting}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value.toUpperCase())}
                    className="mt-1 block w-full rounded-md bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-white/40 uppercase"
                    rows={3}
                    placeholder="ENTER WHAT MAKES YOU FAMOUS"
                    disabled={isSubmitting}
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
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">Product Type *</label>
                  <select
                    value={productTypeId}
                    onChange={(e) => setProductTypeId(e.target.value)}
                    className="mt-1 block w-full rounded-md bg-white/10 border-white/20 text-white focus:border-white/40"
                    required
                    disabled={isSubmitting}
                  >
                    <option value="">Select a product type</option>
                    {productTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
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
                    disabled={isSubmitting}
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
                    disabled={isSubmitting}
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
                  <label className="block text-sm font-medium text-white/80 mb-2">Available Sizes</label>
                  <div className="grid grid-cols-3 gap-2">
                    {productTypeId && availableSizes.length > 0 ? (
                      availableSizes.map((size) => (
                        <div key={size} className="text-sm text-white/80 p-2 bg-white/10 border border-white/20 rounded">
                          {size}
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-white/60 col-span-3">
                        Select a product type to see available sizes
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Colors</label>
                  <div className="grid grid-cols-3 gap-2">
                    {availableColors.map((color) => (
                      <div key={color} className="text-sm text-white/80 p-2 bg-white/10 border border-white/20 rounded">
                        {color}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Size Management */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-white/80 mb-2">Manage Sizes</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {availableSizes.map((size) => (
                  <div key={size} className="flex items-center bg-white/10 rounded px-2 py-1">
                    <span className="text-sm text-white/80 mr-2">{size}</span>
                    <button
                      onClick={() => handleRemoveSize(size)}
                      className="text-red-400 hover:text-red-300"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={newSize}
                  onChange={(e) => setNewSize(e.target.value)}
                  placeholder="Add new size"
                  className="flex-1"
                />
                <Button onClick={handleAddSize} disabled={!newSize}>
                  Add Size
                </Button>
              </div>
            </div>

            {/* Color Management */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-white/80 mb-2">Manage Colors</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {availableColors.map((color) => (
                  <div key={color} className="flex items-center bg-white/10 rounded px-2 py-1">
                    <span className="text-sm text-white/80 mr-2">{color}</span>
                    <button
                      onClick={() => handleRemoveColor(color)}
                      className="text-red-400 hover:text-red-300"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  placeholder="Add new color"
                  className="flex-1"
                />
                <Button onClick={handleAddColor} disabled={!newColor}>
                  Add Color
                </Button>
              </div>
            </div>

            {/* Variant Stock Management */}
            <div className="mt-6">
              <h4 className="text-lg font-medium text-white mb-4">Variant Stock Management</h4>
              <div className="grid gap-4">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className="text-left text-white/60 px-4 py-2">Size</th>
                        <th className="text-left text-white/60 px-4 py-2">Color</th>
                        <th className="text-left text-white/60 px-4 py-2">Stock Quantity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {availableSizes.map(size => (
                        availableColors.map(color => (
                          <tr key={`${size}-${color}`} className="border-t border-white/10">
                            <td className="px-4 py-2 text-white">{size}</td>
                            <td className="px-4 py-2 text-white">{color}</td>
                            <td className="px-4 py-2">
                              <Input
                                type="number"
                                min="0"
                                value={variantStocks[`${size}-${color}`] || 0}
                                onChange={(e) => handleStockChange(size, color, e.target.value)}
                                className="w-24 bg-white/10 border-white/20 text-white"
                              />
                            </td>
                          </tr>
                        ))
                      ))}
                    </tbody>
                  </table>
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
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-white text-black rounded-md shadow-sm text-sm font-medium hover:bg-white/90 transition-colors"
                style={{ fontFamily: 'Chalkduster, fantasy' }}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : (editingProduct ? "Update Product" : "Add Product")}
              </button>
            </div>
            
            {addError && (
              <div className="mt-4 p-2 bg-red-500/10 border border-red-500/20 rounded text-red-400">
                {addError}
              </div>
            )}
            {addSuccess && (
              <div className="mt-4 p-2 bg-green-500/10 border border-green-500/20 rounded text-green-400">
                {addSuccess}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}; 