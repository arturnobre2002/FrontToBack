import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username');
  const page = searchParams.get('page') || '1';

  if (!username) {
    return NextResponse.json({ error: 'Username is required' }, { status: 400 });
  }

  const LASTFM_API_KEY = process.env.LASTFM_API_KEY;
  const url = `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${username}&api_key=${LASTFM_API_KEY}&format=json&limit=200&page=${page}`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (data.error) {
      return NextResponse.json({ error: data.message }, { status: 400 });
    }

    return NextResponse.json(data.recenttracks);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch scrobbles' }, { status: 500 });
  }
}