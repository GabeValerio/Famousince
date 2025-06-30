import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/authOptions';

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
    if (key === 'deploy_site') {
      message = value 
        ? '🚀 Site is now LIVE! Visitors will see the main website.'
        : '🚧 Site is now in Coming Soon mode. Visitors will be redirected to the Coming Soon page.';
    }

    return NextResponse.json({ 
      data,
      message
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 