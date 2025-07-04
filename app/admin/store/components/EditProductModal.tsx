import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";

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

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingProduct: Product | null;
  onProductUpdate: (product: Product) => void;
}

const EditProductModal: React.FC<EditProductModalProps> = ({
  isOpen,
  onClose,
  editingProduct,
  onProductUpdate,
}) => {
  const [name, setName] = useState(editingProduct?.name || "");
  const [description, setDescription] = useState((editingProduct?.description || "").toUpperCase());
  const [frontImage, setFrontImage] = useState<File | null>(null);
  const [backImage, setBackImage] = useState<File | null>(null);
  const [basePrice, setBasePrice] = useState<string>(editingProduct?.base_price?.toString() || "");
  const [application, setApplication] = useState(editingProduct?.application || "Screen Press");
  const [garment, setGarment] = useState(editingProduct?.garment || "T-Shirt");
  const [sizes, setSizes] = useState<string[]>(["S", "M", "L", "XL", "2XL"]);
  const [colors, setColors] = useState<string[]>(["Black"]);
  const [addError, setAddError] = useState("");
  const [addSuccess, setAddSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Add state for modal position
  const [modalPosition, setModalPosition] = useState({ top: 0 });

  // Add useEffect to update form state when editingProduct changes
  useEffect(() => {
    if (editingProduct) {
      setName(editingProduct.name || "");
      setDescription((editingProduct.description || "").toUpperCase());
      setBasePrice(editingProduct.base_price?.toString() || "");
      setApplication(editingProduct.application || "Screen Press");
      setGarment(editingProduct.garment || "T-Shirt");
      // Reset images since we can't populate File objects
      setFrontImage(null);
      setBackImage(null);
    }
  }, [editingProduct]);

  // Update modal position when opened
  useEffect(() => {
    if (isOpen) {
      // Get current scroll position and add a small offset (e.g., 20px)
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const topPosition = Math.max(scrollTop + 20, 20); // Ensure minimum 20px from top
      setModalPosition({ top: topPosition });
    }
  }, [isOpen]);

  // Handle image upload with error handling and progress
  const handleImageUpload = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const data = await response.json();
      return data.secure_url;
    } catch (error) {
      setAddError('Failed to upload image');
      return null;
    }
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
    setAddError("");
    setAddSuccess("");
    setIsSubmitting(false);
    onClose();
  };

  const checkDuplicateDescription = async (description: string) => {
    if (!description.trim()) return false;
    
    try {
      const { data, error } = await supabase
        .from("products")
        .select("id")
        .eq("description", description.trim())
        .neq("id", editingProduct?.id || '') // Exclude current product when editing
        .maybeSingle();

      if (error) throw error;
      return !!data; // Returns true if a duplicate exists
    } catch (error) {
      console.error("Error checking duplicate description:", error);
      return false;
    }
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent multiple submissions
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      console.log("=== Starting form submission ===");
      console.log("Form values:", {
        name,
        description,
        basePrice,
        application,
        garment,
        isEditing: !!editingProduct
      });

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

      // Check for exceptions in description
      if (description.trim()) {
        const words = description.trim().split(/\s+/).map(word => word.toUpperCase());
        
        const { data: exceptions, error: exceptionsError } = await supabase
          .from('exceptions')
          .select('word')
          .in('word', words);

        if (exceptionsError) {
          throw exceptionsError;
        }

        if (exceptions && exceptions.length > 0) {
          setAddError(
            "While we appreciate your desire to Stay Famous for this, we aim to keep our product descriptions positive and uplifting. " +
            "Please consider revising the description to better align with our community values."
          );
          return;
        }
      }

      // Check for duplicate description
      if (description.trim()) {
        const hasDuplicate = await checkDuplicateDescription(description);
        if (hasDuplicate) {
          setAddError("A product with this description already exists. Please use a unique description.");
          return;
        }
      }

      // Upload images if provided
      let frontImageUrl = editingProduct?.front_image_url;
      let backImageUrl = editingProduct?.back_image_url;

      if (frontImage) {
        frontImageUrl = await handleImageUpload(frontImage);
      }
      if (backImage) {
        backImageUrl = await handleImageUpload(backImage);
      }

      if (editingProduct) {
        // Update existing product
        console.log("=== Updating existing product ===");
        console.log("Current product data:", editingProduct);
        
        const updateData: Partial<Product> = {
          name: name.trim(),
          description: description.trim() || null,
          base_price: parseFloat(basePrice),
          application: application.trim(),
          garment: garment.trim(),
          front_image_url: frontImageUrl,
          back_image_url: backImageUrl,
        };
        
        console.log("Sending update:", updateData);

        const { data: updatedProduct, error: updateError } = await supabase
          .from("products")
          .update(updateData)
          .eq("id", editingProduct.id)
          .select()
          .single();

        if (updateError) {
          console.error("Update error:", updateError);
          throw updateError;
        }

        console.log("Product updated:", updatedProduct);

        // Update variants
        const { error: variantsError } = await supabase
          .from("product_variants")
          .update({ 
            price: parseFloat(basePrice),
            application: application.trim(),
            garment: garment.trim(),
            front_image_url: frontImageUrl,
            back_image_url: backImageUrl
          })
          .eq("product_id", editingProduct.id);

        if (variantsError) {
          console.error("Variants update error:", variantsError);
          throw variantsError;
        }

        setAddSuccess("Product updated successfully!");
        // Ensure we pass the complete product data
        onProductUpdate({
          ...editingProduct,
          ...updatedProduct,
          // Ensure description is properly handled
          description: updatedProduct.description ?? undefined
        });
        resetForm();
        onClose();
      } else {
        // Insert new product
        console.log("=== Inserting new product ===");
        const productData = {
          name: name.trim(),
          description: description.trim() || null,
          front_image_url: frontImageUrl,
          back_image_url: backImageUrl,
          base_price: parseFloat(basePrice),
          application: application.trim(),
          garment: garment.trim(),
        };

        console.log("New product data:", productData);

        const { data: newProduct, error: insertError } = await supabase
          .from("products")
          .insert(productData)
          .select()
          .single();

        console.log("Insert response:", { newProduct, error: insertError });

        if (insertError) throw insertError;

        // Create variants for new product
        const variantsToInsert = sizes
          .filter(size => size.trim())
          .flatMap(size =>
            colors
              .filter(color => color.trim())
              .map(color => ({
                product_id: newProduct.id,
                size,
                color,
                application: application.trim(),
                garment: garment.trim(),
                price: parseFloat(basePrice),
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

        console.log("Insert successful!");
        setAddSuccess("Product added successfully!");
        onProductUpdate(newProduct);
        resetForm();
      }
    } catch (error: any) {
      console.error("=== Error in form submission ===");
      console.error("Error details:", error);
      
      // Handle unique constraint violation
      if (error.code === '23505' && error.message.includes('unique_product_description')) {
        setAddError("A product with this description already exists. Please use a unique description.");
      } else {
        setAddError(error.message || "Failed to process product");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Semi-transparent backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal container with max width for different screen sizes */}
      <div className="relative w-full max-w-[95%] md:max-w-[85%] lg:max-w-4xl mx-auto bg-black rounded-lg border border-white/20 shadow-lg overflow-hidden">
        {/* Close button */}
        <button
          className="absolute top-2 right-2 text-white/60 hover:text-white text-xl transition-colors z-10"
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
        <div className="max-h-[80vh] overflow-y-auto p-6">
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

export default EditProductModal; 