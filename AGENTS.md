# AGENTS.md — rules for the coding agent

## Project
TrailMate: offline-first PWA, React + Vite + TypeScript. Read `docs/PRD.md`, `docs/ARCHITECTURE.md`, `docs/ROADMAP.md` before coding.

## Hard rules
1. **Offline first.** Core flow (quest → walk → identify → recap) must work with no network after first load. Never add a runtime call to a cloud AI API.
2. **Run inference in a Web Worker** (`src/workers/inference.worker.ts`). Never block the UI thread.
3. **Store events, not totals.** XP is derived from an append-only `xp_events` table (see `docs/DATA_MODEL.md`).
4. **Honest AI.** Always show confidence. Below threshold (default 0.35) show "Not sure — try another angle", never a confident guess.
5. **Small scope.** Work only on the current day's tasks in `docs/ROADMAP.md`. Do not add features from the "Cut" list.
6. **Mobile first.** Design for 360px width, big tap targets, high-contrast outdoor UI.
7. No secrets in the repo. No analytics/trackers.

## Conventions
- TypeScript strict. Functional components + hooks. Feature folders under `src/features/`.
- Keep files < 250 lines. Pure logic (haversine, xp, levels) in plain functions with unit tests (Vitest).
- Commit small, message format: `feat(identify): ...`, `fix(walk): ...`.

## Prompts to reuse
- "Implement Day N tasks from docs/ROADMAP.md only. List files you'll touch first."
- "Add a Vitest test for <function> covering edge cases, then implement."
- "Review this feature against the Hard rules in AGENTS.md and list violations."

## Definition of done (per feature)
Works in airplane mode on a real phone · no console errors · tested at 360px · committed.
