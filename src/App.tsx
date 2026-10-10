import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, logXpEvent, logXpEvents, uid, getResumableAdventure } from './lib/db';
import { Adventure, Mood, Difficulty, PlannedMinutes } from './types';
import { generateQuest } from './features/quest/questGenerator';
import { deriveTotalXp, deriveLevel, evaluateBadges, computeFinishXpEvents, sumXpForAdventure } from './features/rewards/xpEngine';
import { loadModel, wasModelCached } from './features/identify/inferenceClient';
import { Navbar } from './app/Navbar';
import { QuestSetup } from './features/quest/QuestSetup';
import { WalkActive } from './features/walk/WalkActive';
import { RecapView } from './features/journal/RecapView';
import { RewardsView } from './features/rewards/RewardsView';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'setup' | 'walk' | 'recap' | 'rewards'>('setup');
  const [activeAdventure, setActiveAdventure] = useState<Adventure | null>(null);
  const [finishedAdventure, setFinishedAdventure] = useState<Adventure | null>(null);
  const [recentXpEarned, setRecentXpEarned] = useState(0);
  const [recentBadgesUnlocked, setRecentBadgesUnlocked] = useState<string[]>([]);
  const [isSimulatedOffline, setIsSimulatedOffline] = useState(false);
  const [systemOffline, setSystemOffline] = useState(!navigator.onLine);

  // Monitor network offline status
  useEffect(() => {
    const handleOnline = () => setSystemOffline(false);
    const handleOffline = () => setSystemOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const isEffectiveOffline = systemOffline || isSimulatedOffline;
  const isStartingRef = useRef(false);
  const isFinishingRef = useRef(false);

  // On launch: load the AI model from the browser cache if it was downloaded before,
  // and resume an unfinished adventure (the OS may have killed the PWA while walking).
  useEffect(() => {
    if (wasModelCached()) loadModel();
    getResumableAdventure().then((adv) => {
      if (adv) {
        setActiveAdventure(adv);
        setCurrentView('walk');
      }
    });
  }, []);

  // Reactive DB queries
  const adventures = useLiveQuery(() => db.adventures.toArray(), []) || [];
  const discoveries = useLiveQuery(() => db.discoveries.toArray(), []) || [];
  const xpEvents = useLiveQuery(() => db.xp_events.toArray(), []) || [];
  const badgeUnlocks = useLiveQuery(() => db.badge_unlocks.toArray(), []) || [];

  const finishedDiscoveries = useMemo(
    () => discoveries.filter((d) => d.adventureId === finishedAdventure?.id),
    [discoveries, finishedAdventure]
  );

  const totalXp = deriveTotalXp(xpEvents);
  const levelInfo = deriveLevel(totalXp);

  // Start a new adventure
  const handleStartQuest = async (mood: Mood, difficulty: Difficulty, minutes: PlannedMinutes) => {
    if (isStartingRef.current) return;
    isStartingRef.current = true;
    try {
      const newAdventure: Adventure = {
        id: uid('adv'),
        startedAt: Date.now(),
        mood,
        difficulty,
        plannedMinutes: minutes,
        distanceM: 0,
        // Real connectivity only - the demo "simulate airplane" toggle must not earn the offline badge
        wasOffline: !navigator.onLine,
        phoneChecks: 0,
        quest: generateQuest(mood, difficulty, minutes),
      };

      await db.adventures.add(newAdventure);
      await logXpEvent(newAdventure.id, 'start_adventure', 10);

      setActiveAdventure(newAdventure);
      setCurrentView('walk');
    } finally {
      isStartingRef.current = false;
    }
  };

  // Finish walk: everything that earns XP goes through the ledger so levels and the recap always agree
  const handleFinishWalk = async (updated: Adventure) => {
    if (isFinishingRef.current) return;
    isFinishingRef.current = true;
    try {
      const durationMinutes = Math.round(((updated.endedAt || Date.now()) - updated.startedAt) / 60000);
      await db.adventures.put(updated);
      await logXpEvents(updated.id, computeFinishXpEvents({ quest: updated.quest, distanceM: updated.distanceM, durationMinutes }));

      // Read fresh data from the DB (React state may be one render behind)
      const [allAdventures, allDiscoveries, allBadges, allXp] = await Promise.all([
        db.adventures.toArray(),
        db.discoveries.toArray(),
        db.badge_unlocks.toArray(),
        db.xp_events.toArray(),
      ]);

      const newBadges = evaluateBadges(allAdventures, allDiscoveries, allBadges.map((b) => b.badgeId));
      for (const bId of newBadges) {
        await db.badge_unlocks.put({ badgeId: bId, at: Date.now(), adventureId: updated.id });
      }

      setRecentXpEarned(sumXpForAdventure(allXp, updated.id));
      setRecentBadgesUnlocked(newBadges);
      setFinishedAdventure(updated);
      setActiveAdventure(null);
      setCurrentView('recap');
    } finally {
      isFinishingRef.current = false;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      <Navbar
        currentView={currentView}
        onNavigate={(view) => setCurrentView(view)}
        levelInfo={levelInfo}
        isOffline={isEffectiveOffline}
        onToggleSimulatedOffline={() => setIsSimulatedOffline((prev) => !prev)}
        isSimulatedOffline={isSimulatedOffline}
      />

      <main className="flex-1 p-4 flex flex-col items-center">
        {currentView === 'setup' && (
          <QuestSetup onStartQuest={handleStartQuest} isOffline={isEffectiveOffline} />
        )}

        {currentView === 'walk' && activeAdventure && (
          <WalkActive
            adventure={activeAdventure}
            onFinishWalk={handleFinishWalk}
            isOffline={isEffectiveOffline}
          />
        )}

        {currentView === 'recap' && finishedAdventure && (
          <RecapView
            adventure={finishedAdventure}
            discoveries={finishedDiscoveries}
            unlockedBadgeIds={recentBadgesUnlocked}
            xpEarned={recentXpEarned}
            onGoHome={() => setCurrentView('rewards')}
          />
        )}

        {currentView === 'rewards' && (
          <RewardsView
            levelInfo={levelInfo}
            adventures={adventures}
            discoveries={discoveries}
            badgeUnlocks={badgeUnlocks}
            onStartNewQuest={() => setCurrentView('setup')}
          />
        )}
      </main>
    </div>
  );
};
export default App;
