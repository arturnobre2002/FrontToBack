"use client";

import { useState } from "react";

export default function Home() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) return;
    
    setLoading(true);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        alert(`Success! User: ${data.user} | Total Scrobbles: ${data.playcount}`);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong.");
    } finally {
      setLoading(false);
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
            {loading ? "Connecting..." : "Analyze Scrobbles"}
          </button>
        </form>

      </div>
    </main>
  );
}