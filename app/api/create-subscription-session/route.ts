import { NextResponse, NextRequest } from "next/server";
import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error("STRIPE_SECRET_KEY is not defined in the environment variables");
}

const stripe = new Stripe(stripeSecretKey, {
    apiVersion: "2023-10-16" as Stripe.LatestApiVersion,
});

const isValidEmail = (email: string) => {
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(email);
};

export async function POST(request: NextRequest) {
  try {
    const { email, priceId, productName, productDescription } = await request.json();

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    if (!priceId) {
      return NextResponse.json({ error: "Price ID is required" }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      customer_email: email,
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/return?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/cancel`,
      metadata: {
        productName: productName,
        productDescription: productDescription,
      },
    });

    return NextResponse.json({ sessionUrl: session.url });
  } catch (error) {
    console.error("Error creating subscription session:", error);
    return NextResponse.json({ 
      error: "Internal Server Error", 
      message: error instanceof Error ? error.message : "Unknown error",
      details: error
    }, { status: 500 });
  }
}
