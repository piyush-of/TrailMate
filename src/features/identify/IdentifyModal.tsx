import React, { useState, useEffect, useRef } from 'react';
import { Camera, AlertTriangle, CheckCircle2, RefreshCw, X, Sparkles, Image as ImageIcon } from 'lucide-react';
import { CampusLabel, ClassificationResult, DiscoveryCategory } from '../../types';

interface IdentifyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveDiscovery: (result: ClassificationResult, imageSrc: string) => void;
}

const SAMPLE_CAMPUS_PRESETS = [
  { label: 'Neem Tree', category: 'plant' as DiscoveryCategory, url: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=400&q=80' },
  { label: 'Rose-ringed Parakeet', category: 'bird' as DiscoveryCategory, url: 'https://images.unsplash.com/photo-1552728089-57bdde30beb3?auto=format&fit=crop&w=400&q=80' },
  { label: 'Hibiscus Flower', category: 'plant' as DiscoveryCategory, url: 'https://images.unsplash.com/photo-1596724816999-52e64ca61be8?auto=format&fit=crop&w=400&q=80' },
  { label: 'Palm Squirrel', category: 'other' as DiscoveryCategory, url: 'https://images.unsplash.com/photo-1507667522163-37fb401c115a?auto=format&fit=crop&w=400&q=80' },
];

export const IdentifyModal: React.FC<IdentifyModalProps> = ({ isOpen, onClose, onSaveDiscovery }) => {
  const [labels, setLabels] = useState<CampusLabel[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStatus, setProgressStatus] = useState<string | null>(null);
  const [result, setResult] = useState<ClassificationResult | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize Worker and Labels
  useEffect(() => {
    fetch('/labels/campus.json')
      .then((res) => res.json())
      .then((data: CampusLabel[]) => {
        setLabels(data);
      })
      .catch((err) => console.error('Failed to load campus labels', err));

    const worker = new Worker(new URL('../../workers/inference.worker.ts', import.meta.url), {
      type: 'module',
    });
    workerRef.current = worker;

    worker.onmessage = (e) => {
      const { type, status, progress, result: classificationResult, error } = e.data;
      if (type === 'PROGRESS') {
        setProgressStatus(`${status} (${progress}%)`);
      } else if (type === 'READY') {
        setProgressStatus(null);
      } else if (type === 'RESULT') {
        setResult(classificationResult);
        setIsProcessing(false);
        setProgressStatus(null);
      } else if (type === 'ERROR') {
        console.warn('Worker notice:', error);
      }
    };

    return () => {
      worker.terminate();
    };
  }, []);

  if (!isOpen) return null;

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const url = reader.result as string;
        setSelectedImage(url);
        runInference(url);
      };
      reader.readAsDataURL(file);
    }
  };

  const runInference = (imageUrl: string) => {
    setIsProcessing(true);
    setResult(null);
    setProgressStatus('Analyzing image locally on device...');

    if (workerRef.current) {
      workerRef.current.postMessage({
        type: 'CLASSIFY_IMAGE',
        payload: { imageUrl, labels },
      });
    }
  };

  const handleConfirm = () => {
    if (result && selectedImage) {
      onSaveDiscovery(result, selectedImage);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-end sm:items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md max-h-[92vh] overflow-y-auto p-5 shadow-2xl flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <Camera className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-bold text-white text-lg">On-Device Visual ID</h3>
              <p className="text-xs text-slate-400">Zero-shot CLIP in Web Worker · Offline</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hidden Camera File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleImageFile}
          className="hidden"
        />

        {/* Viewfinder / Image Preview */}
        {selectedImage ? (
          <div className="relative rounded-2xl overflow-hidden aspect-video bg-black flex items-center justify-center border border-slate-700">
            <img src={selectedImage} alt="Nature subject" className="w-full h-full object-cover" />
            {isProcessing && (
              <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center">
                <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mb-2" />
                <span className="text-xs font-semibold text-emerald-300">{progressStatus}</span>
              </div>
            )}
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-emerald-500/40 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-emerald-500 bg-emerald-950/10 text-center transition-all"
          >
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Camera className="w-7 h-7" />
            </div>
            <div>
              <div className="font-bold text-white text-base">Tap to Open Camera</div>
              <div className="text-xs text-slate-400 mt-1">Capture a leaf, tree bark, flower, bird or insect</div>
            </div>
          </div>
        )}

        {/* Quick Sample Presets (For Laptop or Testing) */}
        {!selectedImage && (
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <ImageIcon className="w-3 h-3 text-emerald-400" /> Or pick a campus test photo:
            </span>
            <div className="grid grid-cols-2 gap-2">
              {SAMPLE_CAMPUS_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    setSelectedImage(preset.url);
                    runInference(preset.url);
                  }}
                  className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-left flex items-center gap-2 border border-slate-700/60"
                >
                  <img src={preset.url} alt={preset.label} className="w-10 h-10 rounded-lg object-cover" />
                  <span className="text-xs font-bold text-slate-200 leading-tight">{preset.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Honest AI Classification Results */}
        {result && (
          <div className="flex flex-col gap-3">
            {result.isConfident ? (
              <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    {result.category}
                  </span>
                  <span className="text-xs font-bold text-emerald-300">
                    {Math.round(result.confidence * 100)}% Confidence
                  </span>
                </div>
                <div className="text-xl font-black text-white flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  {result.label}
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden mt-1">
                  <div
                    className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.round(result.confidence * 100)}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  Not sure — try another angle
                </div>
                <p className="text-xs text-amber-200/80">
                  Confidence was {Math.round(result.confidence * 100)}% (threshold is 35%). Try getting closer, capturing clearer lighting, or focusing on leaves or petals.
                </p>
              </div>
            )}

            {/* Alternatives */}
            {result.alternatives && result.alternatives.length > 0 && (
              <div className="text-xs text-slate-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                <span className="font-semibold text-slate-300">Other possibilities: </span>
                {result.alternatives.map((alt) => `${alt.label} (${Math.round(alt.confidence * 100)}%)`).join(', ')}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          {selectedImage && (
            <button
              type="button"
              onClick={() => {
                setSelectedImage(null);
                setResult(null);
              }}
              className="btn-secondary flex-1"
            >
              <RefreshCw className="w-4 h-4" /> Retake
            </button>
          )}

          {result && (
            <button
              type="button"
              onClick={handleConfirm}
              className="btn-primary flex-1"
            >
              <Sparkles className="w-5 h-5" /> Log Discovery
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
