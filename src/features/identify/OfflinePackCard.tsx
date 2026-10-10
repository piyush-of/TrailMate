import React from 'react';
import { Download, CheckCircle2, RefreshCw, CloudOff } from 'lucide-react';
import { loadModel, useInference } from './inferenceClient';

/** Lets the user download the AI model once, so quests work with no signal. */
export const OfflinePackCard: React.FC = () => {
  const model = useInference();
  const offline = !navigator.onLine;

  if (model.status === 'ready') {
    return (
      <div className="card-outdoor border-emerald-500/30 flex items-center gap-2 text-sm text-emerald-300">
        <CheckCircle2 className="w-5 h-5 shrink-0" /> Offline AI ready — works in airplane mode.
      </div>
    );
  }

  return (
    <div className="card-outdoor flex flex-col gap-2">
      <div className="flex items-center gap-2 text-sm font-bold text-slate-200">
        <CloudOff className="w-4 h-4 text-emerald-400" /> Offline AI pack
      </div>
      {model.status === 'loading' ? (
        <>
          <span className="text-xs text-slate-400">{model.message || 'Loading...'}</span>
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div className="bg-emerald-400 h-full transition-all" style={{ width: `${model.progress}%` }} />
          </div>
        </>
      ) : (
        <>
          <p className="text-xs text-slate-400">
            Download the open-weight vision model once (Wi-Fi recommended, a few hundred MB) so photo ID works with no signal.
          </p>
          {model.status === 'error' && <p className="text-xs text-amber-300">{model.error}</p>}
          <button type="button" onClick={loadModel} disabled={offline} className="btn-secondary disabled:opacity-40">
            {model.status === 'error' ? <RefreshCw className="w-4 h-4" /> : <Download className="w-4 h-4" />}
            {offline ? 'Connect to the internet to download' : model.status === 'error' ? 'Try again' : 'Download offline AI pack'}
          </button>
        </>
      )}
    </div>
  );
};
