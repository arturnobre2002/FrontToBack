"use client";

import { useState } from "react";
import { normalizeString, UserAlbums } from "@/utils/music-logic";

export default function Home() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) return;
    
    setLoading(true);
    setStatusText("Verifying user...");

    try {
      // 1. Verificar o user
      const resUser = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });
      const userData = await resUser.json();
      
      if (!userData.success) {
        alert(`Error: ${userData.error}`);
        setLoading(false);
        return;
      }

      setStatusText(`Fetching scrobbles for ${userData.user}...`);

      // 2. Ir buscar a primeira página de músicas (Teste)
      const resScrobbles = await fetch(`/api/scrobbles?username=${username}&page=1`);
      const scrobblesData = await resScrobbles.json();
      
      const tracks = scrobblesData.track || [];
      
      // 3. Agrupar por Álbum (Tal como no teu Python)
      const userAlbums: UserAlbums = {};

      tracks.forEach((t: any) => {
        const artist = t.artist["#text"];
        const album = t.album["#text"];
        const trackName = t.name;

        if (artist && album && trackName) {
          const artistNorm = normalizeString(artist);
          const albumNorm = normalizeString(album);
          const key = `${artistNorm}|${albumNorm}`;

          if (!userAlbums[key]) {
            userAlbums[key] = {
              artist: artist,
              album: album,
              tracks: new Set(),
            };
          }
          userAlbums[key].tracks.add(trackName);
        }
      });

      // Transformar o objeto num array e contar quantos álbuns únicos apanhámos
      const albumArray = Object.values(userAlbums);
      
      console.log("Álbuns processados:", albumArray);
      alert(`Success! Processed 200 tracks and found ${albumArray.length} unique albums. Open DevTools (F12) to see them!`);

    } catch (error) {
      console.error(error);
      alert("Something went wrong.");
    } finally {
      setLoading(false);
      setStatusText("");
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-white/20 bg-white/10 p-8 shadow-2xl backdrop-blur-md">
        
        <h1 className="mb-2 text-center text-3xl font-bold tracking-tight text-white">
          FrontToBack
        </h1>
        <p className="mb-8 text-center text-sm text-white/70">
          Discover albums you've listened to front-to-back.
        </p>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Last.fm Username"
            className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white placeholder-white/40 outline-none transition focus:border-white/50 focus:bg-white/10"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-white/20 px-4 py-3 font-semibold text-white transition hover:bg-white/30 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Processing..." : "Analyze Scrobbles"}
          </button>
        </form>

        {/* Pequeno feedback visual extra */}
        {statusText && (
          <p className="mt-4 text-center text-xs text-white/60 animate-pulse">
            {statusText}
          </p>
        )}

      </div>
    </main>
  );
}