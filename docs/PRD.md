# PRD — TrailMate

## Problem
AI apps keep people on screens, and cloud AI fails exactly where outdoor activity happens: no signal. Students also have little reason to step outside between classes.

## Goal
Make the screen the shortest part of an outdoor experience, using on-device open-weight AI.

## Target user
College students (initially IIITDM Jabalpur campus) who want a quick, low-effort reason to go outside for 15–60 minutes.

## Success criteria (hackathon)
- Demo works with airplane mode ON.
- One real outdoor test completed and documented.
- Submission clearly answers "why open?".

## Scope

### Must (MVP)
| ID | Feature |
|---|---|
| M1 | Quest setup: time (15/30/60), mood, difficulty |
| M2 | Quest generation (template-based; optional local LLM if WebGPU available) |
| M3 | Walk tracking: timer + GPS distance (foreground, Wake Lock) |
| M4 | Photo → local zero-shot ID against curated campus label set, with confidence |
| M5 | Quest checklist auto-completes from IDs / manual tick |
| M6 | Completion screen with Touch Grass Score |
| M7 | Local XP ledger, levels, ~6 badges (incl. **No Signal Explorer**) |
| M8 | Installable PWA, fully offline after first load |

### Should
| ID | Feature |
|---|---|
| S1 | Adventure journal (templated text from the session's data) |
| S2 | Shareable adventure card (canvas → PNG) |
| S3 | Bird audio ID spike (see AI_MODELS.md) |

### Could (stretch, only if ahead of schedule)
Supabase sync + single campus leaderboard (seeded demo data).

### Won't (mention as "next")
Trail Coins/partnerships, community challenges, global/friends/weekly boards, streak protection, profile themes.

## Touch Grass Score (draft)
`score = min(100, round( 0.4*min(minutes/45,1)*100 + 0.3*min(km/2,1)*100 + 0.3*min(discoveries/5,1)*100 ) - 5*max(0, phoneChecks-2))`
Floor at 0. Tune after the real outdoor test.

## Non-goals
Species-level accuracy beyond the curated label set; background GPS tracking; user accounts in MVP.

## Risks
| Risk | Mitigation |
|---|---|
| Zero-shot ID inaccurate | Narrow label set (~30–50 campus items), confidence threshold, "not sure" state |
| Model too big/slow on phone | Smallest CLIP variant, quantized, worker, test Day 0 |
| iOS/Android PWA GPS limits | Foreground + Wake Lock; state limitation openly |
| Offline caching bugs | Test airplane mode from Day 4, not last day |
| Time (solo dev) | Strict cut line, see ROADMAP |
