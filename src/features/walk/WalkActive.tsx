import React, { useState, useEffect, useRef } from 'react';
import { Camera, CheckSquare, Square, Flag, Lock, Eye, Compass, WifiOff } from 'lucide-react';
import { QuestItem, Adventure, Discovery, ClassificationResult, GpsPoint } from '../../types';
import { isValidGpsPoint, haversineDistance } from '../../lib/geo';
import { db, logDiscovery } from '../../lib/db';
import { IdentifyModal } from '../identify/IdentifyModal';

interface WalkActiveProps {
  adventure: Adventure;
  onFinishWalk: (finishedAdventure: Adventure) => void;
  isOffline: boolean;
}

export const WalkActive: React.FC<WalkActiveProps> = ({ adventure, onFinishWalk, isOffline }) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [distanceM, setDistanceM] = useState(0);
  const [phoneChecks, setPhoneChecks] = useState(adventure.phoneChecks || 0);
  const [questItems, setQuestItems] = useState<QuestItem[]>(adventure.quest);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [wakeLockActive, setWakeLockActive] = useState(false);
  const [recentDiscovery, setRecentDiscovery] = useState<Discovery | null>(null);

  const prevPointRef = useRef<GpsPoint | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  // 1. Elapsed Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. Phone Check Counter (Screen sleep / tab switch detection)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setPhoneChecks((c) => c + 1);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // 3. Screen Wake Lock (keep screen active while tracking)
  useEffect(() => {
    const requestWakeLock = async () => {
      if ('wakeLock' in navigator) {
        try {
          wakeLockRef.current = await navigator.wakeLock.request('screen');
          setWakeLockActive(true);
        } catch {
          // Wake lock rejected or unsupported
        }
      }
    };
    requestWakeLock();

    return () => {
      wakeLockRef.current?.release();
    };
  }, []);

  // 4. Geolocation Tracking with Jitter Filter
  useEffect(() => {
    if (!('geolocation' in navigator)) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const next = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          acc: pos.coords.accuracy,
          t: pos.timestamp,
        };

        if (isValidGpsPoint(prevPointRef.current, next)) {
          if (prevPointRef.current) {
            const delta = haversineDistance(
              prevPointRef.current.lat,
              prevPointRef.current.lng,
              next.lat,
              next.lng
            );
            setDistanceM((d) => d + Math.round(delta));
          }

          const point: GpsPoint = { adventureId: adventure.id, ...next };
          prevPointRef.current = point;
          db.gps_points.add(point).catch(() => {});
        }
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [adventure.id]);

  // Handle Discovery from Camera
  const handleSaveDiscovery = async (result: ClassificationResult, imageSrc: string) => {
    const disc = await logDiscovery({
      adventureId: adventure.id,
      label: result.label,
      category: result.category,
      confidence: result.confidence,
      thumb: imageSrc,
    });

    setRecentDiscovery(disc);

    // Auto-check matching quest items
    setQuestItems((prev) =>
      prev.map((item) => {
        if (
          !item.done &&
          ((item.type === 'photo' || item.type === 'discover') &&
            (item.targetCategory === result.category || item.text.toLowerCase().includes(result.label.toLowerCase())))
        ) {
          return { ...item, done: true };
        }
        return item;
      })
    );
  };

  const toggleQuestItem = (id: string) => {
    setQuestItems((prev) =>
      prev.map((q) => (q.id === id ? { ...q, done: !q.done } : q))
    );
  };

  const handleFinish = () => {
    const updated: Adventure = {
      ...adventure,
      endedAt: Date.now(),
      distanceM,
      phoneChecks,
      quest: questItems,
      wasOffline: isOffline || adventure.wasOffline,
    };
    onFinishWalk(updated);
  };

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col gap-4 max-w-md mx-auto w-full pb-8">
      {/* High-Contrast Outdoor HUD */}
      <div className="card-outdoor border-emerald-500/40 bg-slate-900 flex flex-col gap-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-400">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <Compass className="w-4 h-4 animate-pulse" /> Active Trail
          </span>
          <div className="flex items-center gap-2">
            {wakeLockActive && (
              <span className="flex items-center gap-1 text-slate-400 text-[10px]">
                <Lock className="w-3 h-3 text-emerald-400" /> Screen Active
              </span>
            )}
            {isOffline && (
              <span className="flex items-center gap-1 text-emerald-400 text-[10px] bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <WifiOff className="w-3 h-3" /> Airplane Mode
              </span>
            )}
          </div>
        </div>

        {/* Big Metrics */}
        <div className="grid grid-cols-3 gap-2 text-center py-2 border-y border-slate-800">
          <div>
            <div className="text-2xl font-black text-white">{formatTimer(elapsedSeconds)}</div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Time</div>
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-400">
              {distanceM >= 1000 ? `${(distanceM / 1000).toFixed(2)} km` : `${distanceM} m`}
            </div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Distance</div>
          </div>
          <div>
            <div className="text-2xl font-black text-amber-400 flex items-center justify-center gap-1">
              <Eye className="w-4 h-4" /> {phoneChecks}
            </div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Screen Looks</div>
          </div>
        </div>

        {/* Recent Discovery Toast */}
        {recentDiscovery && (
          <div className="text-xs bg-emerald-500/10 border border-emerald-500/30 p-2.5 rounded-xl text-emerald-300 flex items-center justify-between">
            <span>Discovered: <strong>{recentDiscovery.label}</strong> (+{recentDiscovery.category === 'bird' ? 20 : 15} XP)</span>
            <span className="text-[10px] font-bold uppercase">{recentDiscovery.category}</span>
          </div>
        )}
      </div>

      {/* Quest Checklist */}
      <div className="card-outdoor flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
            Adventure Checklist ({questItems.filter((q) => q.done).length}/{questItems.length})
          </h3>
          <span className="text-xs font-semibold text-emerald-400">+20 XP each</span>
        </div>

        <div className="flex flex-col gap-2">
          {questItems.map((item) => (
            <div
              key={item.id}
              onClick={() => toggleQuestItem(item.id)}
              className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                item.done
                  ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200 line-through opacity-85'
                  : 'bg-slate-900 border-slate-800 text-slate-200 hover:border-slate-700'
              }`}
            >
              <button type="button" className="mt-0.5 text-emerald-400 shrink-0">
                {item.done ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5 text-slate-500" />}
              </button>
              <span className="text-sm font-medium leading-snug">{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex flex-col gap-3 mt-2">
        <button
          type="button"
          onClick={() => setIsCameraOpen(true)}
          className="btn-primary"
        >
          <Camera className="w-6 h-6" /> Identify Nature
        </button>

        <button
          type="button"
          onClick={handleFinish}
          className="btn-secondary min-h-[50px] border-red-500/30 text-red-300 hover:bg-red-950/30"
        >
          <Flag className="w-4 h-4 text-red-400" /> Finish Adventure & Recap
        </button>
      </div>

      {/* Modal */}
      <IdentifyModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onSaveDiscovery={handleSaveDiscovery}
      />
    </div>
  );
};
