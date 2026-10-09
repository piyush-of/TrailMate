# DEV Post Template — Touch Grass

**Title:** TrailMate: an offline AI companion that gets you outside

**Tags:** `devchallenge`, `hacktoberfest` (check the challenge page for the exact required tags), `opensource`, `ai`

---

## What I Built
(2–3 sentences: offline outdoor quest app for college students; local AI identifies what you photograph; XP and badges for real-world activity.)

## Demo
- Video (airplane mode visible): <link>
- Live app: <url>
- Code: <github repo>
- DevRelay session (optional): <link>

## Why Open?
Cover each point with a concrete example:
- **Offline:** works on trails/campus paths with no signal — show airplane-mode proof.
- **Privacy:** photos never leave the phone.
- **Cost:** $0 per inference, no API key.
- **Swappable / editable:** changed the label set for my campus in a text file; models can be swapped without code changes.
- **Honest comparison:** what a cloud API would have done better (accuracy on rare species) and worse (signal, cost, privacy).

## How It Works
Short architecture diagram (see `docs/ARCHITECTURE.md`), model name + license, how zero-shot labels work, how offline caching works.

## I Took It Outside (field test)
- Where/when, how long, distance
- What worked (e.g., X of Y IDs correct)
- What failed and what I fixed
- Photos from the walk

## Limitations (be candid)
Zero-shot accuracy limits · foreground-only GPS in PWAs · model download size on first use · anti-cheat is plausibility checks only.

## What's Next
Campus leaderboard with sync, bird audio species ID, weekly challenges.

## Credits & Licenses
Models, libraries, assets.
