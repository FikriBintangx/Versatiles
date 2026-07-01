import { NextResponse } from 'next/server';

// Sementara kita simpan di memory (bisa diganti ke Database seperti Supabase / Vercel Postgres nanti)
const reports: any[] = [];

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Validasi sederhana
    if (!data.summary) {
      return NextResponse.json({ error: 'Summary is required' }, { status: 400 });
    }

    // Tambahkan log atau simpan ke database
    console.log('🤖 [ANTIGRAVITY REPORT RECEIVED]:', data);
    reports.push({
      ...data,
      receivedAt: new Date().toISOString(),
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Report saved successfully!',
      data 
    }, { status: 201 });

  } catch (error) {
    console.error('Error processing report:', error);
    return NextResponse.json({ error: 'Failed to process report' }, { status: 500 });
  }
}

export async function GET() {
  // Endpoint ini dipakai dashboard untuk nge-fetch data report
  return NextResponse.json({ success: true, reports });
}
