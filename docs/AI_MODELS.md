# AI & Models

> Candidates below are starting points. **Verify exact model IDs, sizes and licenses before relying on them** and record the final choice in the table at the bottom.

## 1. Vision ID (hero feature)
- **Approach:** CLIP-style zero-shot classification with a curated label list. No training required.
- **Runtime:** Transformers.js (`@huggingface/transformers`) in a Web Worker; WASM by default, WebGPU if available.
- **Candidates:** a quantized CLIP ViT-B/32 ONNX export from the Transformers.js model hub (smallest first).
- **Labels:** `public/labels/campus.json` — 30–50 items (e.g., neem, banyan, peepal, gulmohar, mango tree, crow, parrot, myna, squirrel, butterfly, flower, grass, rock, water, building…). Edit freely — this is the "open" advantage.
- **Prompt template:** `"a photo of a {label}"`, optionally ensemble 2–3 templates.
- **Threshold:** 0.35 top-1 softmax; below → "Not sure".

### Day 0 spike (go/no-go)
Run 10 real campus photos through the pipeline on laptop and phone. Record: load time, per-image latency, top-1 accuracy. **Go if** latency < 3 s on phone and ≥ 6/10 correct on easy classes. Otherwise shrink the label set or fall back to coarse categories (tree / flower / bird / insect / other).

## 2. Quest generation
- **Default:** deterministic template engine (works on every device).
- **Optional enhancement:** small open instruct LLM via WebGPU (e.g., WebLLM / Transformers.js, ~0.5–1.5B params) to rephrase quests. Feature-flag; only if WebGPU is available and Day 3 is done.

## 3. Bird audio (stretch / spike)
- **Candidates:** BirdNET (TFLite; check license — the model has had non-commercial terms) or a general audio classifier (AudioSet-based) in Transformers.js that detects "bird" but not species.
- **Fallback:** record audio as a "bird call captured" discovery (no species) — still earns XP, honest in the post.
- Only attempt after offline photo ID is solid (Fri EOD gate).

## Licensing checklist
- [ ] Model license allows use in a public demo
- [ ] Attribution added to README
- [ ] Non-commercial limits mentioned in the post

## Final choices (fill in)
| Role | Model | Size | License | Notes |
|---|---|---|---|---|
| Vision ID | Xenova/clip-vit-base-patch32 (fallback: onnx-community/clip-vit-base-patch32), dtype q8, WASM | verify (several hundred MB incl. text encoder) | verify on model card (CLIP is MIT) | Loaded by `inference.worker.ts`; unverified from CI sandbox - confirm on first real run |
| Quest text (optional) | | | | |
| Audio (optional) | | | | |
