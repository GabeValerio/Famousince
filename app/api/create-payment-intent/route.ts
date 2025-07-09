//create-payment-intent/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { supabase } from "@/lib/supabaseClient";
import convertToSubcurrency from "@/lib/convertToSubcurrency";

// Check if STRIPE_SECRET_KEY is defined
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  throw new Error("STRIPE_SECRET_KEY is not defined in the environment variables");
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2023-10-16" as Stripe.LatestApiVersion,
});

// Define your platform fee percentage
const PLATFORM_FEE_PERCENT = 2;

interface CartItem {
  id: string; // variant_id
  product_id: string;
  quantity: number;
  price: number;
  name: string;
  description: string;
  size: string;
  color: string;
}

interface SupabaseVariant {
  id: string;
  price: number;
  stock_quantity: number;
  products: {
    id: string;
    name: string;
    description: string;
    stripe_account_id: string | null;
  };
}

export async function POST(request: NextRequest) {
  try {
    const requestData = await request.json();
    const { items } = requestData;
    let requestAmount = requestData.amount;

    if (!items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: "Invalid request body - items array is required" },
        { status: 400 }
      );
    }

    if (!requestAmount) {
      const calculatedAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      if (calculatedAmount <= 0) {
        return NextResponse.json(
          { error: "Invalid request body - amount is required" },
          { status: 400 }
        );
      }
      requestAmount = calculatedAmount;
    }

    // Verify items against database and collect Stripe account IDs
    const verifiedItems: CartItem[] = [];
    let connectedAccountId: string | null = null;

    for (const item of items) {
      const { data: variant, error } = await supabase
        .from("product_variants")
        .select(`
          id,
          price,
          stock_quantity,
          products!inner (
            id,
            name,
            description,
            stripe_account_id
          )
        `)
        .eq("id", item.id)
        .single();

      if (error || !variant) {
        return NextResponse.json(
          { error: "Invalid product variant" },
          { status: 400 }
        );
      }

      const typedVariant = variant as unknown as SupabaseVariant;

      if (typedVariant.stock_quantity < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for ${typedVariant.products.name}` },
          { status: 400 }
        );
      }

      // Store the Stripe account ID if found
      if (typedVariant.products.stripe_account_id) {
        if (connectedAccountId && connectedAccountId !== typedVariant.products.stripe_account_id) {
          return NextResponse.json(
            { error: "Cannot process items from different Stripe accounts in one transaction" },
            { status: 400 }
          );
        }
        connectedAccountId = typedVariant.products.stripe_account_id;
      }

      verifiedItems.push({
        id: typedVariant.id,
        product_id: typedVariant.products.id,
        quantity: item.quantity,
        price: typedVariant.price,
        name: typedVariant.products.name,
        description: typedVariant.products.description,
        size: item.size,
        color: item.color
      });
    }

    // Convert the amount to cents
    const amountInCents = convertToSubcurrency(requestAmount);
    
    // Create payment intent with improved metadata
    const paymentIntentOptions: Stripe.PaymentIntentCreateParams = {
      amount: amountInCents,
      currency: "usd",
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        order_items: JSON.stringify(verifiedItems.map(item => ({
          product_id: item.product_id,
          variant_id: item.id,
          name: item.name,
          description: item.description,
          quantity: item.quantity,
          size: item.size,
          color: item.color,
          unit_price: item.price
        }))),
        total_items: verifiedItems.reduce((sum, item) => sum + item.quantity, 0).toString(),
        order_description: verifiedItems.map(item => 
          `${item.quantity}x ${item.name} (${item.size}, ${item.color}) - ${item.description}`
        ).join(' | ')
      },
    };

    // Add platform fee and transfer data for connected accounts
    const platformFeeAmount = Math.round((amountInCents * PLATFORM_FEE_PERCENT) / 100);
    
    if (connectedAccountId) {
      paymentIntentOptions.transfer_data = {
        destination: connectedAccountId,
      };
      paymentIntentOptions.application_fee_amount = platformFeeAmount;
    }

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentOptions);
    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}


