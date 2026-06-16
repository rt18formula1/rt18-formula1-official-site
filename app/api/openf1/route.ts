import { NextResponse } from 'next/server';

const OPENF1_BASE = 'https://api.openf1.org/v1';

async function fetchOpenF1(endpoint: string) {
  const url = `${OPENF1_BASE}${endpoint}`;
  const response = await fetch(url, {
    headers: { 'User-Agent': 'rt18-formula1-official-site/1.0' },
    next: { revalidate: 3600 },
  });
  if (!response.ok) {
    throw new Error(`OpenF1 API error: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const year = searchParams.get('year');
  const meetingKey = searchParams.get('meetingKey');
  const sessionKey = searchParams.get('sessionKey');
  const sessionName = searchParams.get('sessionName');

  try {
    switch (type) {
      case 'meetings': {
        const url = year ? `/meetings?year=${encodeURIComponent(year)}` : '/meetings';
        const data = await fetchOpenF1(url);
        return NextResponse.json({ type: 'meetings', data, _scraped: true });
      }
      case 'sessions': {
        if (!meetingKey) {
          return NextResponse.json({ error: 'meetingKey is required' }, { status: 400 });
        }
        const data = await fetchOpenF1(`/sessions?meeting_key=${meetingKey}`);
        const normalized = data.map((item: Record<string, unknown>) => ({
          session_key: item.session_key,
          meeting_key: item.meeting_key,
          session_name: item.session_name,
          date_start: item.date_start,
          date_end: item.date_end,
          gmt_offset: item.gmt_offset,
        }));
        return NextResponse.json({ type: 'sessions', data: normalized, _scraped: true });
      }
      case 'results': {
        if (!sessionKey) {
          return NextResponse.json({ error: 'sessionKey is required' }, { status: 400 });
        }
        const data = await fetchOpenF1(`/results?session_key=${sessionKey}`);
        const normalized = data.map((item: Record<string, unknown>) => ({
          position: item.position,
          driver_number: item.driver_number,
          full_name: item.full_name,
          name_acronym: item.name_acronym,
          team_name: item.team_name,
          points: item.points,
          status: item.status,
          time: item.time,
        }));
        return NextResponse.json({ type: 'results', data: normalized, _scraped: true });
      }
      case 'drivers': {
        if (!sessionKey) {
          return NextResponse.json({ error: 'sessionKey is required' }, { status: 400 });
        }
        const data = await fetchOpenF1(`/drivers?session_key=${sessionKey}`);
        const normalized = data.map((item: Record<string, unknown>) => ({
          driver_number: item.driver_number,
          broadcast_name: item.broadcast_name,
          full_name: item.full_name,
          name_acronym: item.name_acronym,
          team_name: item.team_name,
        }));
        return NextResponse.json({ type: 'drivers', data: normalized, _scraped: true });
      }
      default:
        return NextResponse.json({ error: 'Unsupported OpenF1 type' }, { status: 400 });
    }
  } catch (error) {
    console.error('OpenF1 route error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error', _scraped: false },
      { status: 500 }
    );
  }
}
