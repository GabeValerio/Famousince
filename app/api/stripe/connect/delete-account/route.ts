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
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the current Stripe Connect account from the database
    const { data: account, error: accountError } = await supabase
      .from('stripe_connect_accounts')
      .select('account_id')
      .single();

    if (accountError || !account) {
      return NextResponse.json({ error: 'No Stripe account found' }, { status: 404 });
    }

    // First, clear all products and product types
    const { error: productsError } = await supabase
      .from('products')
      .update({ stripe_account_id: null })
      .eq('stripe_account_id', account.account_id);

    if (productsError) {
      console.error('Error clearing products:', productsError);
      throw new Error('Failed to clear products');
    }

    const { error: productTypesError } = await supabase
      .from('product_types')
      .update({ stripe_account_id: null })
      .eq('stripe_account_id', account.account_id);

    if (productTypesError) {
      console.error('Error clearing product types:', productTypesError);
      throw new Error('Failed to clear product types');
    }

    // Delete the Stripe Connect account from Stripe
    try {
      await stripe.accounts.del(account.account_id);
    } catch (stripeError) {
      console.error('Error deleting Stripe account:', stripeError);
      // Continue with database cleanup even if Stripe deletion fails
    }

    // Delete the account from our database
    const { error: deleteError } = await supabase
      .from('stripe_connect_accounts')
      .delete()
      .eq('account_id', account.account_id);

    if (deleteError) {
      console.error('Error deleting account from database:', deleteError);
      throw new Error('Failed to delete account from database');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting account:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete account' },
      { status: 500 }
    );
  }
}
