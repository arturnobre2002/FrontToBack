import { NextResponse } from 'next/server';

async function getSpotifyToken() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ grant_type: 'client_credentials' }),
    cache: 'no-store',
  });

  const data = await response.json();
  return data.access_token;
}

export async function POST(request: Request) {
  try {
    const { artist, album } = await request.json();

    if (!artist || !album) {
      return NextResponse.json({ error: 'Missing artist or album' }, { status: 400 });
    }

    const token = await getSpotifyToken();

    const query = encodeURIComponent(`album:${album} artist:${artist}`);
    const searchUrl = `https://api.spotify.com/v1/search?q=${query}&type=album&limit=1`;
    
    const searchRes = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const searchData = await searchRes.json();

    if (!searchData.albums?.items?.length) {
      return NextResponse.json({ error: 'Album not found on Spotify' }, { status: 404 });
    }

    const albumId = searchData.albums.items[0].id;
    const spAlbumName = searchData.albums.items[0].name;

    const tracksUrl = `https://api.spotify.com/v1/albums/${albumId}/tracks?limit=50`;
    const tracksRes = await fetch(tracksUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const tracksData = await tracksRes.json();

    const tracks = tracksData.items.map((t: any) => ({
      name: t.name,
      duration_ms: t.duration_ms,
    }));

    return NextResponse.json({ success: true, spAlbumName, tracks });

  } catch (error) {
    console.error("Spotify API Error:", error);
    return NextResponse.json({ error: 'Failed to fetch from Spotify' }, { status: 500 });
  }
}