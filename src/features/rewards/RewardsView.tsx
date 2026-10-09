import React from 'react';
import { Award, Zap, Compass, Lock, CheckCircle2, Footprints } from 'lucide-react';
import { LevelInfo, Adventure, Discovery, BadgeUnlock, BadgeDefinition } from '../../types';
import { BADGE_DEFINITIONS } from './xpEngine';

interface RewardsViewProps {
  levelInfo: LevelInfo;
  adventures: Adventure[];
  discoveries: Discovery[];
  badgeUnlocks: BadgeUnlock[];
  onStartNewQuest: () => void;
}

export const RewardsView: React.FC<RewardsViewProps> = ({
  levelInfo,
  adventures,
  discoveries,
  badgeUnlocks,
  onStartNewQuest,
}) => {
  const unlockedIds = new Set(badgeUnlocks.map((b) => b.badgeId));
  const completedCount = adventures.filter((a) => a.endedAt).length;

  return (
    <div className="flex flex-col gap-5 max-w-md mx-auto w-full pb-10">
      {/* Level Progress Hero */}
      <div className="card-outdoor border-emerald-500/30 bg-gradient-to-b from-emerald-950/30 to-slate-900">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
            <Zap className="w-4 h-4" /> Explorer Level {levelInfo.level}
          </span>
          <span className="text-xs font-bold text-slate-300">
            {levelInfo.currentXp} XP Total
          </span>
        </div>

        <h2 className="text-2xl font-black text-white">{levelInfo.title}</h2>

        <div className="mt-3 flex flex-col gap-1.5">
          <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-emerald-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${levelInfo.progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-slate-400 font-medium">
            <span>Current: {levelInfo.currentXp} XP</span>
            <span>Next: {levelInfo.nextLevelXp} XP</span>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-semibold">
          <span className="flex items-center gap-1.5 text-slate-300">
            <Footprints className="w-3.5 h-3.5 text-emerald-400" /> Completed Quests
          </span>
          <span className="text-white font-bold">{completedCount}</span>
        </div>
      </div>

      {/* Badges Gallery (6 MVP Badges) */}
      <div className="card-outdoor flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-emerald-400" /> Badges ({unlockedIds.size}/6)
          </h3>
          <span className="text-xs text-slate-400">Offline & On-Trail</span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {Object.values(BADGE_DEFINITIONS).map((badge: BadgeDefinition) => {
            const isUnlocked = unlockedIds.has(badge.id);
            return (
              <div
                key={badge.id}
                className={`p-3 rounded-2xl border flex flex-col gap-1 transition-all ${
                  isUnlocked
                    ? 'bg-emerald-950/20 border-emerald-500/40 text-white'
                    : 'bg-slate-900/60 border-slate-800 text-slate-500'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{badge.icon}</span>
                  {isUnlocked ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Lock className="w-3.5 h-3.5 text-slate-600" />
                  )}
                </div>
                <div className="font-bold text-sm mt-1 text-slate-200">{badge.title}</div>
                <div className="text-[11px] leading-tight text-slate-400">{badge.description}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Discoveries Feed */}
      <div className="card-outdoor flex flex-col gap-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
          <span>Field Discoveries ({discoveries.length})</span>
          <span className="text-emerald-400 font-normal">Identified On-Device</span>
        </h3>

        {discoveries.length === 0 ? (
          <div className="text-xs text-slate-400 italic py-2 text-center">
            No nature discoveries recorded yet. Take a walk and point your camera at leaves or birds!
          </div>
        ) : (
          <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
            {discoveries.slice(-5).reverse().map((d) => (
              <div key={d.id} className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center gap-3">
                {d.thumb ? (
                  <img src={d.thumb} alt={d.label} className="w-10 h-10 rounded-lg object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-emerald-950/50 flex items-center justify-center text-emerald-400 font-bold text-xs">
                    🌱
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-white truncate">{d.label}</div>
                  <div className="text-[11px] text-slate-400 capitalize">
                    {d.category} · {Math.round(d.confidence * 100)}% conf
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-400 shrink-0">
                  +{d.category === 'bird' ? 20 : 15} XP
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Start Button */}
      <button
        type="button"
        onClick={onStartNewQuest}
        className="btn-primary mt-2"
      >
        <Compass className="w-5 h-5" /> Start New Quest
      </button>
    </div>
  );
};
