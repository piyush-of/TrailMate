// Copies the ONNX Runtime WASM files into public/ort so the app never needs a CDN at runtime.
// Runs automatically before `npm run dev` and `npm run build`.
import { cpSync, mkdirSync, existsSync } from 'node:fs';

const SRC = 'node_modules/onnxruntime-web/dist';
const DEST = 'public/ort';
const FILES = ['ort-wasm-simd-threaded.jsep.mjs', 'ort-wasm-simd-threaded.jsep.wasm'];

mkdirSync(DEST, { recursive: true });
for (const f of FILES) {
  if (!existsSync(`${SRC}/${f}`)) {
    console.error(`[copy-ort] Missing ${SRC}/${f}. Run "npm install" first.`);
    process.exit(1);
  }
  cpSync(`${SRC}/${f}`, `${DEST}/${f}`);
}
console.log('[copy-ort] ONNX runtime files copied to public/ort');
