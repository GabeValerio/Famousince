import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the account ID from the request
    const { accountId } = await request.json();
    if (!accountId) {
      return NextResponse.json({ error: 'Account ID is required' }, { status: 400 });
    }

    // First, verify this is a valid Stripe Connect account
    const { data: account, error: accountError } = await supabase
      .from('stripe_connect_accounts')
      .select('*')
      .eq('account_id', accountId)
      .single();

    if (accountError || !account) {
      return NextResponse.json({ error: 'Invalid Stripe Connect account' }, { status: 400 });
    }

    // Update all products to use the new owner account
    const { error: productsError } = await supabase
      .from('products')
      .update({ stripe_account_id: accountId })
      .or(`stripe_account_id.is.null,stripe_account_id.neq.${accountId}`);

    if (productsError) {
      console.error('Error updating products:', productsError);
      throw new Error('Failed to update products');
    }

    // Update all product_types to use the new owner account
    const { error: productTypesError } = await supabase
      .from('product_types')
      .update({ stripe_account_id: accountId })
      .or(`stripe_account_id.is.null,stripe_account_id.neq.${accountId}`);

    if (productTypesError) {
      console.error('Error updating product types:', productTypesError);
      throw new Error('Failed to update product types');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating owner account:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update owner account' },
      { status: 500 }
    );
  }
} 