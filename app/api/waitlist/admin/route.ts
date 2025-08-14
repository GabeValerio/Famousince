import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/authOptions';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all waitlist entries ordered by most recent first
    const { data, error } = await supabase
      .from('waitlist')
      .select('*')
      .order('subscribed_at', { ascending: false });

    if (error) {
      console.error('Error fetching waitlist entries:', error);
      return NextResponse.json(
        { error: 'Failed to fetch waitlist entries' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: data || [],
      total: data?.length || 0,
      message: 'Waitlist entries retrieved successfully'
    });

  } catch (error) {
    console.error('Waitlist admin API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
