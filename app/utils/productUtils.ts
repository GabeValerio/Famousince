import { supabase } from "@/lib/supabaseClient";
import { StayFamousText } from "@/app/components/StayFamousPreset";
import { generateAndUploadImage } from "./imageUtils";

export interface CreateProductParams {
  description: string;
  textPreset: StayFamousText;
  imageContainerRef: HTMLDivElement;
  modelId: string;
}

export interface ProductCreationResult {
  success: boolean;
  imageUrl?: string;
  productData?: any;
  error?: Error;
}

export async function checkExistingProduct(description: string) {
  try {
    const { data: products, error } = await supabase
      .from("products")
      .select("*")
      .eq("description", description.trim())
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return products;
  } catch (error) {
    console.error("Error checking existing product:", error);
    return null;
  }
}

export async function createProductWithImage({
  description,
  textPreset,
  imageContainerRef,
  modelId,
}: CreateProductParams): Promise<ProductCreationResult> {
  try {
    // Check for duplicate description first
    const existingProduct = await checkExistingProduct(description);
    if (existingProduct) {
      throw new Error('A product with this description already exists. Please use a unique description.');
    }

    // First generate and upload the image
    const imageUrl = await generateAndUploadImage(
      imageContainerRef,
      textPreset,
      modelId
    );

    if (!imageUrl) {
      throw new Error('Failed to generate and upload image');
    }

    // Create the product
    const { data: productData, error: productError } = await supabase
      .from("products")
      .insert({
        name: "Famous Since T-Shirt",
        description: description.trim(),
        base_price: 28.00,
        application: "Screen Press",
        garment: "T-Shirt",
        front_image_url: imageUrl,
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

    // Create variants
    const sizes = ["S", "M", "L", "XL", "2XL"];
    const variantsToInsert = sizes.map(size => ({
      product_id: productData.id,
      size,
      color: "Black",
      application: "Screen Press",
      garment: "T-Shirt",
      price: 28.00,
      front_image_url: imageUrl,
    }));

    const { error: variantsError } = await supabase
      .from("product_variants")
      .insert(variantsToInsert);

    if (variantsError) throw variantsError;

    return {
      success: true,
      imageUrl,
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