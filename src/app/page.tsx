"use client";

import { useState } from "react";
import { normalizeString, UserAlbums } from "@/utils/music-logic";

export default function Home() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [progress, setProgress] = useState(0);
  
  // --- NOVOS ESTADOS PARA O STREAMING UI ---
  const [analyzedAlbums, setAnalyzedAlbums] = useState<any[]>([]);
  const [spotifyProgress, setSpotifyProgress] = useState({ current: 0, total: 0 });
  const [isProcessingSpotify, setIsProcessingSpotify] = useState(false);
  const [showResults, setShowResults] = useState(false); // Alavanca para esconder o formulário

  // A FUNÇÃO QUE RODA NO FUNDO (BACKGROUND)
  const processAlbumsQueue = async (albums: any[]) => {
    for (let i = 0; i < albums.length; i++) {
      const album = albums[i];
      
      try {
        // 1. Perguntar ao Spotify
        const spRes = await fetch('/api/spotify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ artist: album.artist, album: album.album }),
        });
        const spData = await spRes.json();

        if (spData.success) {
          const { calculateAlbumScore } = await import("@/utils/music-logic");
          const scoreRes = calculateAlbumScore(spData.tracks, album.tracks);

          // 2. Se ouviste pelo menos 50%, vamos buscar a capa ao iTunes (poupamos chamadas à API em álbuns que não interessam!)
          let coverUrl = "";
          if (scoreRes.percentage >= 50) {
            const itRes = await fetch('/api/itunes', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ artist: album.artist, album: album.album }),
            });
            const itData = await itRes.json();
            if (itData.success) coverUrl = itData.coverUrl;

            // 3. Adicionar o álbum à grelha visual IMEDIATAMENTE
            setAnalyzedAlbums(prev => [...prev, {
              ...album,
              spotifyName: spData.spAlbumName,
              score: scoreRes,
              coverUrl
            }]);
          }
        }
      } catch (error) {
        console.error("Erro ao processar álbum:", album.album, error);
      }

      // Atualizar o contador
      setSpotifyProgress(prev => ({ ...prev, current: i + 1 }));
      
      // DELAY OBRIGATÓRIO (300ms) para o Spotify não nos bloquear
      await new Promise(res => setTimeout(res, 300));
    }
    
    setIsProcessingSpotify(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) return;
    
    setLoading(true);
    setProgress(0);
    setAnalyzedAlbums([]);

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

      setStatusText("Fetching page 1...");
      const resFirstPage = await fetch(`/api/scrobbles?username=${username}&page=1`);
      const firstPageData = await resFirstPage.json();
      
      const totalPages = parseInt(firstPageData["@attr"]?.totalPages || "1", 10);
      let allTracks = [...(firstPageData.track || [])];

      const BATCH_SIZE = 5;
      for (let i = 2; i <= totalPages; i += BATCH_SIZE) {
        setStatusText(`Fetching scrobbles... Pages ${i} to ${Math.min(i + BATCH_SIZE - 1, totalPages)} of ${totalPages}`);
        setProgress(Math.round((i / totalPages) * 100));

        const batchPromises = [];
        for (let j = 0; j < BATCH_SIZE && (i + j) <= totalPages; j++) {
          batchPromises.push(
            fetch(`/api/scrobbles?username=${username}&page=${i + j}`).then(r => r.json())
          );
        }

        const batchResults = await Promise.all(batchPromises);
        batchResults.forEach(data => {
          allTracks = allTracks.concat(data.track || []);
        });

        await new Promise((resolve) => setTimeout(resolve, 200));
      }

      setStatusText("Grouping all your music history...");
      setProgress(100);

      const userAlbums: UserAlbums = {};
      allTracks.forEach((t: any) => {
        const artist = t.artist?.name || t.artist?.["#text"];
        const album = t.album?.["#text"];
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
      const albumsToProcess = albumArray.filter(a => a.tracks.size >= 3);

      // --- MUDANÇA DE ECRÃ ---
      setShowResults(true); 
      setSpotifyProgress({ current: 0, total: albumsToProcess.length });
      setIsProcessingSpotify(true);
      
      // Iniciar a fila do Spotify EM PANOS DE FUNDO (não usamos await aqui!)
      processAlbumsQueue(albumsToProcess);

    } catch (error) {
      console.error(error);
      alert("Something went wrong.");
    } finally {
      setLoading(false);
      setStatusText("");
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-6 transition-all duration-500">
      
      {/* ECRÃ 1: O FORMULÁRIO */}
      {!showResults && (
        <div className="mt-20 w-full max-w-md rounded-2xl border border-white/20 bg-white/10 p-8 shadow-2xl backdrop-blur-md">
          <h1 className="mb-2 text-center text-3xl font-bold tracking-tight text-white">FrontToBack</h1>
          <p className="mb-8 text-center text-sm text-white/70">Discover albums you've listened to front-to-back.</p>
          
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
            <div className="mt-4 flex flex-col items-center w-full animate-in fade-in">
              <p className="mb-2 text-xs text-white/70 animate-pulse">{statusText}</p>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <div className="h-full bg-white/60 transition-all duration-300 ease-out" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ECRÃ 2: OS RESULTADOS (STREAMING UI) */}
      {showResults && (
        <div className="w-full max-w-6xl mt-10 animate-in fade-in zoom-in-95 duration-500">
          
          {/* Header de Progresso do Spotify */}
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold text-white mb-2">Your Albums</h2>
            <p className="text-white/60 mb-4">
              {isProcessingSpotify 
                ? `Crosschecking with Spotify... (${spotifyProgress.current} / ${spotifyProgress.total})` 
                : "Analysis Complete!"}
            </p>
            {isProcessingSpotify && (
              <div className="mx-auto h-1 w-64 overflow-hidden rounded-full bg-white/10">
                <div 
                  className="h-full bg-green-400 transition-all duration-300 ease-out" 
                  style={{ width: `${(spotifyProgress.current / spotifyProgress.total) * 100}%` }} 
                />
              </div>
            )}
          </div>

          {/* Grelha de Capas */}
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {analyzedAlbums.map((album, idx) => (
              <div 
                key={idx} 
                className="group relative flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-700"
              >
                {/* Capa com estilo Glass/Glow */}
                <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-white/20 bg-white/5 shadow-2xl transition-transform duration-300 group-hover:scale-105 group-hover:border-white/40">
                  {album.coverUrl ? (
                    <img src={album.coverUrl} alt={album.album} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-white/5 text-white/20">No Cover</div>
                  )}
                  
                  {/* Badge de Percentagem */}
                  <div className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-1 text-xs font-bold text-white backdrop-blur-md">
                    {album.score.percentage}%
                  </div>
                </div>

                {/* Texto do Álbum */}
                <div className="mt-3 text-center w-full">
                  <p className="truncate text-sm font-semibold text-white" title={album.album}>{album.album}</p>
                  <p className="truncate text-xs text-white/60" title={album.artist}>{album.artist}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

    </main>
  );
}