import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, logXpEvent } from './lib/db';
import { Adventure, Mood, Difficulty, PlannedMinutes } from './types';
import { generateQuest } from './features/quest/questGenerator';
import { deriveTotalXp, deriveLevel, evaluateBadges } from './features/rewards/xpEngine';
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

  // Reactive DB queries
  const adventures = useLiveQuery(() => db.adventures.toArray(), []) || [];
  const discoveries = useLiveQuery(() => db.discoveries.toArray(), []) || [];
  const xpEvents = useLiveQuery(() => db.xp_events.toArray(), []) || [];
  const badgeUnlocks = useLiveQuery(() => db.badge_unlocks.toArray(), []) || [];

  const totalXp = deriveTotalXp(xpEvents);
  const levelInfo = deriveLevel(totalXp);

  // Start a new adventure
  const handleStartQuest = async (mood: Mood, difficulty: Difficulty, minutes: PlannedMinutes) => {
    const questItems = generateQuest(mood, difficulty, minutes);
    const newAdventure: Adventure = {
      id: 'adv_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now(),
      startedAt: Date.now(),
      mood,
      difficulty,
      plannedMinutes: minutes,
      distanceM: 0,
      wasOffline: isEffectiveOffline,
      phoneChecks: 0,
      quest: questItems,
    };

    await db.adventures.add(newAdventure);
    await logXpEvent(newAdventure.id, 'start_adventure', 10);

    setActiveAdventure(newAdventure);
    setCurrentView('walk');
  };

  // Finish Walk
  const handleFinishWalk = async (updated: Adventure) => {
    // 1. Calculate XP for completed challenges and distance
    let earnedThisWalk = 10; // Starting XP
    const completedChallenges = updated.quest.filter((q) => q.done).length;
    const challengeXp = completedChallenges * 20;
    earnedThisWalk += challengeXp;

    // +50 XP for finishing quest
    earnedThisWalk += 50;
    await logXpEvent(updated.id, 'finish_quest', 50);

    // Distance XP (every 500m -> +10 XP)
    const distanceSteps = Math.floor(updated.distanceM / 500);
    if (distanceSteps > 0) {
      const distanceXp = Math.min(200, distanceSteps * 10);
      earnedThisWalk += distanceXp;
      await logXpEvent(updated.id, 'distance_steps', distanceXp);
    }

    // Time outdoors
    const durationMinutes = Math.round(((updated.endedAt || Date.now()) - updated.startedAt) / 60000);
    if (durationMinutes >= 60) {
      earnedThisWalk += 75;
      await logXpEvent(updated.id, 'time_60m', 75);
    } else if (durationMinutes >= 30) {
      earnedThisWalk += 30;
      await logXpEvent(updated.id, 'time_30m', 30);
    }

    await db.adventures.put(updated);

    // Evaluate badges
    const existingIds = badgeUnlocks.map((b) => b.badgeId);
    const newBadges = evaluateBadges([...adventures, updated], discoveries, existingIds);

    for (const bId of newBadges) {
      await db.badge_unlocks.add({
        badgeId: bId,
        at: Date.now(),
        adventureId: updated.id,
      });
    }

    setRecentXpEarned(earnedThisWalk);
    setRecentBadgesUnlocked(newBadges);
    setFinishedAdventure(updated);
    setActiveAdventure(null);
    setCurrentView('recap');
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
            discoveries={discoveries.filter((d) => d.adventureId === finishedAdventure.id)}
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
