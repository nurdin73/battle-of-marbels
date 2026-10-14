import React, { useEffect } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { useLevelStore } from '../../store/useLevelStore';
import { useMultiplayerStore } from '../../store/useMultiplayerStore';
import { ADVENTURE_LEVELS } from '../../constants/levels.constants';
import { Trophy, Star, RotateCcw, Target, Zap, ArrowRight, Compass } from 'lucide-react';

export const GameOverModal: React.FC = () => {
  const isGameOver = useGameStore((s) => s.isGameOver);
  const isMultiplayer = useMultiplayerStore((s) => s.isMultiplayer);
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

  // Record completion to persistent storage on win (solo mode only)
  useEffect(() => {
    if (isGameOver && !isMultiplayer) {
      recordLevelCompletion(currentLevelId, flickCount);
    }
  }, [isGameOver, isMultiplayer, currentLevelId, flickCount, recordLevelCompletion]);

  if (!isGameOver || isMultiplayer) return null;

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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm animate-in fade-in duration-300"
    >
      <div className="relative w-full max-w-md bg-[#fdfbf7] border-2 border-[#eee6dc] border-b-[6px] border-b-[#ded4c5] rounded-[32px] p-6 sm:p-8 shadow-2xl text-center flex flex-col items-center text-stone-800">
        {/* Glowing Trophy Badge (Timbul) */}
        <div className="w-16 h-16 rounded-2xl bg-amber-100 border-2 border-amber-300 border-b-[4px] border-b-amber-500 flex items-center justify-center shadow-md mb-4 animate-bounce">
          <Trophy className="w-9 h-9 text-amber-800" />
        </div>

        <div className="px-3.5 py-1 rounded-2xl bg-amber-100 border-2 border-amber-300 border-b-[3px] border-b-amber-400 text-amber-950 font-mono text-[11px] font-black mb-2">
          LEVEL {currentLevel.levelNumber} BERSIH! 🎉
        </div>

        <h2 className="text-xl sm:text-2xl font-black text-stone-800 tracking-tight">
          HORE, MENANG BANYAK!
        </h2>
        <p className="text-xs sm:text-sm text-stone-600 mt-1 mb-5 font-semibold">
          Seluruh {targetMarbles.length} kelereng target di {currentLevel.title} berhasil keluar ring!
        </p>

        {/* 3 Stars Display (Timbul stars) */}
        <div data-testid="star-rating" className="flex items-center gap-3 mb-6">
          {[1, 2, 3].map((starIdx) => {
            const isFilled = starIdx <= starsAwarded;
            return (
              <div
                key={starIdx}
                className={`p-2.5 rounded-2xl transition-all duration-300 ${
                  isFilled
                    ? 'bg-amber-100 border-2 border-amber-400 border-b-[4px] border-b-amber-500 shadow-md scale-110'
                    : 'bg-stone-100 border-2 border-stone-200 border-b-[2px] border-b-stone-300 opacity-40'
                }`}
              >
                <Star
                  className={`w-7 h-7 ${
                    isFilled ? 'text-amber-500 fill-amber-400' : 'text-stone-300 fill-stone-200'
                  }`}
                />
              </div>
            );
          })}
        </div>

        {/* Match Statistics Card (Timbul inner card) */}
        <div className="w-full bg-white border-2 border-[#eee6dc] border-b-[4px] border-b-[#ded4c5] rounded-2xl p-4 mb-6 grid grid-cols-2 gap-3 text-left">
          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-[#fdfbf7] border border-[#eee6dc]">
            <Target className="w-4 h-4 text-emerald-700 shrink-0" />
            <div>
              <span className="text-[10px] uppercase tracking-wider text-stone-500 font-bold block">
                Target Kena
              </span>
              <span className="text-sm font-black text-stone-800 font-mono">
                {score} / {targetMarbles.length}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-[#fdfbf7] border border-[#eee6dc]">
            <Zap className="w-4 h-4 text-[#d54425] shrink-0" />
            <div>
              <span className="text-[10px] uppercase tracking-wider text-stone-500 font-bold block">
                Total Sentilan
              </span>
              <span className="text-sm font-black text-stone-800 font-mono">
                {flickCount}{' '}
                <span className="text-[10px] text-stone-500 font-normal">
                  (Target: {currentPar})
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons (Chunky timbul matching reference) */}
        <div className="flex flex-col gap-3 w-full">
          {nextLevel ? (
            <button
              data-testid="next-level-btn"
              onClick={handleNextLevel}
              className="timbul-btn-coral w-full py-3.5 px-6 text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Lanjut ke Level {nextLevel.levelNumber} 🚀</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              data-testid="all-levels-clear-btn"
              onClick={() => {
                restartGame();
                openLevelSelectModal();
              }}
              className="timbul-btn-purple w-full py-3.5 px-6 text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <Compass className="w-4 h-4" />
              <span>Semua Level Bersih! Pilih Level 🌟</span>
            </button>
          )}

          <button
            data-testid="replay-level-btn"
            onClick={handleReplayLevel}
            className="timbul-btn-cream w-full py-3 px-6 text-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-stone-600" />
            <span>Main Lagi Biar Lebih Jago 🔄</span>
          </button>
        </div>
      </div>
    </div>
  );
};
