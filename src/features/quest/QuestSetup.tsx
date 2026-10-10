import React, { useState } from 'react';
import { Mood, Difficulty, PlannedMinutes } from '../../types';
import { Compass, Sparkles, Flame, Clock, ShieldCheck, Sun } from 'lucide-react';
import { OfflinePackCard } from '../identify/OfflinePackCard';

interface QuestSetupProps {
  onStartQuest: (mood: Mood, difficulty: Difficulty, minutes: PlannedMinutes) => void;
  isOffline: boolean;
}

const MOODS: Array<{ id: Mood; label: string; icon: string; desc: string }> = [
  { id: 'relax', label: 'Relax', icon: '🍃', desc: 'Breathe, observe canopy & calm down' },
  { id: 'adventure', label: 'Adventure', icon: '🧭', desc: 'Explore hidden paths & wildlife' },
  { id: 'fitness', label: 'Fitness', icon: '⚡', desc: 'Fast pace, stairs & endurance' },
  { id: 'photo', label: 'Photo Hunt', icon: '📸', desc: 'Macro flora & lighting angles' },
  { id: 'social', label: 'Social Walk', icon: '👥', desc: 'Chat & stroll with classmates' },
];

export const QuestSetup: React.FC<QuestSetupProps> = ({ onStartQuest, isOffline }) => {
  const [mood, setMood] = useState<Mood>('relax');
  const [minutes, setMinutes] = useState<PlannedMinutes>(15);
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');

  return (
    <div className="flex flex-col gap-5 max-w-md mx-auto w-full pb-8">
      {/* Hero Banner */}
      <div className="card-outdoor border-emerald-500/30 bg-gradient-to-b from-emerald-950/40 to-slate-900">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold tracking-wider uppercase text-emerald-400 flex items-center gap-1.5">
            <Compass className="w-4 h-4" /> Outdoor Generator
          </span>
          {isOffline && (
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
              Airplane Mode Ready
            </span>
          )}
        </div>
        <h2 className="text-2xl font-black text-white tracking-tight">Step Away from Screens</h2>
        <p className="text-sm text-slate-300 mt-1">
          Pick your time and vibe. We'll generate a real-world outdoor quest for your campus walk.
        </p>
      </div>

      <OfflinePackCard />

      {/* Duration Selector */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-emerald-400" /> Planned Time
        </label>
        <div className="grid grid-cols-3 gap-2">
          {([15, 30, 60] as PlannedMinutes[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMinutes(m)}
              className={`min-h-[52px] rounded-xl font-bold text-base transition-all ${
                minutes === m
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25 scale-[1.02]'
                  : 'bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700'
              }`}
            >
              {m} min
            </button>
          ))}
        </div>
      </div>

      {/* Mood Selector */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Walk Mood
        </label>
        <div className="grid grid-cols-1 gap-2">
          {MOODS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setMood(item.id)}
              className={`p-3.5 rounded-xl text-left flex items-center gap-3.5 transition-all ${
                mood === item.id
                  ? 'bg-emerald-500/15 border-2 border-emerald-500 text-white'
                  : 'bg-slate-900/80 border border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <span className="text-2xl p-2 bg-slate-950/60 rounded-xl">{item.icon}</span>
              <div className="flex-1">
                <div className={`font-bold text-sm ${mood === item.id ? 'text-emerald-300' : 'text-slate-200'}`}>
                  {item.label}
                </div>
                <div className="text-xs text-slate-400">{item.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Difficulty Selector */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Flame className="w-3.5 h-3.5 text-emerald-400" /> Intensity
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDifficulty(d)}
              className={`min-h-[46px] rounded-xl font-bold capitalize text-sm transition-all ${
                difficulty === d
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-900 text-slate-400 border border-slate-800'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Outdoor Guidance Pill */}
      <div className="flex items-start gap-2.5 p-3.5 bg-slate-900/60 border border-slate-800/80 rounded-xl text-xs text-slate-400">
        <Sun className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <span>
          <strong>Pro-tip:</strong> Keep phone in pocket while walking. Looking at the screen unnecessarily reduces your Touch Grass Score!
        </span>
      </div>

      {/* Start Button */}
      <button
        type="button"
        onClick={() => onStartQuest(mood, difficulty, minutes)}
        className="btn-primary mt-2"
      >
        <ShieldCheck className="w-5 h-5" /> Start Outdoor Quest
      </button>
    </div>
  );
};
