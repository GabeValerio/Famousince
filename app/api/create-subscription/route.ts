import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error("STRIPE_SECRET_KEY is not defined in the environment variables");
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2023-10-16" as Stripe.LatestApiVersion,
});

export async function POST(request: NextRequest) {
  try {
    const { priceId, customerId } = await request.json();

    console.log('Received request:', { priceId, customerId });

    if (!customerId || !priceId) {
      return NextResponse.json({ 
        error: "Customer ID and Price ID are required",
        received: { customerId, priceId }
      }, { status: 400 });
    }

    console.log('Creating subscription with:', { 
      customer: customerId,
      items: [{ price: priceId }]
    });

    const subscriptionResponse = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
    });

    const subscription = subscriptionResponse as unknown as {
      id: string;
      latest_invoice: {
        payment_intent: {
          client_secret: string;
        };
      };
    };

    console.log('Subscription created:', subscription.id);

    const clientSecret = subscription.latest_invoice.payment_intent.client_secret;

    if (!clientSecret) {
      console.error('No client secret found in subscription:', subscription);
      throw new Error("Failed to get client secret from subscription");
    }

    return NextResponse.json({
      subscriptionId: subscription.id,
      clientSecret: clientSecret,
    });
  } catch (error) {
    console.error("Subscription Creation Error:", {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      details: error
    });

    return NextResponse.json(
      { 
        error: "Internal Server Error", 
        message: error instanceof Error ? error.message : "Unknown error",
        details: error instanceof Error ? error.message : error
      },
      { status: 500 }
    );
  }
}
