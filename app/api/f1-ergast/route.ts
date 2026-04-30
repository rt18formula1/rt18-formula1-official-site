import { NextResponse } from 'next/server';
import type { ErgastResponse, RaceTable, DriverTable, DriverStandingsTable } from '@/lib/ergast-types';

const ERGAST_API_BASE = 'http://ergast.com/api/f1';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get('endpoint') || 'races';
  const year = searchParams.get('year');
  const round = searchParams.get('round');
  const limit = searchParams.get('limit') || '1000';

  try {
    let apiUrl = `${ERGAST_API_BASE}`;
    
    // APIエンドポイントを構築
    if (year) {
      apiUrl += `/${year}`;
    }
    
    if (round) {
      apiUrl += `/${round}`;
    }
    
    switch (endpoint) {
      case 'races':
        apiUrl += '/races';
        break;
      case 'drivers':
        apiUrl += '/drivers';
        break;
      case 'driverStandings':
        apiUrl += '/driverStandings';
        break;
      case 'constructorStandings':
        apiUrl += '/constructorStandings';
        break;
      case 'results':
        apiUrl = `${ERGAST_API_BASE}/${year}/${round}/results`;
        break;
      case 'qualifying':
        apiUrl = `${ERGAST_API_BASE}/${year}/${round}/qualifying`;
        break;
      case 'laps':
        apiUrl = `${ERGAST_API_BASE}/${year}/${round}/laps`;
        break;
      case 'pitstops':
        apiUrl = `${ERGAST_API_BASE}/${year}/${round}/pitstops`;
        break;
      case 'seasons':
        apiUrl = `${ERGAST_API_BASE}/seasons`;
        break;
      default:
        apiUrl += '/races';
    }
    
    apiUrl += `.json?limit=${limit}`;
    
    console.log('Fetching from Ergast API:', apiUrl);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'rt18-formula1-website/1.0',
      },
      next: { revalidate: 3600 }, // 1時間キャッシュ
    });

    if (!response.ok) {
      throw new Error(`Ergast API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`Ergast API data received for ${endpoint}`);
    
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Error fetching Ergast data:', error);
    
    let errorMessage = 'Unknown error occurred';
    if (error instanceof Error) {
      if (error.message.includes('fetch')) {
        errorMessage = 'Network error - please check your connection';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Request timeout - please try again';
      } else {
        errorMessage = error.message;
      }
    }

    return NextResponse.json(
      { error: 'Failed to fetch Ergast data', details: errorMessage },
      { status: 500 }
    );
  }
}
