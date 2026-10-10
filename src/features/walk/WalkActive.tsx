import React, { useState, useEffect, useRef } from 'react';
import { Camera, CheckSquare, Square, Flag, Lock, Eye, Compass, WifiOff, MapPinOff, Loader2 } from 'lucide-react';
import { QuestItem, Adventure, Discovery, ClassificationResult, GpsPoint } from '../../types';
import { isValidGpsPoint, haversineDistance, minMovementFor, calculateTrackDistance } from '../../lib/geo';
import { db, logDiscovery, saveQuestProgress } from '../../lib/db';
import { applyDiscoveryToQuest } from '../quest/questGenerator';
import { IdentifyModal } from '../identify/IdentifyModal';

interface WalkActiveProps {
  adventure: Adventure;
  onFinishWalk: (finishedAdventure: Adventure) => void;
  /** Display only (includes the demo "simulated airplane" toggle) */
  isOffline: boolean;
}

type GpsStatus = 'waiting' | 'tracking' | 'denied' | 'unavailable';

export const WalkActive: React.FC<WalkActiveProps> = ({ adventure, onFinishWalk, isOffline }) => {
  const [now, setNow] = useState(Date.now());
  const [distanceM, setDistanceM] = useState(0);
  const [phoneChecks, setPhoneChecks] = useState(adventure.phoneChecks || 0);
  const [questItems, setQuestItems] = useState<QuestItem[]>(adventure.quest);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [wakeLockActive, setWakeLockActive] = useState(false);
  const [recentDiscovery, setRecentDiscovery] = useState<{ d: Discovery; xp: number } | null>(null);
  const [gpsStatus, setGpsStatus] = useState<GpsStatus>('waiting');
  const [confirmFinish, setConfirmFinish] = useState(false);

  const prevPointRef = useRef<GpsPoint | null>(null);
  const distanceRef = useRef(0);
  const speedRejectsRef = useRef(0);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const cameraOpenRef = useRef(false);
  const cameraClosedAtRef = useRef(0);
  const hiddenAtRef = useRef<number | null>(null);
  const wentOnlineRef = useRef(navigator.onLine); // true if we were ever online during the walk
  const questLoadedRef = useRef(false);

  // Elapsed time derives from the start timestamp, so it stays correct even when the browser
  // throttles timers while the screen is off.
  const elapsedSeconds = Math.max(0, Math.floor((now - adventure.startedAt) / 1000));
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const timer = setInterval(tick, 1000);
    document.addEventListener('visibilitychange', tick);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', tick);
    };
  }, []);

  // Track real connectivity (not the demo toggle) for the "No Signal Explorer" badge
  useEffect(() => {
    const markOnline = () => (wentOnlineRef.current = true);
    window.addEventListener('online', markOnline);
    return () => window.removeEventListener('online', markOnline);
  }, []);

  // Restore distance when resuming an adventure after the app was closed
  useEffect(() => {
    let cancelled = false;
    db.gps_points
      .where('adventureId')
      .equals(adventure.id)
      .sortBy('t')
      .then((pts) => {
        if (cancelled || pts.length === 0) return;
        const restored = calculateTrackDistance(pts as GpsPoint[]);
        distanceRef.current = Math.max(distanceRef.current, restored);
        setDistanceM(distanceRef.current);
        prevPointRef.current = pts[pts.length - 1] as GpsPoint;
      });
    return () => {
      cancelled = true;
    };
  }, [adventure.id]);

  // Count a "screen look" only when the person returns after a real absence and not because of the camera
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAtRef.current = Date.now();
        return;
      }
      const hiddenFor = hiddenAtRef.current ? Date.now() - hiddenAtRef.current : 0;
      hiddenAtRef.current = null;
      const cameraRecently = cameraOpenRef.current || Date.now() - cameraClosedAtRef.current < 15000;
      if (!cameraRecently && hiddenFor >= 3000) {
        setPhoneChecks((c) => {
          db.adventures.update(adventure.id, { phoneChecks: c + 1 }).catch(() => {});
          return c + 1;
        });
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [adventure.id]);

  // Screen Wake Lock - the browser drops it whenever the page is hidden, so re-acquire on return
  useEffect(() => {
    const acquire = async () => {
      if (!('wakeLock' in navigator) || document.visibilityState !== 'visible') return;
      try {
        const lock = await navigator.wakeLock.request('screen');
        wakeLockRef.current = lock;
        setWakeLockActive(true);
        lock.addEventListener('release', () => setWakeLockActive(false));
      } catch {
        setWakeLockActive(false);
      }
    };
    acquire();
    const onVisible = () => document.visibilityState === 'visible' && acquire();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      wakeLockRef.current?.release().catch(() => {});
    };
  }, []);

  // GPS tracking with accuracy, teleport and jitter filters
  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setGpsStatus('unavailable');
      return;
    }
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setGpsStatus('tracking');
        const next = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          acc: pos.coords.accuracy,
          t: pos.timestamp,
        };
        const prev = prevPointRef.current;

        // 1. Accuracy filter (also accepts/rejects the very first fix)
        if (!isValidGpsPoint(null, next)) return;

        // 2. Speed filter. If a bad first fix poisoned the anchor, every later point would be
        //    rejected forever - so after 5 consecutive rejections we re-anchor on the new point.
        if (prev && !isValidGpsPoint(prev, next)) {
          speedRejectsRef.current += 1;
          if (speedRejectsRef.current < 5) return;
          speedRejectsRef.current = 0;
          const anchor: GpsPoint = { adventureId: adventure.id, ...next };
          prevPointRef.current = anchor;
          return;
        }
        speedRejectsRef.current = 0;

        // 3. Jitter filter: ignore tiny moves while standing still (anchor stays put)
        if (prev) {
          const delta = haversineDistance(prev.lat, prev.lng, next.lat, next.lng);
          if (delta < minMovementFor(next.acc)) return;
          distanceRef.current += delta;
          setDistanceM(Math.round(distanceRef.current));
        }

        const point: GpsPoint = { adventureId: adventure.id, ...next };
        prevPointRef.current = point;
        db.gps_points.add(point).catch(() => {});
      },
      (err) => setGpsStatus(err.code === err.PERMISSION_DENIED ? 'denied' : 'unavailable'),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [adventure.id]);

  // Persist quest progress (skip the initial mount)
  useEffect(() => {
    if (!questLoadedRef.current) {
      questLoadedRef.current = true;
      return;
    }
    saveQuestProgress(adventure.id, questItems).catch(() => {});
  }, [questItems, adventure.id]);

  const openCamera = () => {
    cameraOpenRef.current = true;
    setIsCameraOpen(true);
  };
  const closeCamera = () => {
    cameraOpenRef.current = false;
    cameraClosedAtRef.current = Date.now();
    setIsCameraOpen(false);
  };

  const handleSaveDiscovery = async (result: ClassificationResult, imageSrc: string) => {
    const { discovery, xp } = await logDiscovery({
      adventureId: adventure.id,
      label: result.label,
      category: result.category,
      confidence: result.confidence,
      thumb: imageSrc,
    });
    setRecentDiscovery({ d: discovery, xp });
    setQuestItems((prev) => applyDiscoveryToQuest(prev, { labelId: result.labelId, category: result.category }));
  };

  const toggleQuestItem = (id: string) => {
    setQuestItems((prev) => prev.map((q) => (q.id === id ? { ...q, done: !q.done } : q)));
  };

  const handleFinish = () => {
    // Two-step finish so a stray tap doesn't end the adventure
    if (!confirmFinish) {
      setConfirmFinish(true);
      setTimeout(() => setConfirmFinish(false), 4000);
      return;
    }
    onFinishWalk({
      ...adventure,
      endedAt: Date.now(),
      distanceM: Math.round(distanceRef.current),
      phoneChecks,
      quest: questItems,
      // "Offline for the whole adventure" - started offline and never came online. The demo toggle doesn't count.
      wasOffline: adventure.wasOffline && !wentOnlineRef.current,
    });
  };

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col gap-4 max-w-md mx-auto w-full pb-8">
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

        {gpsStatus === 'waiting' && (
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <Loader2 className="w-3 h-3 animate-spin" /> Waiting for GPS signal...
          </div>
        )}
        {(gpsStatus === 'denied' || gpsStatus === 'unavailable') && (
          <div className="text-xs bg-amber-950/40 border border-amber-500/30 text-amber-200 p-2.5 rounded-xl flex items-start gap-2">
            <MapPinOff className="w-4 h-4 shrink-0 mt-0.5" />
            {gpsStatus === 'denied'
              ? 'Location is blocked, so distance can\'t be tracked. Allow location for this site in your browser settings.'
              : 'Location is unavailable right now. Distance may be incomplete.'}
          </div>
        )}

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

        {recentDiscovery && (
          <div className="text-xs bg-emerald-500/10 border border-emerald-500/30 p-2.5 rounded-xl text-emerald-300 flex items-center justify-between">
            <span>
              Discovered: <strong>{recentDiscovery.d.label}</strong>{' '}
              {recentDiscovery.xp > 0 ? `(+${recentDiscovery.xp} XP)` : '(already found this walk, no XP)'}
            </span>
            <span className="text-[10px] font-bold uppercase">{recentDiscovery.d.category}</span>
          </div>
        )}
      </div>

      <div className="card-outdoor flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
            Adventure Checklist ({questItems.filter((q) => q.done).length}/{questItems.length})
          </h3>
          <span className="text-xs font-semibold text-emerald-400">+20 XP each</span>
        </div>
        <div className="flex flex-col gap-2">
          {questItems.map((item) => (
            <button
              type="button"
              key={item.id}
              onClick={() => toggleQuestItem(item.id)}
              aria-pressed={item.done}
              className={`p-3 rounded-xl border flex items-start gap-3 text-left transition-all ${
                item.done
                  ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200 line-through opacity-85'
                  : 'bg-slate-900 border-slate-800 text-slate-200 hover:border-slate-700'
              }`}
            >
              <span className="mt-0.5 text-emerald-400 shrink-0">
                {item.done ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5 text-slate-500" />}
              </span>
              <span className="text-sm font-medium leading-snug">{item.text}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 mt-2">
        <button type="button" onClick={openCamera} className="btn-primary">
          <Camera className="w-6 h-6" /> Identify Nature
        </button>
        <button
          type="button"
          onClick={handleFinish}
          className={`btn-secondary min-h-[50px] ${
            confirmFinish ? 'bg-red-600 text-white border-red-400 hover:bg-red-500' : 'border-red-500/30 text-red-300 hover:bg-red-950/30'
          }`}
        >
          <Flag className="w-4 h-4" /> {confirmFinish ? 'Tap again to finish' : 'Finish Adventure & Recap'}
        </button>
      </div>

      <IdentifyModal isOpen={isCameraOpen} onClose={closeCamera} onSaveDiscovery={handleSaveDiscovery} />
    </div>
  );
};
