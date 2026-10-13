import React, { useEffect } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { useLevelStore } from '../../store/useLevelStore';
import { ADVENTURE_LEVELS } from '../../constants/levels.constants';
import { Trophy, Star, RotateCcw, Target, Zap, ArrowRight, Compass } from 'lucide-react';

export const GameOverModal: React.FC = () => {
  const isGameOver = useGameStore((s) => s.isGameOver);
  const score = useGameStore((s) => s.score);
  const flickCount = useGameStore((s) => s.flickCount);
  const starsAwarded = useGameStore((s) => s.starsAwarded);
  const currentPar = useGameStore((s) => s.currentPar);
  const targetMarbles = useGameStore((s) => s.targetMarbles);
  const restartGame = useGameStore((s) => s.restartGame);
  const loadLevelConfig = useGameStore((s) => s.loadLevelConfig);

  const currentLevelId = useLevelStore((s) => s.currentLevelId);
  const selectLevel = useLevelStore((s) => s.selectLevel);
  const recordLevelCompletion = useLevelStore((s) => s.recordLevelCompletion);
  const openLevelSelectModal = useLevelStore((s) => s.openLevelSelectModal);

  const currentLevelIndex = ADVENTURE_LEVELS.findIndex((l) => l.id === currentLevelId);
  const currentLevel = ADVENTURE_LEVELS[currentLevelIndex] || ADVENTURE_LEVELS[0];
  const nextLevel = currentLevelIndex !== -1 && currentLevelIndex < ADVENTURE_LEVELS.length - 1
    ? ADVENTURE_LEVELS[currentLevelIndex + 1]
    : null;

  // Record completion to persistent storage on win
  useEffect(() => {
    if (isGameOver) {
      recordLevelCompletion(currentLevelId, flickCount);
    }
  }, [isGameOver, currentLevelId, flickCount, recordLevelCompletion]);

  if (!isGameOver) return null;

  const handleNextLevel = () => {
    if (!nextLevel) {
      openLevelSelectModal();
      return;
    }
    selectLevel(nextLevel.id);
    loadLevelConfig(nextLevel);
  };

  const handleReplayLevel = () => {
    loadLevelConfig(currentLevel);
  };

  return (
    <div
      data-testid="game-over-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300"
    >
      <div className="relative w-full max-w-md bg-neutral-900 border border-neutral-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl text-center flex flex-col items-center">
        {/* Glowing Trophy Badge */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center shadow-lg shadow-amber-500/20 mb-4 animate-bounce">
          <Trophy className="w-9 h-9 text-neutral-950" />
        </div>

        <div className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-[11px] font-bold mb-2">
          LEVEL {currentLevel.levelNumber} SELESAI
        </div>

        <h2 className="text-xl sm:text-2xl font-black text-neutral-100 tracking-tight">
          {currentLevel.title.toUpperCase()}
        </h2>
        <p className="text-xs sm:text-sm text-neutral-400 mt-1 mb-5 font-medium">
          Seluruh {targetMarbles.length} kelereng target berhasil dibersihkan!
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
                Target Bersih
              </span>
              <span className="text-sm font-bold text-neutral-100 font-mono">
                {score} / {targetMarbles.length}
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
                  (Par: {currentPar})
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 w-full">
          {nextLevel ? (
            <button
              data-testid="next-level-btn"
              onClick={handleNextLevel}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <span>Lanjut ke Level {nextLevel.levelNumber}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              data-testid="all-levels-clear-btn"
              onClick={() => {
                restartGame();
                openLevelSelectModal();
              }}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-neutral-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <Compass className="w-4 h-4" />
              <span>Semua Level Bersih! Pilih Level</span>
            </button>
          )}

          <button
            data-testid="replay-level-btn"
            onClick={handleReplayLevel}
            className="w-full py-2.5 px-6 rounded-2xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-300 font-semibold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Ulangi Level Ini</span>
          </button>
        </div>
      </div>
    </div>
  );
};
