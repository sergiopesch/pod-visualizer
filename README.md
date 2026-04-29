# Podcast Asset Studio

A one-page production workspace for creating podcast and video launch assets across three high-priority creator platforms: YouTube, Spotify, and X.

## What It Does

- Generates platform-aware visual frames, AI thumbnail backgrounds, covers, and waveform cards.
- Uses MrBeast-inspired packaging rules: short visual hooks, title/thumbnail curiosity gap, fast payoff, and high contrast.
- Includes current spec notes for common creator workflows across the three platforms.
- Produces generated titles, captions, hashtags, and a JSON production brief.
- Supports page-wide drag and drop for local cover art and audio uploads.
- Exports selected PNG assets, contact sheets, or platform packs directly from the browser.

## Platform Packs

- YouTube: long-form master, Shorts frame, thumbnail, podcast playlist art.
- Spotify: video podcast, show cover, episode cover, audio card.
- X: vertical video, square timeline clip, launch card, quote card.

Spec snapshot in the UI was verified on April 28, 2026 using official platform documentation.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Validation

```bash
npm run lint
npm run build
```

For export validation, start the production server and run the browser export sweep:

```bash
PORT=3002 npm run start
EXPORT_QA_URL=http://localhost:3002 npm run qa:exports
```

The app is built with Next.js, React, Tailwind CSS, Radix UI primitives, lucide-react icons, simple-icons brand marks, and Playwright-ready Computer Use dependencies.
