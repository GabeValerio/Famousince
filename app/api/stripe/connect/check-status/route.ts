import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { supabase } from "@/lib/supabaseClient";
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  throw new Error("STRIPE_SECRET_KEY is not defined");
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2023-10-16" as Stripe.LatestApiVersion,
});

export async function GET(request: NextRequest) {
  try {
    // Get the account ID from the database
    const { data: account, error: accountError } = await supabase
      .from("stripe_connect_accounts")
      .select("account_id, onboarding_complete")
      .single();

    if (accountError) {
      return NextResponse.json(
        { error: "No Stripe account found" },
        { status: 404 }
      );
    }

    // Get the account details from Stripe
    const stripeAccount = await stripe.accounts.retrieve(account.account_id);

    // Check if the account has completed onboarding
    const isComplete = 
      stripeAccount.details_submitted &&
      stripeAccount.payouts_enabled &&
      stripeAccount.charges_enabled;

    // Update the database if the status has changed
    if (isComplete !== account.onboarding_complete) {
      await supabase
        .from("stripe_connect_accounts")
        .update({ 
          onboarding_complete: isComplete,
          updated_at: new Date().toISOString()
        })
        .eq("account_id", account.account_id);
    }

    return NextResponse.json({
      accountId: account.account_id,
      isComplete,
      detailsSubmitted: stripeAccount.details_submitted,
      payoutsEnabled: stripeAccount.payouts_enabled,
      chargesEnabled: stripeAccount.charges_enabled
    });
  } catch (error) {
    console.error('Error checking account status:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to check account status' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the account ID from the request
    const { accountId } = await request.json();
    if (!accountId) {
      return NextResponse.json({ error: 'Account ID is required' }, { status: 400 });
    }

    // Retrieve the account from Stripe
    const account = await stripe.accounts.retrieve(accountId);

    // Check if the account is fully set up
    const isComplete = account.charges_enabled && 
                      account.payouts_enabled && 
                      account.details_submitted &&
                      account.requirements?.currently_due?.length === 0;

    // Return the account status
    return NextResponse.json({
      id: account.id,
      isComplete,
      detailsSubmitted: account.details_submitted,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      requirements: {
        currentlyDue: account.requirements?.currently_due || [],
        eventuallyDue: account.requirements?.eventually_due || [],
        pastDue: account.requirements?.past_due || [],
      }
    });
  } catch (error) {
    console.error('Error checking account status:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to check account status' },
      { status: 500 }
    );
  }
} 