import { useSyncExternalStore } from 'react';
import type { CampusLabel, ClassificationResult } from '../../types';

export type ModelStatus = 'idle' | 'loading' | 'ready' | 'error';
export interface InferenceState {
  status: ModelStatus;
  progress: number;
  message: string;
  error?: string;
}

const READY_FLAG = 'trailmate:model-ready';

let worker: Worker | null = null;
let state: InferenceState = { status: 'idle', progress: 0, message: '' };
let nextId = 1;
const listeners = new Set<() => void>();
const pending = new Map<number, { resolve: (r: ClassificationResult) => void; reject: (e: Error) => void }>();

function setState(patch: Partial<InferenceState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

function ensureWorker(): Worker {
  if (worker) return worker;
  worker = new Worker(new URL('../../workers/inference.worker.ts', import.meta.url), { type: 'module' });
  worker.onmessage = (e: MessageEvent) => {
    const m = e.data;
    switch (m.type) {
      case 'PROGRESS':
        setState({ status: 'loading', progress: m.progress, message: m.status });
        break;
      case 'READY':
        try { localStorage.setItem(READY_FLAG, '1'); } catch { /* storage unavailable */ }
        setState({ status: 'ready', progress: 100, message: 'Offline AI ready', error: undefined });
        break;
      case 'ERROR':
        try { localStorage.removeItem(READY_FLAG); } catch { /* ignore */ }
        setState({ status: 'error', error: m.error, message: '' });
        break;
      case 'RESULT':
        pending.get(m.id)?.resolve(m.result);
        pending.delete(m.id);
        break;
      case 'CLASSIFY_ERROR':
        pending.get(m.id)?.reject(new Error(m.error));
        pending.delete(m.id);
        break;
    }
  };
  return worker;
}

/** Start (or resume) loading the model. Safe to call many times. */
export function loadModel() {
  if (state.status === 'loading' || state.status === 'ready') return;
  setState({ status: 'loading', progress: 0, message: 'Starting...', error: undefined });
  ensureWorker().postMessage({ type: 'LOAD_MODEL' });
}

/** True if the model was downloaded on this device before (so loading it will work offline). */
export function wasModelCached(): boolean {
  try { return localStorage.getItem(READY_FLAG) === '1'; } catch { return false; }
}

export function classifyImage(imageUrl: string, labels: CampusLabel[]): Promise<ClassificationResult> {
  if (state.status !== 'ready') return Promise.reject(new Error('AI model is not ready yet.'));
  const id = nextId++;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    ensureWorker().postMessage({ type: 'CLASSIFY', id, imageUrl, labels });
  });
}

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};
const getSnapshot = () => state;

export function useInference(): InferenceState {
  return useSyncExternalStore(subscribe, getSnapshot);
}
