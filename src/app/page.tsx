export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      {/* Liquid Glass Container */}
      <div className="w-full max-w-md rounded-2xl border border-white/20 bg-white/10 p-8 shadow-2xl backdrop-blur-md">
        
        <h1 className="mb-2 text-center text-3xl font-bold tracking-tight text-white">
          FrontToBack
        </h1>
        <p className="mb-8 text-center text-sm text-white/70">
          Discover albums you've listened to front-to-back.
        </p>
        
        <form className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Last.fm Username"
            className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white placeholder-white/40 outline-none transition focus:border-white/50 focus:bg-white/10"
          />
          <button
            type="submit"
            className="w-full rounded-lg bg-white/20 px-4 py-3 font-semibold text-white transition hover:bg-white/30 active:scale-95"
          >
            Analyze Scrobbles
          </button>
        </form>

      </div>
    </main>
  );
}