import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { Trophy, Star, RotateCcw, Target, Zap } from 'lucide-react';
import { GAMEPLAY_CONFIG } from '../../constants/physics.constants';

export const GameOverModal: React.FC = () => {
  const isGameOver = useGameStore((s) => s.isGameOver);
  const score = useGameStore((s) => s.score);
  const flickCount = useGameStore((s) => s.flickCount);
  const starsAwarded = useGameStore((s) => s.starsAwarded);
  const restartGame = useGameStore((s) => s.restartGame);

  if (!isGameOver) return null;

  return (
    <div
      data-testid="game-over-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-300"
    >
      <div className="relative w-full max-w-md bg-neutral-900 border border-neutral-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl text-center flex flex-col items-center">
        {/* Glowing Trophy Badge */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center shadow-lg shadow-amber-500/20 mb-4 animate-bounce">
          <Trophy className="w-9 h-9 text-neutral-950" />
        </div>

        <h2 className="text-xl sm:text-2xl font-black text-neutral-100 tracking-tight">
          ARENA DIBERSIHKAN!
        </h2>
        <p className="text-xs sm:text-sm text-neutral-400 mt-1 mb-5 font-medium">
          Seluruh 9 kelereng target berhasil dikeluarkan dari ring.
        </p>

        {/* 3 Stars Display */}
        <div data-testid="star-rating" className="flex items-center gap-3 mb-6">
          {[1, 2, 3].map((starIdx) => {
            const isFilled = starIdx <= starsAwarded;
            return (
              <div
                key={starIdx}
                className={`p-2.5 rounded-2xl transition-all duration-300 ${
                  isFilled
                    ? 'bg-amber-400/20 border border-amber-400/60 shadow-lg shadow-amber-500/20 scale-110'
                    : 'bg-neutral-800/60 border border-neutral-700/40 opacity-40'
                }`}
              >
                <Star
                  className={`w-7 h-7 ${
                    isFilled ? 'text-amber-400 fill-amber-400' : 'text-neutral-500'
                  }`}
                />
              </div>
            );
          })}
        </div>

        {/* Match Statistics Card */}
        <div className="w-full bg-neutral-950/60 border border-neutral-800 rounded-2xl p-4 mb-6 grid grid-cols-2 gap-3 text-left">
          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-neutral-900/50">
            <Target className="w-4 h-4 text-sky-400 shrink-0" />
            <div>
              <span className="text-[10px] uppercase tracking-wider text-neutral-400 font-semibold block">
                Total Skor
              </span>
              <span className="text-sm font-bold text-neutral-100 font-mono">
                {score} / {GAMEPLAY_CONFIG.initialTargetCount}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-neutral-900/50">
            <Zap className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <span className="text-[10px] uppercase tracking-wider text-neutral-400 font-semibold block">
                Total Sentilan
              </span>
              <span className="text-sm font-bold text-neutral-100 font-mono">
                {flickCount}{' '}
                <span className="text-[10px] text-neutral-500 font-normal">
                  (Par: {GAMEPLAY_CONFIG.parFlicks})
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          data-testid="restart-game-btn"
          onClick={restartGame}
          className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20 active:scale-95 transition-all cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Main Babak Baru</span>
        </button>
      </div>
    </div>
  );
};
