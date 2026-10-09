# Roadmap — Tue Oct 6 → Sun Oct 11, 2026

> **Assumption:** the Touch Grass deadline is around Sun Oct 11 – Mon Oct 12. DEV's Monday challenges run about a week, but **confirm the exact deadline on the challenge page** and shift this plan if needed. Mon Oct 12 is buffer.
> Hours assume a solo student with classes: ~3 h weeknights, longer on the weekend.

## Cut line & gates
| Gate | When | Rule |
|---|---|---|
| **G0 Go/no-go** | Tue night | Vision spike works on phone (< 3 s, ≥ 6/10 easy classes). If not, shrink labels to coarse categories. |
| **G1 Offline works** | Fri EOD | Airplane-mode flow works on a real phone. If not, **drop bird audio, journal polish, share card** and fix offline. |
| **G2 Feature freeze** | Sat 2 PM | No new features after this. Only bugs, polish, docs. |
| **G3 Submit-ready** | Sun 6 PM | Post written, demo recorded, repo public. Anything after is buffer. |

## Schedule

### Day 0 — Tue Oct 6 (~2–3 h) · Setup + spike
- [ ] Create repo, commit these docs, add `AGENTS.md`
- [ ] Scaffold Vite + React + TS, Tailwind, `vite-plugin-pwa`, Dexie, Vitest
- [ ] **Spike:** Transformers.js CLIP zero-shot on 10 photos (laptop + phone) → log latency/accuracy in `docs/AI_MODELS.md`
- [ ] Draft `public/labels/campus.json` (30–50 labels)
- [ ] Pick final model and fill the "Final choices" table
- **Done when:** G0 decision recorded.

### Day 1 — Wed Oct 7 (~4 h) · Core loop, no AI
- [ ] Setup screen (time / mood / difficulty)
- [ ] Template quest generator (≥ 20 quest items across types)
- [ ] Walk screen: timer, `watchPosition`, haversine + jitter filter, Wake Lock
- [ ] Dexie schema + `Adventure` save
- [ ] Completion screen + Touch Grass Score (unit-tested)
- **Done when:** a full fake-walk flow works end to end on laptop; distance logic tested.

### Day 2 — Thu Oct 8 (~4 h) · Hero feature: photo ID
- [ ] Inference worker + model loader with progress UI
- [ ] Precompute label embeddings; cosine-sim + softmax + threshold
- [ ] Camera/file capture → result card (label, confidence, "Not sure" state)
- [ ] Discovery saved; quest items auto-complete
- [ ] XP events written for IDs
- **Done when:** photo → ID → XP works on your phone over Wi-Fi.

### Day 3 — Fri Oct 9 (~4 h) · Offline + rewards (**G1**)
- [ ] Service worker: precache shell; cache model files; "Download offline pack" button
- [ ] **Airplane-mode test on real phone** (cold start, ID, finish a walk)
- [ ] `wasOffline` tracking → **No Signal Explorer** badge
- [ ] XP ledger derivations, levels, 6 badges, anti-cheat caps
- [ ] Deploy to Vercel/Netlify; install PWA on phone
- **Done when:** G1 passes.

### Day 4 — Sat Oct 10 (~6 h) · Go outside + polish (**G2 at 2 PM**)
- [ ] **Morning (before G2):** optional bird-audio spike, or templated journal (S1) + share card (S2)
- [ ] **Late afternoon golden hour: real outdoor test** — do a full quest on campus, airplane mode ON; take photos/screenshots; note what broke and what ID got wrong
- [ ] Fix top 3 issues from the field test
- [ ] Outdoor-friendly UI pass (contrast, big buttons, 360px)
- **Done when:** one full real outdoor run documented with photos and honest notes.

### Day 5 — Sun Oct 11 (~6 h) · Ship (**G3 at 6 PM**)
- [ ] Record demo using `docs/DEMO_SCRIPT.md` (airplane mode visible)
- [ ] Write the DEV post from `docs/SUBMISSION_POST.md` (include field-test results)
- [ ] Export DevRelay session and embed/link it (optional but helpful)
- [ ] README final pass: screenshots, model credits, licenses, run instructions
- [ ] Make repo public; verify the deployed URL works from a clean browser profile
- [ ] **Submit**

### Mon Oct 12 — Buffer
Fix submission issues; do not add features.

## Daily ritual (5 min)
1. Re-read the day's checklist. 2. Commit at the end. 3. Tick the checkboxes above. 4. Write 2 lines in the "Dev log" below.

## Dev log
| Date | Done | Blocked / decisions |
|---|---|---|
| Oct 6 | | |
| Oct 7 | | |
| Oct 8 | | |
| Oct 9 | | |
| Oct 10 | | |
| Oct 11 | | |

## Post-hackathon ideas
Supabase sync + campus leaderboard, weekly challenges, bird audio species ID, Trail Coins, fine-tuned local label set per campus/region.
