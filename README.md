# Podcast Asset Studio

A one-page production workspace for creating podcast and video launch assets across four high-priority creator platforms: YouTube, Spotify, X, and TikTok.

## What It Does

- Generates platform-aware visual frames, thumbnails, covers, and waveform cards.
- Uses MrBeast-inspired packaging rules: short visual hooks, title/thumbnail curiosity gap, fast payoff, and high contrast.
- Includes current spec notes for common creator workflows across the four platforms.
- Produces generated titles, captions, hashtags, and a JSON production brief.
- Supports page-wide drag and drop for local cover art and audio uploads.
- Exports selected PNG assets or a platform pack directly from the browser.

## Platform Packs

- YouTube: long-form master, Shorts frame, thumbnail, podcast playlist art.
- Spotify: video podcast, show cover, episode cover, audio card.
- X: vertical video, square timeline clip, launch card, quote card.
- TikTok: vertical cut, hook frame, square fallback, profile tile.

Spec snapshot in the UI was verified on April 28, 2026 using official platform documentation.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Validation

```bash
npm run build
```

The app is built with Next.js, React, Tailwind CSS, Radix UI primitives, and lucide-react icons.
