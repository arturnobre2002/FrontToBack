import stringSimilarity from "string-similarity";

export interface AlbumData {
  artist: string;
  album: string;
  tracks: Set<string>;
}

export type UserAlbums = Record<string, AlbumData>;

export function normalizeString(s: string): string {
  if (!s) return "";
  let str = s.replace(/\s*[\(\[].*?[\)\]]/g, '');
  str = str.split(' - ')[0];
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Verifica se a faixa do Spotify tem correspondência nas faixas que o User ouviu
export function isMatch(reqTrack: string, userTracks: Set<string>): boolean {
  const MATCH_THRESHOLD = 0.80;
  const reqNorm = normalizeString(reqTrack);
  
  for (const u of userTracks) {
    const uNorm = normalizeString(u);
    if (reqNorm === uNorm) return true;
    
    // Fuzzy matching
    if (reqNorm.length > 0 && uNorm.length > 0) {
      const similarity = stringSimilarity.compareTwoStrings(reqNorm, uNorm);
      if (similarity >= MATCH_THRESHOLD) return true;
    }
  }
  return false;
}

// Calcula a percentagem e ignora skits
export function calculateAlbumScore(spTracks: { name: string, duration_ms: number }[], userTracks: Set<string>) {
  const MIN_TRACK_DURATION_MS = 30000;
  const SKIT_IGNORE_THRESHOLD = 8;

  // Filtrar skits
  const longTracks = spTracks.filter(t => t.duration_ms >= MIN_TRACK_DURATION_MS);
  
  let requiredTracks = spTracks;
  if (longTracks.length >= SKIT_IGNORE_THRESHOLD) {
    requiredTracks = longTracks;
  }

  let matched = 0;
  for (const req of requiredTracks) {
    if (isMatch(req.name, userTracks)) {
      matched++;
    }
  }

  const score = matched / requiredTracks.length;
  return { 
    score: score, 
    missing: requiredTracks.length - matched, 
    total: requiredTracks.length,
    percentage: Math.floor(score * 100)
  };
}