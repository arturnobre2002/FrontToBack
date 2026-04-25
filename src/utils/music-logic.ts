// Equivalente à tua função normalize_string do check_albums.py
export function normalizeString(s: string): string {
  if (!s) return "";
  // Remove parênteses/parênteses retos e o seu conteúdo (ex: "(Deluxe Edition)")
  let str = s.replace(/\s*[\(\[].*?[\)\]]/g, '');
  // Remove tudo depois de um " - "
  str = str.split(' - ')[0];
  // Remove caracteres não alfanuméricos e passa a minúsculas
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Interfaces para o TypeScript saber que dados estamos a manipular
export interface AlbumData {
  artist: string;
  album: string;
  tracks: Set<string>;
}

export type UserAlbums = Record<string, AlbumData>;