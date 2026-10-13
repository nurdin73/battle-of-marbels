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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-2xl bg-[#fdfbf7] border-2 border-[#eee6dc] border-b-[6px] border-b-[#ded4c5] rounded-[32px] p-6 sm:p-8 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-stone-800">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b-2 border-[#eee6dc] pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-100 border-2 border-amber-300 border-b-[3px] border-b-amber-400 flex items-center justify-center shadow-sm text-amber-900 font-bold">
              <Compass className="w-5 h-5 text-amber-800" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-stone-800 tracking-tight flex items-center gap-2">
                PETUALANGAN KELERENG KAMPUNG 🏡
              </h2>
              <p className="text-xs text-stone-500 font-semibold">Pilih rintangan seru di pekarangan & kumpulkan bintang!</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Total Star Counter Pill (Timbul) */}
            <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-amber-100 border-2 border-amber-300 border-b-[3px] border-b-amber-400 text-amber-950 font-mono text-xs font-black">
              <Star className="w-4 h-4 fill-amber-500 text-amber-600" />
              <span>{totalStars} / {maxPossibleStars}</span>
            </div>

            {/* Close Button (Timbul cream circle) */}
            <button
              data-testid="close-level-select-btn"
              onClick={closeLevelSelectModal}
              className="w-10 h-10 rounded-2xl border-2 border-[#eee6dc] border-b-[3px] border-b-[#ded4c5] bg-white hover:bg-stone-100 flex items-center justify-center text-stone-500 hover:text-stone-800 active:translate-y-[1px] transition-all cursor-pointer"
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

            let difficultyBadge = 'bg-emerald-50 text-emerald-900 border-2 border-emerald-300 border-b-[2px] border-b-emerald-400';
            if (level.difficulty === 'SEDANG') {
              difficultyBadge = 'bg-amber-50 text-amber-950 border-2 border-amber-300 border-b-[2px] border-b-amber-400';
            } else if (level.difficulty === 'SULIT') {
              difficultyBadge = 'bg-orange-50 text-orange-950 border-2 border-orange-300 border-b-[2px] border-b-orange-400';
            }

            return (
              <div
                key={level.id}
                data-testid={`level-card-${level.id}`}
                className={`relative flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                  isCurrent
                    ? 'bg-[#fff8f5] border-[#ff6242] border-b-[5px] border-b-[#d54425] shadow-md'
                    : isUnlocked
                    ? 'bg-white hover:bg-[#faf7f2] border-[#eee6dc] border-b-[5px] border-b-[#ded4c5] shadow-sm'
                    : 'bg-[#f7f4ee] border-[#eee6dc] border-b-[4px] border-b-[#ded4c5] opacity-60'
                }`}
              >
                {/* Level Meta & Info */}
                <div className="flex items-start gap-3.5 mb-3 sm:mb-0">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 shadow-sm ${
                      isCurrent
                        ? 'bg-[#ff6242] border-b-[3px] border-b-[#d54425] text-white'
                        : isUnlocked
                        ? 'bg-[#fdfbf7] text-stone-800 border-2 border-[#eee6dc] border-b-[3px] border-b-[#ded4c5]'
                        : 'bg-stone-200 text-stone-400 border-2 border-stone-300'
                    }`}
                  >
                    {isUnlocked ? level.levelNumber : <Lock className="w-4 h-4 text-stone-400" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-black text-stone-800">{level.title}</h3>
                      <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black ${difficultyBadge}`}>
                        {level.difficulty}
                      </span>
                      {record?.completed && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      )}
                    </div>
                    <p className="text-xs text-[#d54425] font-extrabold">{level.subtitle}</p>
                    <p className="text-[11px] text-stone-500 mt-0.5 max-w-md line-clamp-1 font-medium">
                      {level.description}
                    </p>
                  </div>
                </div>

                {/* Stars & Action Button */}
                <div className="flex items-center justify-between w-full sm:w-auto sm:justify-end gap-3.5 shrink-0">
                  {/* Star Rating Display */}
                  <div className="flex items-center gap-1">
                    {[1, 2, 3].map((sIdx) => (
                      <Star
                        key={sIdx}
                        className={`w-4 h-4 ${
                          sIdx <= stars
                            ? 'text-amber-500 fill-amber-400'
                            : 'text-stone-300 fill-stone-200'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Par Badge (Timbul small) */}
                  <div className="px-2.5 py-1 rounded-xl bg-[#fdfbf7] border-2 border-[#eee6dc] border-b-[2px] border-b-[#ded4c5] font-mono text-[10px] text-stone-600 font-bold">
                    Target: <span className="text-stone-900 font-black">{level.par}</span> sentilan
                  </div>

                  {/* Choose / Play Button (Matching reference button styling) */}
                  {isUnlocked ? (
                    <button
                      data-testid={`select-level-btn-${level.id}`}
                      onClick={() => handleChooseLevel(level.id)}
                      className={`px-4 py-2 text-xs flex items-center gap-1.5 cursor-pointer ${
                        isCurrent
                          ? 'timbul-btn-cream'
                          : 'timbul-btn-coral'
                      }`}
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{isCurrent ? 'Sedang Main' : 'Ayo Main!'}</span>
                    </button>
                  ) : (
                    <div className="px-3.5 py-1.5 rounded-2xl text-xs font-bold text-stone-400 flex items-center gap-1 bg-stone-100 border-2 border-stone-200 border-b-[3px] border-b-stone-300">
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
