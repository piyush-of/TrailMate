# 🌿 TrailMate

> An offline-first outdoor quest companion. The AI runs on your phone, so the screen is just the setup and recap — the adventure happens outside.

Built for the DEV **Touch Grass** challenge (HF26): *build something with open-source AI at its core that gets people off the screen.*

## What it does
1. **Plan** — pick time, mood, difficulty → get a short outdoor quest.
2. **Go outside** — walk, take photos, complete challenges. Works in airplane mode.
3. **Discover** — a local open-weight vision model identifies what you photograph (curated campus label set).
4. **Recap** — Touch Grass Score, XP, badges, and an adventure journal entry.

## Why open?
| Closed-API approach | TrailMate (open-weight, on-device) |
|---|---|
| Needs signal (trails often have none) | Works offline, airplane mode ON |
| Photos/audio leave the device | Data never leaves the phone |
| Per-call API cost | Zero running cost |
| Locked to one vendor's model | Swappable models; label set is editable |

## Tech stack
React + Vite + TypeScript · PWA (service worker) · Transformers.js (ONNX/WASM/WebGPU) · Dexie (IndexedDB) · Tailwind · Static hosting (Vercel/Netlify). Optional: Supabase for campus leaderboard (stretch).

## Docs
- [PRD](docs/PRD.md) · [Architecture](docs/ARCHITECTURE.md) · [AI & Models](docs/AI_MODELS.md)
- [Rewards](docs/REWARDS.md) · [Data Model](docs/DATA_MODEL.md)
- [**Roadmap (day-by-day)**](docs/ROADMAP.md) · [Demo Script](docs/DEMO_SCRIPT.md) · [Submission Post](docs/SUBMISSION_POST.md)
- [AGENTS.md](AGENTS.md) — instructions for the coding agent

## Quick start
```bash
npm create vite@latest trailmate -- --template react-ts
cd trailmate && npm i
npm i @huggingface/transformers dexie vite-plugin-pwa tailwindcss
npm run dev
```

## Repo layout
```
src/
  app/            routes, layout
  features/
    quest/        generator, quest state
    walk/         geolocation, distance, timer
    identify/     model loader, inference worker, labels
    rewards/      xp ledger, levels, badges
    journal/      recap + journal text
  lib/            db (dexie), haversine, utils
  workers/        inference.worker.ts
public/
  labels/campus.json
  models/         (cached/served model files)
docs/
```

## License
Code: MIT. Models keep their own licenses — see [AI_MODELS.md](docs/AI_MODELS.md).
