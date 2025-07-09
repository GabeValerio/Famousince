import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions';
import { supabase } from '@/lib/supabaseClient';
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-05-28.basil'
});

export async function POST(request: Request) {
  try {
    // Check authentication and admin status
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get request data
    const data = await request.json();
    const { email, business_name, business_type } = data;

    if (!email || !business_name || !business_type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user already has a Connect account
    const { data: existingAccount, error: existingError } = await supabase
      .from('stripe_connect_accounts')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (existingError && existingError.code !== 'PGRST116') {
      console.error('Error checking existing account:', existingError);
      return NextResponse.json(
        { error: 'Error checking existing account' },
        { status: 500 }
      );
    }

    if (existingAccount) {
      return NextResponse.json(
        { error: 'Connect account already exists' },
        { status: 400 }
      );
    }

    // Create Stripe Connect account
    const account = await stripe.accounts.create({
      type: 'standard',
      email,
      business_type,
      business_profile: {
        name: business_name,
      },
    });

    // Store account in database
    const { error: insertError } = await supabase
      .from('stripe_connect_accounts')
      .insert({
        email,
        business_name,
        business_type,
        account_id: account.id,
        onboarding_complete: false
      });

    if (insertError) {
      console.error('Error storing Connect account:', insertError);
      // Try to clean up the Stripe account if database insert fails
      try {
        await stripe.accounts.del(account.id);
      } catch (deleteError) {
        console.error('Error deleting Stripe account after failed insert:', deleteError);
      }
      return NextResponse.json(
        { error: 'Error storing Connect account' },
        { status: 500 }
      );
    }

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.NEXT_PUBLIC_BASE_URL}/admin/stripe/refresh`,
      return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/admin/stripe/return`,
      type: 'account_onboarding',
    });

    return NextResponse.json({
      accountId: account.id,
      url: accountLink.url
    });
  } catch (error) {
    console.error('Error creating Connect account:', error);
    return NextResponse.json(
      { error: 'Error creating Connect account' },
      { status: 500 }
    );
  }
} 