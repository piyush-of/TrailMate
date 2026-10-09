# Architecture

```
            ┌──────────── React PWA (UI) ────────────┐
            │ Setup → Walk → Identify → Recap/Journal │
            └───────┬───────────────┬────────────────┘
                    │               │ postMessage
             Dexie (IndexedDB)   Inference Worker
              adventures,        Transformers.js
              xp_events,         (CLIP zero-shot,
              discoveries,        optional audio)
              badges                │
                    │          Model cache (Cache Storage)
                    ▼
             Service Worker (precache app shell + models)

   [Stretch] Sync Engine ──(online only)──► Supabase (campus board)
```

## Principles
- **Local-first.** IndexedDB is the source of truth; network is optional.
- **Worker isolation.** All model inference off the main thread.
- **Event-sourced rewards.** XP/badges derived from immutable events.

## Modules
| Module | Responsibility |
|---|---|
| `features/quest` | Build quest from inputs; template engine; optional LLM rewrite |
| `features/walk` | `watchPosition`, haversine distance, jitter filter, Wake Lock, timer |
| `features/identify` | Load model, embed image once, cosine-sim vs. cached label text embeddings, top-k |
| `features/rewards` | Append XP events, compute level, evaluate badge rules |
| `features/journal` | Template summary from session stats |
| `lib/db` | Dexie schema + typed helpers |

## Identify pipeline (zero-shot)
1. On first run (online) or build time: compute text embeddings for each label prompt ("a photo of a neem tree") → store as `labels.embeddings.json`.
2. At runtime: image → CLIP image embedding (worker) → cosine similarity to label embeddings → softmax → top-3.
3. If top-1 < threshold → "Not sure". Else show label + confidence → create `discovery` + XP event.

Precomputing text embeddings means the text encoder isn't needed at runtime → smaller, faster.

## Walk tracking details
- Ignore points with accuracy > 30 m; ignore jumps implying > 12 km/h walking speed.
- Sum haversine distance between accepted points.
- Request Screen Wake Lock while a walk is active; handle release on visibility change.

## Offline strategy
- `vite-plugin-pwa` (Workbox) precaches app shell.
- Model files cached via runtime caching (`CacheFirst`) after first download; show "Download offline pack (≈ XX MB)" button with progress.
- "No Signal Explorer" badge awarded when `navigator.onLine === false` for the whole adventure.

## Deployment
Static build → Vercel/Netlify. HTTPS required for geolocation, camera, service worker.

## Security / privacy
No accounts in MVP. Photos processed in-memory; stored thumbnails optional and local only.
