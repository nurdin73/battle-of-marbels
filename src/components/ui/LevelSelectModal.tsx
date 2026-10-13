import React from 'react';
import { useLevelStore } from '../../store/useLevelStore';
import { useGameStore } from '../../store/useGameStore';
import { ADVENTURE_LEVELS } from '../../constants/levels.constants';
import { Star, Lock, Play, X, Compass, CheckCircle2 } from 'lucide-react';

export const LevelSelectModal: React.FC = () => {
  const isLevelSelectOpen = useLevelStore((s) => s.isLevelSelectOpen);
  const currentLevelId = useLevelStore((s) => s.currentLevelId);
  const unlockedLevelIds = useLevelStore((s) => s.unlockedLevelIds);
  const levelRecords = useLevelStore((s) => s.levelRecords);
  const selectLevel = useLevelStore((s) => s.selectLevel);
  const closeLevelSelectModal = useLevelStore((s) => s.closeLevelSelectModal);
  const loadLevelConfig = useGameStore((s) => s.loadLevelConfig);

  if (!isLevelSelectOpen) return null;

  // Calculate total stars collected across all levels
  const totalStars = Object.values(levelRecords).reduce((acc, curr) => acc + (curr.stars || 0), 0);
  const maxPossibleStars = ADVENTURE_LEVELS.length * 3;

  const handleChooseLevel = (levelId: string) => {
    const level = ADVENTURE_LEVELS.find((l) => l.id === levelId);
    if (!level) return;
    selectLevel(levelId);
    loadLevelConfig(level);
  };

  return (
    <div
      data-testid="level-select-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center shadow-md shadow-amber-500/20 text-neutral-950 font-bold">
              <Compass className="w-5 h-5 text-neutral-950" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-neutral-100 tracking-tight flex items-center gap-2">
                MODE PETUALANGAN SOLO
              </h2>
              <p className="text-xs text-neutral-400">Pilih rintangan pekarangan & capai bintang 3 Par</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Total Star Counter Pill */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-xs font-bold">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{totalStars} / {maxPossibleStars}</span>
            </div>

            {/* Close Button */}
            <button
              data-testid="close-level-select-btn"
              onClick={closeLevelSelectModal}
              className="p-2 rounded-xl text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Level Cards List */}
        <div className="flex flex-col gap-3.5 overflow-y-auto pr-1">
          {ADVENTURE_LEVELS.map((level) => {
            const isUnlocked = unlockedLevelIds.includes(level.id);
            const isCurrent = level.id === currentLevelId;
            const record = levelRecords[level.id];
            const stars = record ? record.stars : 0;

            let difficultyColor = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
            if (level.difficulty === 'SEDANG') {
              difficultyColor = 'bg-amber-500/20 text-amber-400 border-amber-500/40';
            } else if (level.difficulty === 'SULIT') {
              difficultyColor = 'bg-rose-500/20 text-rose-400 border-rose-500/40';
            }

            return (
              <div
                key={level.id}
                data-testid={`level-card-${level.id}`}
                className={`relative flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-2xl border transition-all ${
                  isCurrent
                    ? 'bg-neutral-800/90 border-sky-500/70 shadow-lg shadow-sky-500/10'
                    : isUnlocked
                    ? 'bg-neutral-900/90 border-neutral-800 hover:border-neutral-700'
                    : 'bg-neutral-950/60 border-neutral-900 opacity-60'
                }`}
              >
                {/* Level Meta & Info */}
                <div className="flex items-start gap-3.5 mb-3 sm:mb-0">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 shadow-inner ${
                      isCurrent
                        ? 'bg-gradient-to-tr from-sky-500 to-indigo-600 text-white'
                        : isUnlocked
                        ? 'bg-neutral-800 text-neutral-200 border border-neutral-700'
                        : 'bg-neutral-900 text-neutral-600 border border-neutral-800'
                    }`}
                  >
                    {isUnlocked ? level.levelNumber : <Lock className="w-4 h-4 text-neutral-500" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-neutral-100">{level.title}</h3>
                      <span className={`px-2 py-0.5 rounded-md border text-[9px] font-bold ${difficultyColor}`}>
                        {level.difficulty}
                      </span>
                      {record?.completed && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      )}
                    </div>
                    <p className="text-xs text-sky-400/90 font-medium">{level.subtitle}</p>
                    <p className="text-[11px] text-neutral-400 mt-1 max-w-md line-clamp-1">
                      {level.description}
                    </p>
                  </div>
                </div>

                {/* Stars & Action Button */}
                <div className="flex items-center justify-between w-full sm:w-auto sm:justify-end gap-4 shrink-0">
                  {/* Star Rating Display */}
                  <div className="flex items-center gap-1">
                    {[1, 2, 3].map((sIdx) => (
                      <Star
                        key={sIdx}
                        className={`w-4 h-4 ${
                          sIdx <= stars
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-neutral-700 fill-neutral-800'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Par Badge */}
                  <div className="px-2.5 py-1 rounded-lg bg-neutral-950/80 border border-neutral-800 font-mono text-[10px] text-neutral-400 font-medium">
                    Par: <span className="text-neutral-200 font-bold">{level.par}</span>
                  </div>

                  {/* Choose / Play Button */}
                  {isUnlocked ? (
                    <button
                      data-testid={`select-level-btn-${level.id}`}
                      onClick={() => handleChooseLevel(level.id)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                          : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700'
                      }`}
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{isCurrent ? 'Sedang Main' : 'Pilih'}</span>
                    </button>
                  ) : (
                    <div className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-neutral-600 flex items-center gap-1 bg-neutral-950 border border-neutral-900">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Terkunci</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
