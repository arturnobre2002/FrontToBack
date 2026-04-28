import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { artist, album } = await request.json();

    if (!artist || !album) {
      return NextResponse.json({ error: 'Missing artist or album' }, { status: 400 });
    }

    const query = encodeURIComponent(`${artist} ${album}`);
    const res = await fetch(`https://itunes.apple.com/search?term=${query}&entity=album&limit=1`);
    const data = await res.json();

    if (data.results && data.results.length > 0) {
      // O hack da resolução máxima!
      const artworkUrl = data.results[0].artworkUrl100.replace('100x100bb', '1000x1000bb');
      return NextResponse.json({ success: true, coverUrl: artworkUrl });
    } else {
      return NextResponse.json({ error: 'Cover not found on iTunes' }, { status: 404 });
    }
  } catch (error) {
    console.error("iTunes API Error:", error);
    return NextResponse.json({ error: 'Failed to fetch from iTunes' }, { status: 500 });
  }
}