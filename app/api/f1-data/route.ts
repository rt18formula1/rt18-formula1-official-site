import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get('endpoint');
  const year = searchParams.get('year');
  const meetingKey = searchParams.get('meeting_key');

  try {
    let apiUrl = `https://api.openf1.org/v1/${endpoint}`;
    
    // パラメータを構築
    const params = new URLSearchParams();
    if (year) params.append('year', year);
    if (meetingKey) params.append('meeting_key', meetingKey);
    
    if (params.toString()) {
      apiUrl += `?${params.toString()}`;
    }

    console.log('Fetching from OpenF1 API:', apiUrl);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'rt18-formula1-website/1.0',
      },
      // キャッシュを有効にしてパフォーマンス向上
      next: { revalidate: 300 }, // 5分キャッシュ
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`Received ${data.length} items from ${endpoint}`);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching F1 data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch F1 data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
