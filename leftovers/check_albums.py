import csv
import time
import spotipy
from spotipy.oauth2 import SpotifyClientCredentials
from difflib import SequenceMatcher
import re
from collections import defaultdict

# --- CONFIG ---
SPOTIPY_CLIENT_ID = "bf8fb899f5fe4765b555f31158fa259e"
SPOTIPY_CLIENT_SECRET = "054e68a2940940c6b794eff0c992426e"
CSV_FILENAME = "scrobbles.csv"
OUTPUT_FILENAME = "albums.txt"

MIN_TRACK_DURATION_MS = 30000      # menos agressivo
SKIT_IGNORE_THRESHOLD = 8          # só ignora skits se álbum tiver >= 8 faixas longas
COMPLETION_THRESHOLD = 0.85
MATCH_THRESHOLD = 0.80

sp = spotipy.Spotify(
    auth_manager=SpotifyClientCredentials(
        client_id=SPOTIPY_CLIENT_ID,
        client_secret=SPOTIPY_CLIENT_SECRET
    )
)

# --- HELPERS ---
def normalize_string(s):
    if not s:
        return ""
    s = re.sub(r'\s*[\(\[].*?[\)\]]', '', s)
    s = s.split(' - ')[0]
    return re.sub(r'[^a-z0-9]', '', s.lower())

def is_match(a, b):
    na, nb = normalize_string(a), normalize_string(b)
    if na == nb:
        return True
    return SequenceMatcher(None, na, nb).ratio() >= MATCH_THRESHOLD

# --- LOAD SCROBBLES ---
def get_scrobbles(filename):
    albums = defaultdict(lambda: {
        "artist": None,
        "album": None,
        "tracks": set()
    })
    artist_fallback = defaultdict(set)

    with open(filename, encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            artist = row.get("artist")
            album = row.get("album")
            track = row.get("track")

            if not artist or not track:
                continue

            artist_norm = artist.lower()

            if album:
                album_norm = normalize_string(album)
                key = (artist_norm, album_norm)
                albums[key]["artist"] = artist
                albums[key]["album"] = album
                albums[key]["tracks"].add(track)
            else:
                artist_fallback[artist_norm].add(track)

    return albums, artist_fallback

# --- SPOTIFY ---
def get_spotify_album(artist, album):
    q = f"album:{album} artist:{artist}"
    try:
        res = sp.search(q=q, type="album", limit=1)
        items = res["albums"]["items"]
        if not items:
            return None, None

        album_id = items[0]["id"]
        album_name = items[0]["name"]

        tracks = []
        t = sp.album_tracks(album_id)
        tracks.extend(t["items"])
        while t["next"]:
            t = sp.next(t)
            tracks.extend(t["items"])

        return album_name, tracks
    except:
        return None, None

# --- MAIN ---
def main():
    albums, artist_fallback = get_scrobbles(CSV_FILENAME)
    results = []

    for (artist_norm, album_norm), data in albums.items():
        user_tracks = set(data["tracks"])
        user_tracks |= artist_fallback.get(artist_norm, set())

        if len(user_tracks) < 3:
            continue

        artist = data["artist"]
        album = data["album"]

        sp_album_name, sp_tracks = get_spotify_album(artist, album)
        if not sp_tracks:
            continue

        long_tracks = [t for t in sp_tracks if t["duration_ms"] >= MIN_TRACK_DURATION_MS]

        if len(long_tracks) >= SKIT_IGNORE_THRESHOLD:
            required = [t["name"] for t in long_tracks]
        else:
            required = [t["name"] for t in sp_tracks]

        matched = 0
        for req in required:
            if any(is_match(req, u) for u in user_tracks):
                matched += 1

        score = matched / len(required)

        if score >= 0.50:
            results.append({
                "display": f"{artist} - {sp_album_name}",
                "score": score,
                "missing": len(required) - matched
            })

        time.sleep(0.1)

    complete, mid, low = [], [], []

    for r in results:
        pct = int(r["score"] * 100)
        line = r["display"]
        if r["score"] < 1 and r["score"] >= COMPLETION_THRESHOLD:
            line += f" [Faltam {r['missing']}]"

        if r["score"] >= COMPLETION_THRESHOLD:
            complete.append(line)
        elif r["score"] >= 0.70:
            mid.append(f"{line} ({pct}%)")
        else:
            low.append(f"{line} ({pct}%)")

    with open(OUTPUT_FILENAME, "w", encoding="utf-8") as f:
        f.write("=== ÁLBUNS COMPLETOS (ou quase) ===\n")
        f.write("\n".join(sorted(complete)))
        f.write("\n\n=== COMPLETION > 70% ===\n")
        f.write("\n".join(sorted(mid)) or "(Nenhum)")
        f.write("\n\n=== COMPLETION > 50% ===\n")
        f.write("\n".join(sorted(low)) or "(Nenhum)")

    print("feito.")

if __name__ == "__main__":
    main()
