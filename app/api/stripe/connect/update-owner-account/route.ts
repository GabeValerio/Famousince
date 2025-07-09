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

    // Call the function to update all products and product types
    const { error: updateError } = await supabase
      .rpc('update_owner_stripe_account', {
        owner_account_id: accountId
      });

    if (updateError) {
      throw updateError;
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