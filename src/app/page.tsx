"use client";

import { useState } from "react";
import { normalizeString, UserAlbums } from "@/utils/music-logic";

export default function Home() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [testCoverUrl, setTestCoverUrl] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) return;
    
    setLoading(true);

    try {
      setStatusText("Verifying user...");
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

      setStatusText("Fetching recent scrobbles...");
      const resScrobbles = await fetch(`/api/scrobbles?username=${username}&page=1`);
      const scrobblesData = await resScrobbles.json();
      
      const tracks = scrobblesData.track || [];
      const userAlbums: UserAlbums = {};

      tracks.forEach((t: any) => {
        const artist = t.artist["#text"];
        const album = t.album["#text"];
        const trackName = t.name;

        if (artist && album && trackName) {
          const key = `${normalizeString(artist)}|${normalizeString(album)}`;
          if (!userAlbums[key]) {
            userAlbums[key] = { artist, album, tracks: new Set() };
          }
          userAlbums[key].tracks.add(trackName);
        }
      });

      const albumArray = Object.values(userAlbums);
      
      if (albumArray.length === 0) {
        alert("No albums found in your recent scrobbles!");
        return;
      }

      setStatusText("Crosschecking with Spotify...");
      
      // Vamos testar com o primeiro álbum da lista
      const testAlbum = albumArray[0]; 

      console.log(`[1] A perguntar ao Spotify por: ${testAlbum.artist} - ${testAlbum.album}`);

      const spotifyRes = await fetch('/api/spotify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artist: testAlbum.artist, album: testAlbum.album }),
      });
      
      const spotifyData = await spotifyRes.json();
      
      if (!spotifyData.success) {
        console.warn("Álbum não encontrado no Spotify:", spotifyData.error);
        alert(`O álbum '${testAlbum.album}' não foi encontrado no Spotify.`);
        return;
      }

      // Vamos usar a matemática que importámos! (Não te esqueças de importar a função 'calculateAlbumScore' no topo do ficheiro page.tsx)
      const { calculateAlbumScore } = await import("@/utils/music-logic");
      
      const result = calculateAlbumScore(spotifyData.tracks, testAlbum.tracks);
      
      console.log(`[2] Tracklist do Spotify:`, spotifyData.tracks);
      console.log(`[3] Faixas ouvidas pelo user:`, testAlbum.tracks);
      console.log(`[4] RESULTADO FINAL: ${result.percentage}% Completo! (Faltam ${result.missing} faixas)`);
      
      alert(`Ouviste ${result.percentage}% do álbum ${spotifyData.spAlbumName}! Abre a consola para ver os detalhes.`);
      
      setStatusText("Fetching HD cover from iTunes...");
      const itunesRes = await fetch('/api/itunes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artist: testAlbum.artist, album: testAlbum.album }),
      });
      const itunesData = await itunesRes.json();

      if (itunesData.success) {
        setTestCoverUrl(itunesData.coverUrl);
        setStatusText("Done!");
      } else {
        setStatusText("Cover not found.");
      }

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

        {statusText && (
          <p className="mt-4 text-center text-xs text-white/60 animate-pulse">
            {statusText}
          </p>
        )}

      </div>

      {/* Teste Visual da Capa */}
      {testCoverUrl && (
        <div className="mt-8 flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-700">
          <p className="mb-4 text-white/80 font-medium">Cover fetched successfully:</p>
          <img 
            src={testCoverUrl} 
            alt="Album Cover" 
            className="h-64 w-64 rounded-xl shadow-[0_0_40px_rgba(255,255,255,0.2)]"
          />
        </div>
      )}
    </main>
  );
}