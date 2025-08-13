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

    // Clear stripe_account_id from all products
    const { error: productsError } = await supabase
      .from('products')
      .update({ stripe_account_id: null })
      .neq('stripe_account_id', null);

    if (productsError) {
      console.error('Error clearing products:', productsError);
      throw new Error('Failed to clear products');
    }

    // Clear stripe_account_id from all product_types
    const { error: productTypesError } = await supabase
      .from('product_types')
      .update({ stripe_account_id: null })
      .neq('stripe_account_id', null);

    if (productTypesError) {
      console.error('Error clearing product types:', productTypesError);
      throw new Error('Failed to clear product types');
    }

    // Optionally, you can also delete the Stripe Connect account from the database
    // Uncomment the following lines if you want to completely remove the account
    /*
    const { error: deleteAccountError } = await supabase
      .from('stripe_connect_accounts')
      .delete()
      .neq('id', 0);

    if (deleteAccountError) {
      console.error('Error deleting account:', deleteAccountError);
      throw new Error('Failed to delete Stripe account');
    }
    */

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error clearing owner account:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to clear owner account' },
      { status: 500 }
    );
  }
} 