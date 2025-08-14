import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error("STRIPE_SECRET_KEY is not defined in the environment variables");
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2023-10-16" as Stripe.LatestApiVersion,
});

export async function GET() {
  try {
    // List all connected accounts
    const accounts = await stripe.accounts.list({
      limit: 100,
    });

    // Filter for active accounts and format the response
    const activeAccounts = accounts.data
      .filter(account => account.charges_enabled && account.payouts_enabled)
      .map(account => ({
        id: account.id,
        business_profile: {
          name: account.business_profile?.name || 'Unnamed Account',
        },
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
      }));

    return NextResponse.json({ 
      accounts: activeAccounts,
      total: activeAccounts.length 
    });
  } catch (error) {
    console.error("Error fetching Stripe connected accounts:", error);
    return NextResponse.json({ 
      error: "Failed to fetch connected accounts",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
