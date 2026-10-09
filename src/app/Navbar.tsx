import React from 'react';
import { Leaf, Award, WifiOff, Wifi } from 'lucide-react';
import { LevelInfo } from '../types';

interface NavbarProps {
  currentView: 'setup' | 'walk' | 'recap' | 'rewards';
  onNavigate: (view: 'setup' | 'rewards') => void;
  levelInfo: LevelInfo;
  isOffline: boolean;
  onToggleSimulatedOffline: () => void;
  isSimulatedOffline: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  levelInfo,
  isOffline,
  onToggleSimulatedOffline,
  isSimulatedOffline,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-3">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* Brand */}
        <div
          onClick={() => currentView !== 'walk' && onNavigate('setup')}
          className={`flex items-center gap-2 ${currentView !== 'walk' ? 'cursor-pointer' : ''}`}
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-green-400 flex items-center justify-center text-slate-950 shadow-md shadow-emerald-500/20">
            <Leaf className="w-4 h-4 fill-slate-950" />
          </div>
          <div>
            <h1 className="font-black text-white text-base tracking-tight leading-none">TrailMate</h1>
            <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">Touch Grass AI</span>
          </div>
        </div>

        {/* Right Action & Status */}
        <div className="flex items-center gap-2">
          {/* Offline / Airplane Mode Badge & Simulator Toggle */}
          <button
            type="button"
            title="Toggle offline / airplane mode simulation"
            onClick={onToggleSimulatedOffline}
            className={`flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full border transition-all ${
              isOffline
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm shadow-emerald-500/20'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
            }`}
          >
            {isOffline ? (
              <>
                <WifiOff className="w-3 h-3 text-emerald-400" />
                <span>Airplane</span>
              </>
            ) : (
              <>
                <Wifi className="w-3 h-3 text-slate-500" />
                <span>Online</span>
              </>
            )}
            {isSimulatedOffline && <span className="text-[9px] text-amber-400">(sim)</span>}
          </button>

          {/* Level Pill */}
          {currentView !== 'walk' && (
            <button
              type="button"
              onClick={() => onNavigate(currentView === 'rewards' ? 'setup' : 'rewards')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border transition-all ${
                currentView === 'rewards'
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                  : 'bg-slate-900 text-slate-200 border-slate-800 hover:border-slate-700'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Lv.{levelInfo.level}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
