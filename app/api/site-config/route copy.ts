import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('site_config')
      .select('*')
      .order('key');

    if (error) {
      console.error('GET Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('GET Catch Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
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
      .select('id')
      .eq('key', key)
      .maybeSingle();

    if (checkError) {
      console.error('Check Error:', checkError);
      return NextResponse.json({ error: checkError.message }, { status: 500 });
    }

    if (!existingConfig) {
      return NextResponse.json(
        { error: `Configuration '${key}' not found` },
        { status: 404 }
      );
    }

    // Update the config
    const { data, error: updateError } = await supabase
      .from('site_config')
      .update({ 
        value,
        updated_at: new Date().toISOString()
      })
      .eq('key', key)
      .select()
      .maybeSingle();

    if (updateError) {
      console.error('Update Error:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Failed to update configuration' },
        { status: 500 }
      );
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
    console.error('POST Catch Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 