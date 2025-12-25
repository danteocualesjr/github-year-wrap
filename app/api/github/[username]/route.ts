import { NextRequest, NextResponse } from 'next/server';
import { generateYearReviewData } from '@/lib/github';

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const username = params.username;
    const year = 2024; // Can be made configurable later

    const data = await generateYearReviewData(username, year);

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error: any) {
    console.error('Error fetching GitHub data:', error);
    
    return NextResponse.json(
      { error: error.message || 'Failed to fetch GitHub data' },
      { status: error.message?.includes('not found') ? 404 : 500 }
    );
  }
}

