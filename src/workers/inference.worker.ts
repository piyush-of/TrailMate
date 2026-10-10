import { pipeline, env } from '@huggingface/transformers';
import type { CampusLabel } from '../types';
import { DISTRACTOR_PROMPTS, interpretScores, promptFor, type RawScore } from '../features/identify/interpret';

// Self-hosted ONNX runtime files. `?url` makes Vite serve them in dev and emit hashed copies in
// production (precached by the service worker), so nothing is fetched from a CDN. Relative paths are
// used because onnxruntime-web's package "exports" don't expose /dist/*.
import ortMjsUrl from '../../node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.jsep.mjs?url';
import ortWasmUrl from '../../node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.jsep.wasm?url';

// Everything must work offline: models come from the browser Cache API after the first download.
env.allowLocalModels = false;
env.useBrowserCache = true;
if (env.backends.onnx.wasm) {
  env.backends.onnx.wasm.wasmPaths = { mjs: ortMjsUrl, wasm: ortWasmUrl };
}

// Verify the ID/license before publishing (see docs/AI_MODELS.md). Add more IDs here to try fallbacks.
const MODEL_CANDIDATES = ['Xenova/clip-vit-base-patch32'];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let classifier: any = null;
let loading: Promise<void> | null = null;

const post = (msg: unknown) => self.postMessage(msg);

function makeProgressCallback() {
  const files = new Map<string, { loaded: number; total: number }>();
  return (p: { status: string; file?: string; loaded?: number; total?: number }) => {
    if (p.status === 'progress' && p.file && p.total) {
      files.set(p.file, { loaded: p.loaded ?? 0, total: p.total });
      let loaded = 0;
      let total = 0;
      files.forEach((f) => {
        loaded += f.loaded;
        total += f.total;
      });
      const progress = total ? Math.min(99, Math.round((loaded / total) * 100)) : 0;
      post({ type: 'PROGRESS', progress, status: `Downloading AI model: ${progress}%` });
    }
  };
}

async function loadModel() {
  if (classifier) return;
  if (loading) return loading;
  loading = (async () => {
    post({ type: 'PROGRESS', progress: 1, status: 'Preparing AI model...' });
    const errors: string[] = [];
    for (const id of MODEL_CANDIDATES) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        classifier = await (pipeline as any)('zero-shot-image-classification', id, {
          device: 'wasm',
          dtype: 'q8',
          progress_callback: makeProgressCallback(),
        });
        post({ type: 'READY', model: id });
        return;
      } catch (err) {
        errors.push(`${id}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    // Report every failure (not just the last) so the real cause isn't hidden by a fallback's error
    post({ type: 'ERROR', error: `Could not load the AI model. ${errors.join(' | ')}` });
  })().finally(() => {
    loading = null;
  });
  return loading;
}

self.addEventListener('message', async (e: MessageEvent) => {
  const msg = e.data;

  if (msg.type === 'LOAD_MODEL') {
    await loadModel();
    return;
  }

  if (msg.type === 'CLASSIFY') {
    const { id, imageUrl, labels } = msg as { id: number; imageUrl: string; labels: CampusLabel[] };
    if (!classifier) {
      // Never invent a result: tell the UI honestly that the model isn't available.
      post({ type: 'CLASSIFY_ERROR', id, error: 'AI model is not loaded yet.' });
      return;
    }
    try {
      const candidates = [...labels.map(promptFor), ...DISTRACTOR_PROMPTS];
      const raw: RawScore[] = await classifier(imageUrl, candidates, {
        // The pipeline default is "This is a photo of {}" - pass raw labels + our own template.
        hypothesis_template: 'a photo of a {}',
      });
      post({ type: 'RESULT', id, result: interpretScores(raw, labels) });
    } catch (err) {
      post({ type: 'CLASSIFY_ERROR', id, error: err instanceof Error ? err.message : String(err) });
    }
  }
});