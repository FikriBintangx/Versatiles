import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Validasi sederhana
    if (!data.summary) {
      return NextResponse.json({ error: 'Summary is required' }, { status: 400 });
    }

    console.log('🤖 [ANTIGRAVITY REPORT RECEIVED]:', data);

    // Simpan ke database Supabase
    const { data: insertedData, error } = await supabase
      .from('antigravity_reports')
      .insert([
        {
          timestamp: data.timestamp || new Date().toISOString(),
          summary: data.summary,
          details: data.details || '',
          status: data.status || 'completed'
        }
      ])
      .select();

    if (error) {
      console.error('Supabase Insert Error:', error);
      return NextResponse.json({ error: 'Failed to save report to database' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Report saved to Supabase successfully!',
      data: insertedData 
    }, { status: 201 });

  } catch (error) {
    console.error('Error processing report:', error);
    return NextResponse.json({ error: 'Failed to process report' }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Ambil data terbaru dari Supabase
    const { data: reports, error } = await supabase
      .from('antigravity_reports')
      .select('*')
      .order('timestamp', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
    }

    return NextResponse.json({ success: true, reports: reports || [] });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
  }
}
