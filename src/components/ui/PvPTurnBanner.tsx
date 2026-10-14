import React from 'react';
import {
  Flame,
  Clock,
  LogOut,
  RotateCcw,
  Trophy,
} from 'lucide-react';
import { useMultiplayerStore } from '../../store/useMultiplayerStore';
import { useGameStore } from '../../store/useGameStore';

export const PvPTurnBanner: React.FC = () => {
  const isMultiplayer = useMultiplayerStore((s) => s.isMultiplayer);
  const role = useMultiplayerStore((s) => s.role);
  const localPlayer = useMultiplayerStore((s) => s.localPlayer);
  const opponentPlayer = useMultiplayerStore((s) => s.opponentPlayer);
  const isMyTurn = useMultiplayerStore((s) => s.isMyTurn());
  const leaveMatch = useMultiplayerStore((s) => s.leaveMatch);
  const requestRematch = useMultiplayerStore((s) => s.requestRematch);
  const acceptRematch = useMultiplayerStore((s) => s.acceptRematch);
  const isRematchRequestedByMe = useMultiplayerStore((s) => s.isRematchRequestedByMe);
  const isRematchRequestedByOpponent = useMultiplayerStore((s) => s.isRematchRequestedByOpponent);

  const currentScreen = useGameStore((s) => s.currentScreen);
  const isGameOver = useGameStore((s) => s.isGameOver);
  const goToMainMenu = useGameStore((s) => s.goToMainMenu);

  if (!isMultiplayer || currentScreen !== 'PLAYING') return null;

  const handleExitMatch = () => {
    leaveMatch();
    goToMainMenu();
  };

  const myScore = localPlayer.score;
  const opponentScore = opponentPlayer?.score || 0;
  const isWinner = myScore > opponentScore;
  const isDraw = myScore === opponentScore;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-4 z-40 flex flex-col items-center gap-2 px-4"
      data-testid="pvp-turn-banner"
    >
      {/* 1. Main Match Scoreboard & Turn Banner */}
      <div className="pointer-events-auto flex items-center justify-between gap-3 sm:gap-6 px-4 py-2.5 rounded-2xl bg-stone-900/90 border border-stone-800 shadow-xl backdrop-blur-md text-stone-100 max-w-xl w-full">
        {/* Local Player Info */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 font-bold text-xs flex items-center justify-center flex-shrink-0">
            {role === 'HOST' ? 'P1' : 'P2'}
          </div>
          <div className="min-w-0 text-left">
            <div className="text-xs font-bold text-white truncate max-w-[90px] sm:max-w-[120px]">
              {localPlayer.name} (Kamu)
            </div>
            <div className="text-[10px] text-amber-400 font-mono font-bold">
              {myScore} Kelereng
            </div>
          </div>
        </div>

        {/* Dynamic Turn Badge */}
        <div className="flex-1 flex justify-center px-1">
          {isMyTurn ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-black tracking-wider animate-pulse shadow-sm shadow-emerald-500/20">
              <Flame className="w-3.5 h-3.5" />
              <span>GILIRAN KAMU</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold tracking-wider">
              <Clock className="w-3.5 h-3.5 animate-spin text-amber-400" />
              <span>GILIRAN LAWAN</span>
            </div>
          )}
        </div>

        {/* Opponent Info */}
        <div className="flex items-center gap-2.5 min-w-0 text-right">
          <div className="min-w-0">
            <div className="text-xs font-bold text-white truncate max-w-[90px] sm:max-w-[120px]">
              {opponentPlayer?.name || 'Lawan'}
            </div>
            <div className="text-[10px] text-emerald-400 font-mono font-bold">
              {opponentScore} Kelereng
            </div>
          </div>
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center flex-shrink-0">
            {role === 'HOST' ? 'P2' : 'P1'}
          </div>

          {/* Leave Button */}
          <button
            onClick={handleExitMatch}
            title="Keluar dari pertandingan"
            className="p-1.5 rounded-lg text-stone-400 hover:text-red-400 hover:bg-stone-800 transition-colors ml-1"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Game Over Modal Overlay for PvP */}
      {isGameOver && (
        <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-3xl bg-stone-900 border border-stone-800 p-6 sm:p-8 text-center text-white space-y-5 shadow-2xl">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Trophy className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-2xl font-black tracking-tight">
                {isDraw ? 'HASIL IMBANG!' : isWinner ? 'KAMU MENANG!' : 'KAMU KALAH!'}
              </h2>
              <p className="text-xs text-stone-400 mt-1">
                Skor Akhir: {myScore} - {opponentScore}
              </p>
            </div>

            {/* Rematch State */}
            <div className="space-y-3 pt-2">
              {isRematchRequestedByOpponent ? (
                <button
                  onClick={acceptRematch}
                  className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black text-sm tracking-wide shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>TERIMA TANDING ULANG</span>
                </button>
              ) : (
                <button
                  onClick={requestRematch}
                  disabled={isRematchRequestedByMe}
                  className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-stone-950 font-black text-sm tracking-wide shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>{isRematchRequestedByMe ? 'Menunggu Lawan...' : 'TANDING ULANG'}</span>
                </button>
              )}

              <button
                onClick={handleExitMatch}
                className="w-full py-3 rounded-2xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-semibold text-xs tracking-wider"
              >
                KEMBALI KE MENU UTAMA
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

