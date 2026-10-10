import React, { useState, useEffect, useRef } from 'react';
import { Camera, AlertTriangle, CheckCircle2, RefreshCw, X, Sparkles, Image as ImageIcon, Download } from 'lucide-react';
import { CampusLabel, ClassificationResult } from '../../types';
import { fileToSmallDataUrl } from '../../lib/image';
import { classifyImage, loadModel, useInference } from './inferenceClient';

interface IdentifyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveDiscovery: (result: ClassificationResult, imageSrc: string) => void;
}

export const IdentifyModal: React.FC<IdentifyModalProps> = ({ isOpen, onClose, onSaveDiscovery }) => {
  const [labels, setLabels] = useState<CampusLabel[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ClassificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const analyzedRef = useRef<string | null>(null);
  const model = useInference();

  // Labels are cached by the service worker, so this also works offline.
  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}labels/campus.json`)
      .then((res) => res.json())
      .then((data: CampusLabel[]) => setLabels(data))
      .catch(() => setError('Could not load the campus label list.'));
  }, []);

  // Reset state each time the modal is closed
  useEffect(() => {
    if (!isOpen) {
      setSelectedImage(null);
      setResult(null);
      setError(null);
      setIsProcessing(false);
      analyzedRef.current = null;
    }
  }, [isOpen]);

  // Analyse as soon as we have both an image and a ready model (also covers "photo taken while model loads")
  useEffect(() => {
    if (!selectedImage || model.status !== 'ready' || labels.length === 0) return;
    if (analyzedRef.current === selectedImage) return;
    analyzedRef.current = selectedImage;
    setIsProcessing(true);
    setResult(null);
    setError(null);
    classifyImage(selectedImage, labels)
      .then(setResult)
      .catch((e: Error) => setError(e.message))
      .finally(() => setIsProcessing(false));
  }, [selectedImage, model.status, labels]);

  if (!isOpen) return null;

  const handleImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow picking the same file again
    if (!file) return;
    try {
      setError(null);
      setSelectedImage(await fileToSmallDataUrl(file));
    } catch {
      setError('Could not read that photo. Please try again.');
    }
  };

  const handleConfirm = () => {
    if (result?.isConfident && selectedImage) {
      onSaveDiscovery(result, selectedImage);
      onClose();
    }
  };

  const offline = !navigator.onLine;
  const waitingForModel = model.status !== 'ready';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-end sm:items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md max-h-[92vh] overflow-y-auto p-5 shadow-2xl flex flex-col gap-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <Camera className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-bold text-white text-lg">On-Device Visual ID</h3>
              <p className="text-xs text-slate-400">Open-weight CLIP · runs in your browser</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" className="p-2 text-slate-400 hover:text-white rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Model status */}
        {waitingForModel && (
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 flex flex-col gap-2">
            {model.status === 'loading' && (
              <>
                <span>{model.message || 'Loading AI model...'}</span>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div className="bg-emerald-400 h-full" style={{ width: `${model.progress}%` }} />
                </div>
              </>
            )}
            {model.status === 'idle' && (
              <>
                <span>
                  {offline
                    ? 'The AI model is not on this device yet. Connect to the internet once to download it.'
                    : 'The AI model has not been downloaded yet.'}
                </span>
                <button type="button" disabled={offline} onClick={loadModel} className="btn-secondary disabled:opacity-40">
                  <Download className="w-4 h-4" /> Download offline AI pack
                </button>
              </>
            )}
            {model.status === 'error' && (
              <>
                <span className="text-amber-300">{model.error}</span>
                <button type="button" onClick={loadModel} className="btn-secondary">
                  <RefreshCw className="w-4 h-4" /> Try again
                </button>
              </>
            )}
          </div>
        )}

        <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleImageFile} className="hidden" />
        <input ref={galleryInputRef} type="file" accept="image/*" onChange={handleImageFile} className="hidden" />

        {selectedImage ? (
          <div className="relative rounded-2xl overflow-hidden aspect-video bg-black flex items-center justify-center border border-slate-700">
            <img src={selectedImage} alt="Nature subject" className="w-full h-full object-cover" />
            {(isProcessing || (waitingForModel && model.status === 'loading')) && (
              <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center">
                <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mb-2" />
                <span className="text-xs font-semibold text-emerald-300">
                  {isProcessing ? 'Analyzing on your device...' : 'Waiting for AI model...'}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="border-2 border-dashed border-emerald-500/40 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 hover:border-emerald-500 bg-emerald-950/10 text-center transition-all"
            >
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Camera className="w-7 h-7" />
              </div>
              <div>
                <div className="font-bold text-white text-base">Tap to Open Camera</div>
                <div className="text-xs text-slate-400 mt-1">Capture a leaf, tree, flower, bird or insect</div>
              </div>
            </button>
            <button type="button" onClick={() => galleryInputRef.current?.click()} className="btn-secondary">
              <ImageIcon className="w-4 h-4 text-emerald-400" /> Choose from gallery
            </button>
          </div>
        )}

        {error && <div className="text-xs text-amber-300 bg-amber-950/40 border border-amber-500/30 p-3 rounded-xl">{error}</div>}

        {result && (
          <div className="flex flex-col gap-3">
            {result.isConfident ? (
              <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    {result.category}
                  </span>
                  <span className="text-xs font-bold text-emerald-300">{Math.round(result.confidence * 100)}% confidence</span>
                </div>
                <div className="text-xl font-black text-white flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  {result.label}
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden mt-1">
                  <div className="bg-emerald-400 h-full rounded-full transition-all duration-500" style={{ width: `${Math.round(result.confidence * 100)}%` }} />
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  {result.reason === 'not_nature' ? "That doesn't look like a nature subject" : 'Not sure — try another angle'}
                </div>
                <p className="text-xs text-amber-200/80">
                  {result.reason === 'not_nature'
                    ? 'Point the camera at a plant, tree, bird or insect.'
                    : `Best guess was only ${Math.round(result.confidence * 100)}% (needs 35%). Get closer, use clearer light, or focus on leaves or petals.`}
                </p>
              </div>
            )}
            {result.alternatives && result.alternatives.length > 0 && (
              <div className="text-xs text-slate-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                <span className="font-semibold text-slate-300">Other possibilities: </span>
                {result.alternatives.map((alt) => `${alt.label} (${Math.round(alt.confidence * 100)}%)`).join(', ')}
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          {selectedImage && (
            <button
              type="button"
              onClick={() => {
                setSelectedImage(null);
                setResult(null);
                setError(null);
                analyzedRef.current = null;
              }}
              className="btn-secondary flex-1"
            >
              <RefreshCw className="w-4 h-4" /> Retake
            </button>
          )}
          {result?.isConfident && (
            <button type="button" onClick={handleConfirm} className="btn-primary flex-1">
              <Sparkles className="w-5 h-5" /> Log Discovery
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
