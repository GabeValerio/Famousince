//create-payment-intent/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe"; // Import Stripe as a module

// Check if STRIPE_SECRET_KEY is defined
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  throw new Error("STRIPE_SECRET_KEY is not defined in the environment variables");
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2023-10-16" as Stripe.LatestApiVersion,
});

// Add this interface before the POST function
interface CartItem {
  name: string;
  quantity: number;
  size: string;
  color: string;
}

export async function POST(request: NextRequest) {
  try {
    const { amount, cart } = await request.json();

    // Ensure amount is a valid number
    if (!amount || isNaN(amount)) {
      return NextResponse.json(
        { error: 'Invalid amount provided' },
        { status: 400 }
      );
    }

    // Use the amount directly since it's already in cents
    const amountInCents = Math.round(amount);  // Just round to ensure whole number

    // Create more efficient metadata
    const metadata: Record<string, string> = {
      itemCount: cart.length.toString()
    };

    // Add cart items individually up to a reasonable limit
    cart.slice(0, 20).forEach((item: CartItem, index: number) => {
      metadata[`item_${index}`] = JSON.stringify({
        name: item.name,
        qty: item.quantity,
        size: item.size,
        color: item.color
      });
    });

    // Create the payment intent with minimal metadata
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "usd",
      automatic_payment_methods: { enabled: true },
      metadata
    });

    // Return the client secret
    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });

  } catch (error) {
    return NextResponse.json(
      { error: `Payment Intent Creation Error: ${error}` },
      { status: 500 }
    );
  }
}
