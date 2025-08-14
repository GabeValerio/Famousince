import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firstName, lastName, email } = body;

    // Validate required fields
    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { error: 'First name, last name, and email are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const { data: existingEntry, error: checkError } = await supabase
      .from('waitlist')
      .select('id')
      .eq('email', email)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing email:', checkError);
      return NextResponse.json(
        { error: 'Failed to check existing email' },
        { status: 500 }
      );
    }

    if (existingEntry) {
      return NextResponse.json(
        { error: 'This email is already on our waitlist' },
        { status: 409 }
      );
    }

    // Insert new waitlist entry
    const { data, error: insertError } = await supabase
      .from('waitlist')
      .insert({
        first_name: firstName,
        last_name: lastName,
        email: email,
        subscribed_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting waitlist entry:', insertError);
      return NextResponse.json(
        { error: 'Failed to add to waitlist' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Successfully added to waitlist!',
      data: {
        id: data.id,
        firstName: data.first_name,
        lastName: data.last_name,
        email: data.email,
        subscribedAt: data.subscribed_at
      }
    });

  } catch (error) {
    console.error('Waitlist API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Get waitlist statistics (public endpoint)
    const { count, error } = await supabase
      .from('waitlist')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('Error getting waitlist count:', error);
      return NextResponse.json(
        { error: 'Failed to get waitlist count' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      totalSubscribers: count || 0,
      message: 'Waitlist statistics retrieved successfully'
    });

  } catch (error) {
    console.error('Waitlist GET API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
