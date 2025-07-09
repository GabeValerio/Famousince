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

    // Call the function to clear all products and product types
    const { error: clearError } = await supabase
      .rpc('clear_owner_stripe_account');

    if (clearError) {
      throw clearError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error clearing owner account:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to clear owner account' },
      { status: 500 }
    );
  }
} 