import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/authOptions';
import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, {
  apiVersion: "2023-10-16" as Stripe.LatestApiVersion,
}) : null;

export async function GET() {
  try {
    // Debug: Check table structure
    const { data: tableInfo, error: tableError } = await supabase
      .from('site_config')
      .select('*')
      .limit(1);

    if (tableError) {
      return NextResponse.json({ error: tableError.message }, { status: 500 });
    }

    const { data, error } = await supabase
      .from('site_config')
      .select('*')
      .order('key');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { key, value } = body;

    if (!key || typeof value !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid request body. Required: key (string) and value (boolean)' },
        { status: 400 }
      );
    }

    // Check hosting and Stripe requirements before allowing site deployment
    if (key === 'deploy_site' && value === true) {
      const requirements = await checkDeploymentRequirements();
      
      if (!requirements.hostingActive) {
        return NextResponse.json(
          { error: 'Hosting subscription required. Please subscribe to hosting before deploying your site.' },
          { status: 400 }
        );
      }
      
      if (!requirements.stripeSetup) {
        return NextResponse.json(
          { error: 'Stripe setup required. Please complete your Stripe Connect account setup before deploying your site.' },
          { status: 400 }
        );
      }
    }

    // First check if the config exists
    const { data: existingConfig, error: checkError } = await supabase
      .from('site_config')
      .select('*')  // Select all fields to see the full record
      .eq('key', key)
      .single();

    if (checkError) {
      return NextResponse.json({ error: checkError.message }, { status: 500 });
    }

    if (!existingConfig) {
      return NextResponse.json(
        { error: `Configuration '${key}' not found` },
        { status: 404 }
      );
    }

    // Update the config
    let { data, error: updateError } = await supabase
      .from('site_config')
      .update({ 
        value,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingConfig.id)
      .select()
      .maybeSingle();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    if (!data) {
      // Let's try to fetch the record again to see if it was actually updated
      const { data: verifyData, error: verifyError } = await supabase
        .from('site_config')
        .select('*')
        .eq('id', existingConfig.id)
        .single();
        
      if (verifyError) {
        return NextResponse.json({ error: 'Failed to verify update' }, { status: 500 });
      }
      
      if (!verifyData) {
        return NextResponse.json({ error: 'Failed to update configuration' }, { status: 500 });
      }
      
      // If we found the data, use it
      data = verifyData;
    }

    let message = 'Configuration updated successfully';
    
    // Special handling for deploy_site
    if (key === 'deploy_site') {
      if (value) {
        message = '🚀 Site is now LIVE! Visitors will see the main website.';
      } else {
        message = '🚧 Site is now in Coming Soon mode. Visitors will be redirected to the Coming Soon page.';
      }
    }

    return NextResponse.json({ 
      message,
      data: {
        id: data.id,
        key: data.key,
        value: data.value,
        description: data.description,
        updated_at: data.updated_at
      }
    });
  } catch (error) {
    console.error('Error updating site config:', error);
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
      // This would need to be implemented based on your hosting subscription tracking
      // For now, we'll check if there's an active subscription in your database
      // You may need to create a subscriptions table or use Stripe webhooks to track this
      const { data: subscriptionData } = await supabase
        .from('subscriptions') // You'll need to create this table
        .select('status')
        .eq('status', 'active')
        .single();
      
      hostingActive = !!subscriptionData;
    } catch (error) {
      // If table doesn't exist or no subscription found, hosting is not active
      hostingActive = false;
    }

    // Check Stripe Connect account status
    let stripeSetup = false;
    try {
      if (stripe) {
        const { data: accountData } = await supabase
          .from('stripe_connect_accounts')
          .select('account_id, onboarding_complete')
          .single();
        
        if (accountData?.account_id && accountData?.onboarding_complete) {
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