import React, { useEffect, useRef, useState } from 'react';
import { Share2, Award, ArrowRight, Zap, CheckCircle2, Clock, MapPin, Eye } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Adventure, Discovery, BadgeDefinition } from '../../types';
import { calculateTouchGrassScore, TouchGrassScoreBreakdown } from './score';
import { BADGE_DEFINITIONS } from '../rewards/xpEngine';

interface RecapViewProps {
  adventure: Adventure;
  discoveries: Discovery[];
  unlockedBadgeIds: string[];
  xpEarned: number;
  onGoHome: () => void;
}

export const RecapView: React.FC<RecapViewProps> = ({
  adventure,
  discoveries,
  unlockedBadgeIds,
  xpEarned,
  onGoHome,
}) => {
  const [breakdown, setBreakdown] = useState<TouchGrassScoreBreakdown | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isGeneratingCard, setIsGeneratingCard] = useState(false);

  const durationMin = Math.max(1, Math.round(((adventure.endedAt || Date.now()) - adventure.startedAt) / 60000));

  useEffect(() => {
    const b = calculateTouchGrassScore(
      durationMin,
      adventure.distanceM,
      discoveries.length,
      adventure.phoneChecks
    );
    setBreakdown(b);

    if (b.score >= 60 || unlockedBadgeIds.length > 0) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#22c55e', '#10b981', '#34d399', '#f59e0b'],
      });
    }
  }, [adventure, discoveries, durationMin, unlockedBadgeIds]);

  // Generate Templated Adventure Journal Text
  const generateJournalEntry = () => {
    const moodAdjectives: Record<string, string> = {
      relax: 'peaceful and mindful',
      adventure: 'thrilling and exploratory',
      fitness: 'invigorating and high-energy',
      photo: 'visually inspiring',
      social: 'friendly and connected',
    };

    const discoveryList = discoveries.map((d) => d.label).join(', ');
    const distanceKm = (adventure.distanceM / 1000).toFixed(2);

    return `Embarked on a ${moodAdjectives[adventure.mood] || 'recharging'} ${durationMin}-minute walk across campus, covering ${distanceKm} km. ${
      adventure.wasOffline
        ? 'Maintained complete airplane mode offline presence with zero screen distractions. '
        : ''
    }${
      discoveries.length > 0
        ? `Identified ${discoveries.length} biodiversity elements on-device: ${discoveryList}. `
        : 'Took in the fresh air and tree canopy along the trail. '
    }${
      adventure.phoneChecks <= 2
        ? 'Kept the phone stowed away in pocket, achieving exceptional outdoor presence.'
        : `Checked the phone ${adventure.phoneChecks} times during the journey.`
    }`;
  };

  // Export Share Card via Canvas
  const handleExportCard = () => {
    if (!canvasRef.current || !breakdown) return;
    setIsGeneratingCard(true);

    const canvas = canvasRef.current;
    canvas.width = 1080;
    canvas.height = 1350;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Dark outdoor gradient background
    const bgGradient = ctx.createLinearGradient(0, 0, 0, 1350);
    bgGradient.addColorStop(0, '#052e16');
    bgGradient.addColorStop(0.5, '#021e10');
    bgGradient.addColorStop(1, '#020617');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, 1080, 1350);

    // Glowing border frame
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 14;
    ctx.strokeRect(40, 40, 1000, 1270);

    // App Title
    ctx.fillStyle = '#4ade80';
    ctx.font = 'bold 50px sans-serif';
    ctx.fillText('🌿 TRAILMATE EXPEDITION', 80, 140);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '32px sans-serif';
    ctx.fillText(new Date(adventure.startedAt).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }), 80, 195);

    // Big Touch Grass Score Circle
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(540, 460, 200, 0, 2 * Math.PI);
    ctx.fill();
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#22c55e';
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 130px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${breakdown.score}`, 540, 480);

    ctx.fillStyle = '#86efac';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText('TOUCH GRASS SCORE', 540, 560);

    // Stats Grid
    ctx.textAlign = 'left';
    ctx.fillStyle = '#1e293b';
    ctx.roundRect(80, 720, 920, 240, 24);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 44px sans-serif';
    ctx.fillText(`${durationMin} min`, 120, 800);
    ctx.fillText(`${(adventure.distanceM / 1000).toFixed(2)} km`, 420, 800);
    ctx.fillText(`${discoveries.length} finds`, 740, 800);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '28px sans-serif';
    ctx.fillText('Outdoor Time', 120, 850);
    ctx.fillText('Trail Distance', 420, 850);
    ctx.fillText('On-Device AI IDs', 740, 850);

    if (adventure.wasOffline) {
      ctx.fillStyle = '#22c55e';
      ctx.font = 'bold 32px sans-serif';
      ctx.fillText('📡 Completed 100% Offline in Airplane Mode', 120, 915);
    }

    // Journal preview
    ctx.fillStyle = '#cbd5e1';
    ctx.font = 'italic 28px sans-serif';
    const preview = generateJournalEntry().slice(0, 160) + '...';
    ctx.fillText(`"${preview}"`, 80, 1040, 920);

    // Footer
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText('Built with on-device open-weight AI · TrailMate PWA', 80, 1240);

    // Download PNG
    const link = document.createElement('a');
    link.download = `trailmate-walk-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    setIsGeneratingCard(false);
  };

  return (
    <div className="flex flex-col gap-5 max-w-md mx-auto w-full pb-8">
      {/* Hidden Canvas for Card Generation */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Hero Touch Grass Score Card */}
      <div className="card-outdoor bg-gradient-to-b from-slate-900 to-slate-950 border-emerald-500/50 text-center flex flex-col items-center py-6">
        <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-1">
          Adventure Complete
        </span>
        <h2 className="text-lg font-bold text-slate-300">Touch Grass Score</h2>

        <div className="relative my-4 flex items-center justify-center">
          <div className="w-36 h-36 rounded-full border-4 border-emerald-500 flex flex-col items-center justify-center bg-slate-950 shadow-2xl shadow-emerald-500/30">
            <span className="text-5xl font-black text-white">{breakdown?.score ?? 0}</span>
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">/ 100</span>
          </div>
        </div>

        {/* Breakdown Pills */}
        {breakdown && (
          <div className="grid grid-cols-4 gap-2 w-full pt-2 px-2 text-center text-xs border-t border-slate-800">
            <div>
              <div className="font-bold text-emerald-400">+{breakdown.timePoints}</div>
              <div className="text-[10px] text-slate-400">Time</div>
            </div>
            <div>
              <div className="font-bold text-emerald-400">+{breakdown.distancePoints}</div>
              <div className="text-[10px] text-slate-400">Distance</div>
            </div>
            <div>
              <div className="font-bold text-emerald-400">+{breakdown.discoveryPoints}</div>
              <div className="text-[10px] text-slate-400">Discoveries</div>
            </div>
            <div>
              <div className={`font-bold ${breakdown.phonePenalty > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                -{breakdown.phonePenalty}
              </div>
              <div className="text-[10px] text-slate-400">Screen Pen.</div>
            </div>
          </div>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="card-outdoor p-3">
          <Clock className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
          <div className="text-lg font-black text-white">{durationMin} min</div>
          <div className="text-[10px] text-slate-400 uppercase font-bold">Outside</div>
        </div>
        <div className="card-outdoor p-3">
          <MapPin className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
          <div className="text-lg font-black text-white">{(adventure.distanceM / 1000).toFixed(2)} km</div>
          <div className="text-[10px] text-slate-400 uppercase font-bold">Distance</div>
        </div>
        <div className="card-outdoor p-3">
          <Eye className="w-4 h-4 text-amber-400 mx-auto mb-1" />
          <div className="text-lg font-black text-white">{adventure.phoneChecks}</div>
          <div className="text-[10px] text-slate-400 uppercase font-bold">Screen Checks</div>
        </div>
      </div>

      {/* XP Earned Banner */}
      <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-bold uppercase">Experience Earned</div>
            <div className="text-xl font-black text-white">+{xpEarned} XP</div>
          </div>
        </div>
        {adventure.wasOffline && (
          <span className="text-xs bg-emerald-500/20 text-emerald-300 font-bold px-2.5 py-1 rounded-full border border-emerald-500/30">
            Airplane Mode
          </span>
        )}
      </div>

      {/* Unlocked Badges */}
      {unlockedBadgeIds.length > 0 && (
        <div className="card-outdoor border-amber-500/40 bg-amber-950/20 flex flex-col gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <Award className="w-4 h-4" /> New Badges Unlocked!
          </span>
          <div className="flex flex-col gap-2">
            {unlockedBadgeIds.map((id) => {
              const b: BadgeDefinition | undefined = BADGE_DEFINITIONS[id];
              if (!b) return null;
              return (
                <div key={id} className="flex items-center gap-3 p-2 bg-slate-900/60 rounded-xl border border-amber-500/30">
                  <span className="text-2xl">{b.icon}</span>
                  <div>
                    <div className="font-bold text-white text-sm">{b.title}</div>
                    <div className="text-xs text-slate-400">{b.description}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Auto-Generated Journal Story */}
      <div className="card-outdoor flex flex-col gap-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Adventure Journal Entry
        </h3>
        <p className="text-sm text-slate-300 italic leading-relaxed bg-slate-950/50 p-3 rounded-xl border border-slate-800">
          "{generateJournalEntry()}"
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-2 pt-2">
        <button
          type="button"
          onClick={handleExportCard}
          disabled={isGeneratingCard}
          className="btn-secondary min-h-[50px] border-emerald-500/40 text-emerald-300 hover:bg-emerald-950/30"
        >
          <Share2 className="w-4 h-4" /> {isGeneratingCard ? 'Generating...' : 'Export Shareable Adventure Card (PNG)'}
        </button>

        <button
          type="button"
          onClick={onGoHome}
          className="btn-primary"
        >
          View Profile & Rewards <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
