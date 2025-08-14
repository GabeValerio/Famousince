import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/authOptions';
import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, {
  apiVersion: "2023-10-16" as Stripe.LatestApiVersion,
}) : null;

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const requirements = await checkDeploymentRequirements();
    
    return NextResponse.json({
      hostingActive: requirements.hostingActive,
      stripeSetup: requirements.stripeSetup,
      canDeploy: requirements.hostingActive && requirements.stripeSetup,
      requirements: {
        hosting: {
          active: requirements.hostingActive,
          message: requirements.hostingActive 
            ? '✅ Hosting subscription is active' 
            : '❌ Hosting subscription required'
        },
        stripe: {
          setup: requirements.stripeSetup,
          message: requirements.stripeSetup 
            ? '✅ Stripe Connect account is fully configured' 
            : '❌ Stripe Connect account setup required'
        }
      }
    });
  } catch (error) {
    console.error('Error checking deployment requirements:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to check deployment requirements
async function checkDeploymentRequirements() {
  try {
    // Check hosting subscription status
    let hostingActive = false;
    try {
      const { data: subscriptionData, error: subError } = await supabase
        .from('subscriptions')
        .select('status, current_period_end')
        .eq('status', 'active')
        .single();
      
      if (!subError && subscriptionData) {
        // Check if subscription is still within the current period
        const now = new Date();
        const periodEnd = new Date(subscriptionData.current_period_end);
        hostingActive = periodEnd > now;
      }
    } catch (error) {
      // If table doesn't exist or no subscription found, hosting is not active
      hostingActive = false;
    }

    // Check Stripe Connect account status
    let stripeSetup = false;
    try {
      if (stripe) {
        const { data: accountData, error: accountError } = await supabase
          .from('stripe_connect_accounts')
          .select('account_id, onboarding_complete')
          .single();
        
        if (!accountError && accountData?.account_id && accountData?.onboarding_complete) {
          // Double-check with Stripe API
          const stripeAccount = await stripe.accounts.retrieve(accountData.account_id);
          stripeSetup = stripeAccount.charges_enabled && 
                       stripeAccount.payouts_enabled && 
                       stripeAccount.details_submitted;
        }
      }
    } catch (error) {
      stripeSetup = false;
    }

    return { hostingActive, stripeSetup };
  } catch (error) {
    console.error('Error checking deployment requirements:', error);
    return { hostingActive: false, stripeSetup: false };
  }
}
