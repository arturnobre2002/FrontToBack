# FrontToBack 🎧

FrontToBack is a high-fidelity, full-stack web application designed for music enthusiasts who want to track their album completion progress. By connecting to Last.fm, the app analyzes every scrobble in a user's history and cross-references them with official Spotify tracklists to identify which albums have been listened to from start to finish.

The interface features a modern design, providing a fluid and immersive visual experience.

## ✨ Features

- **High-Speed Data Fetching**: Utilizes parallelized batch requests to fetch thousands of Last.fm scrobbles in seconds.
- **Smart Completion Logic**: 
  - Implements fuzzy matching algorithms to account for track title variations (e.g., "Remastered", "Deluxe Edition").
  - Advanced "Skit Filtering" that intelligently ignores non-musical tracks under 30 seconds to aim for the most accurate completion stats possible.
- **Streaming UI**: Results "stream" into the view in real-time as they are processed, ensuring the app remains responsive even with massive music libraries.
- **HD Visuals**: Automatically fetches high-resolution album artwork (1000x1000px) via the iTunes Search API.
- **Premium Design**: Built with a glassmorphism aesthetic using Tailwind CSS and backdrop-filter effects.

## 🛠️ Tech Stack

- **Framework**: Next.js 15+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **String Matching**: `string-similarity` for fuzzy logic
- **APIs**:
  - Last.fm API (User scrobbles & metadata)
  - Spotify Web API (Official tracklists & validation)
  - iTunes Search API (High-resolution artwork)

## 🚀 Getting Started

### Prerequisites

You will need API keys from the following services:
- **Last.fm**: [Apply here](https://www.last.fm/api/account/create)
- **Spotify**: [Create an app here](https://developer.spotify.com/dashboard) (requires Premium)

### Installation

1. Clone the repository:
   ```bash
   git clone [https://github.com/arturnobre2002/FrontToBack.git](https://github.com/arturnobre2002/FrontToBack.git)
   cd FrontToBack
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file in the root directory and add your keys:
   ```env
   LASTFM_API_KEY=your_lastfm_key
   SPOTIFY_CLIENT_ID=your_spotify_id
   SPOTIFY_CLIENT_SECRET=your_spotify_secret
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🧠 How It Works

1. **Extraction**: The app fetches all recent tracks from Last.fm using a parallelized fetching strategy to maximize throughput without exceeding rate limits.
2. **Normalization**: Album and artist names are normalized to create a clean local database of the user's listening history.
3. **Verification**: For each eligible album, the app queries Spotify's API for the official tracklist.
4. **Scoring**: A comparison engine checks the user's tracks against the official list, applying duration thresholds to determine a completion percentage.
5. **Visualization**: Completed (or near-complete) albums are rendered with HD covers in a dynamic, glass-morphic grid.

## 🗺️ Roadmap

- [ ] Implement LocalStorage caching for even faster subsequent loads.
- [ ] Add "FrontToBack" milestone sharing (generate images for social media).
- [ ] Add deep-link integration to open albums directly in Spotify/Apple Music.
- [ ] Implement Framer Motion for smoother "liquid" transitions.

## 📄 License

This project is licensed under the MIT License.