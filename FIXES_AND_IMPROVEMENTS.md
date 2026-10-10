# TrailMate — Code Review: Mistakes, Fixes, Improvements

Reviewed: `TrailMate-main_2.zip` (React + Vite + TS PWA).
**Verified here:** `tsc` clean, 29 unit tests pass (13 original + 16 new), production build OK, service-worker precache list checked.
**NOT verified (could not do from my sandbox):** downloading the real model from Hugging Face (blocked), and anything on a real phone (camera, GPS, airplane mode). Treat those as the first things to test.

---

## 1. Critical mistakes (these would have broken the demo / the "honest AI" story)

| # | Problem | Why it matters | Fix |
|---|---|---|---|
| 1 | **The real AI model was never loaded.** The UI never sent `LOAD_MODEL`, so `classifier` stayed `null` and *every* photo went to a fallback. | The app was not using open-source AI at all. | New `inferenceClient.ts` singleton loads the model; modal + setup screen use it. |
| 2 | **The fallback returned a random label with a fake 58–93% confidence.** | Presenting random output as AI is dishonest and contradicts "honest AI" in your own AGENTS.md. Would be exposed by any judge testing a photo. | Fallback deleted. If the model isn't ready the UI says so; worker never invents a result. |
| 3 | **Offline would fail:** `transformers.js` loads the ONNX WASM from `cdn.jsdelivr.net` by default, and the 21 MB wasm wasn't in the service-worker precache. | "Airplane mode ON → AI still works" is the whole pitch. | WASM self-hosted in `/ort` (`scripts/copy-ort.mjs`, `wasmPaths` set in worker) and precached; duplicate asset excluded. Verified in `sw.js`. |
| 4 | **Prompt double-wrapped:** pipeline already adds "This is a photo of {}", code passed "a photo of a …". | Lowers accuracy. | Raw labels + `hypothesis_template: 'a photo of a {}'`. |
| 5 | **Unsure results could still be logged** (+15 XP, quest ticked, category of a rejected guess). | XP for "Not sure" results. | Log button only for confident results. |
| 6 | **Remote Unsplash "test photos"** in the identify modal. | Break offline, depend on third-party URLs/CORS. | Removed; added "Choose from gallery". |
| 7 | **Challenge XP shown but never saved** to the ledger; "quest complete +50" given even with 0 items done. | Recap XP ≠ level XP; free XP. | Pure `computeFinishXpEvents()`; all XP goes through ledger; recap reads from ledger. |
| 8 | **PWA couldn't install:** manifest pointed to `pwa-192/512.png` which didn't exist. | No install prompt / standalone mode. | Icons added (incl. maskable). Replace with real branding when you have it. |
| 9 | **Offline badge could be faked** by the "(sim)" toggle, and `isOffline \|\| wasOffline` counted partial offline. | Badge says "entire adventure offline". | Uses real `navigator.onLine`; offline only if never online during the walk. |

## 2. Other bugs fixed

- **Timer froze with screen off** (`setInterval` is throttled) → elapsed now computed from `startedAt`.
- **Wake Lock never re-acquired** after tab hidden → re-requested on return.
- **"Screen looks" counted the camera app** → ignores camera use; counts only real absences ≥ 3 s.
- **GPS anchor poisoning:** one bad first fix rejected all later points → re-anchor after 5 speed rejections.
- **Phantom distance when standing still** → minimum-movement filter (3–7.5 m) + no per-step rounding.
- **No GPS error feedback** → "waiting / blocked / unavailable" banners.
- **One photo ticked several quest items** → ticks one (exact label first, then category).
- **XP farming by re-photographing the same thing** → XP only for first find of a label per adventure.
- **Quest generator ignored mood** when few templates matched (e.g. Social + Hard) and used a biased shuffle → tiered top-up + Fisher–Yates.
- **XP daily cap** ran in array order and in UTC → time-ordered, local day (matters in IST).
- **Tick-all-and-finish exploit** → quest/challenge XP needs ≥ 2 min.
- **Adventure lost if the PWA was killed** → quest/phone-checks persisted; unfinished adventure resumes with distance rebuilt from GPS points.
- **Accidental finish** → two-step "Tap again to finish".
- **Double-tap start/finish** guarded.
- **Confetti re-fired on every re-render** → once.
- **Photos stored full-size (3–8 MB base64) in IndexedDB** → downscaled to 512 px JPEG (also faster inference).
- **`user-scalable=no`** removed (accessibility).
- **Repo hygiene:** `node_modules/` and `dist/` were in the zip (168 MB) and docs were duplicated in root and `docs/` → `.gitignore` added, duplicates removed.
- Removed unused/mismatched worker message types (they were lowercase; the worker used uppercase).

## 3. New things added

- **Offline AI pack card** on the setup screen (download once, shows progress/ready) — your docs promised it, code didn't have it.
- **Non-nature distractor labels** (person, screen, room, …): CLIP always picks *something*; now a photo of a face/laptop says "doesn't look like nature".
- Tests: quest generator, result interpreter, XP finish rules, daily cap, geo jitter.

## 4. Improvements still recommended (priority order)

1. **Test the model path on a real phone first** (Chrome Android): download pack → airplane mode → cold-start PWA → identify. Confirm the model ID loads and note latency. If `Xenova/…` ID or size is a problem, change `MODEL_CANDIDATES` in `inference.worker.ts`.
2. **Precompute label text embeddings.** The zero-shot pipeline re-encodes all ~46 prompts on *every* photo. Computing them once and caching them makes identification much faster on phones (this is what ARCHITECTURE.md describes).
3. **Download size.** The precache now pulls ~22 MB on first visit and the model is much larger. Consider a "Wi-Fi only" warning (done in copy) and a smaller/quantized vision-only model.
4. **Calibrate with real campus photos.** Threshold 0.35 and the label list are guesses. Take ~10 photos per common class, tune the threshold and add confusable pairs (Neem vs Peepal) to the label hints.
5. **Quest items still honour-system** (walk / sit / listen are manual ticks) — fine for a hackathon, say so in the post. Bird *audio* isn't implemented; the "audio" quest items are manual.
6. **Stop loading every discovery with its thumbnail** via `useLiveQuery(toArray)` in `App.tsx`; query only what each screen needs.
7. **Daily-start XP** (+10 per adventure) should be once per day per REWARDS.md.
8. **iOS Safari:** Wake Lock/geolocation in PWAs are limited — state it as a known limitation.
9. Add `robots.txt`/README screenshots, and fill the post's field-test section with *real* results from your campus walk.
10. Optional stretch: Supabase campus leaderboard (server must re-validate XP events).

## 5. Run it

```bash
npm install          # postinstall not needed; predev/prebuild copy the ONNX runtime to public/ort
npm test
npm run dev          # http://localhost:5173  (use HTTPS or localhost for camera/GPS)
npm run build && npm run preview
```
First online run → tap **Download offline AI pack** → then test with airplane mode.
