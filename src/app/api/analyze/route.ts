import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { username } = await request.json();

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    const LASTFM_API_KEY = process.env.LASTFM_API_KEY;

    // Teste simples para ver se a conta existe e trazer o playcount total
    const res = await fetch(`https://ws.audioscrobbler.com/2.0/?method=user.getinfo&user=${username}&api_key=${LASTFM_API_KEY}&format=json`);
    const data = await res.json();

    if (data.error) {
       return NextResponse.json({ error: data.message }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      user: data.user.name, 
      playcount: data.user.playcount 
    });

  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}