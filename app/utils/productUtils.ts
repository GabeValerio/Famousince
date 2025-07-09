import { supabase } from "@/lib/supabaseClient";
import { StayFamousText } from "@/app/components/StayFamousPreset";
import { generateAndUploadImage } from "./imageUtils";

export interface CreateProductParams {
  description: string;
  textPreset: StayFamousText;
  imageUrl?: string;
  modelId: string;
  imageContainerRef?: HTMLDivElement;
}

export interface ProductCreationResult {
  success: boolean;
  imageUrl?: string;
  productData?: any;
  error?: Error;
}

export function getProductDisplayImage(product: any, variant?: any): string {
  // For custom products, use the front_image_url directly
  if (product.front_image_url) {
    return product.front_image_url;
  }
  
  // For regular products with variants, use the variant image if available
  if (variant?.image_url) {
    return variant.image_url;
  }
  
  // Fallback to product back image or placeholder
  return product?.back_image_url || '/placeholder.png';
}

export async function checkExistingProduct(description: string) {
  try {
    // Sanitize the description before querying
    const sanitizedDescription = description.trim().replace(/[^\w\s]/g, '');
    
    if (!sanitizedDescription) {
      return undefined;
    }

    const { data: products, error } = await supabase
      .from("products")
      .select("*")
      .eq("description", sanitizedDescription)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return products || undefined;
  } catch (error) {
    console.error("Error checking existing product:", error);
    return undefined;
  }
}

export async function createProductWithImage({
  description,
  textPreset,
  imageUrl,
  modelId,
  imageContainerRef,
}: CreateProductParams): Promise<ProductCreationResult> {
  try {
    // Check for duplicate description first
    const existingProduct = await checkExistingProduct(description);
    if (existingProduct) {
      throw new Error('A product with this description already exists. Please use a unique description.');
    }

    // Get the product type details
    const { data: productType, error: productTypeError } = await supabase
      .from('product_types')
      .select('base_price, stripe_account_id, name')
      .eq('id', modelId)
      .single();

    if (productTypeError) {
      throw new Error('Failed to fetch product type details');
    }

    // Generate and upload the image if not provided
    let finalImageUrl = imageUrl;
    if (!finalImageUrl && imageContainerRef) {
      finalImageUrl = await generateAndUploadImage(
        imageContainerRef,
        textPreset,
        modelId
      );
    }

    if (!finalImageUrl) {
      throw new Error('Failed to generate and upload image');
    }

    // Create the product using the product type's price and stripe account
    const { data: productData, error: productError } = await supabase
      .from("products")
      .insert({
        name: `Famous Since ${productType.name}`,
        description: description.trim(),
        base_price: productType.base_price,
        stripe_account_id: productType.stripe_account_id,
        front_image_url: finalImageUrl,
        application: "Screen Press",
        product_type_id: modelId
      })
      .select()
      .single();

    if (productError) {
      // Handle unique constraint violation
      if (productError.code === '23505' && productError.message.includes('unique_product_description')) {
        throw new Error('A product with this description already exists. Please use a unique description.');
      }
      throw productError;
    }

    // Create variants with the same price as base_price
    const { data: sizes, error: sizesError } = await supabase
      .from('product_sizes')
      .select('size')
      .eq('product_type_id', modelId)
      .order('size_order', { ascending: true });

    if (sizesError) throw sizesError;

    const variantsToInsert = (sizes || []).map(({ size }) => ({
      product_id: productData.id,
      size,
      color: "Black",
      price: productType.base_price,
      stock_quantity: 100 // Setting a default stock quantity
    }));

    if (variantsToInsert.length > 0) {
      const { error: variantsError } = await supabase
        .from("product_variants")
        .insert(variantsToInsert);

      if (variantsError) throw variantsError;
    }

    return {
      success: true,
      imageUrl: finalImageUrl,
      productData
    };
  } catch (error) {
    console.error("Error in createProductWithImage:", error);
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Unknown error occurred')
    };
  }
} 