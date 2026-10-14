import React from 'react';
import { useMultiplayerStore } from '../../store/useMultiplayerStore';
import { useGameStore } from '../../store/useGameStore';
import { marbleAudio } from '../../utils/soundSynth.utils';
import { LogOut, RotateCcw, Trophy } from 'lucide-react';

export const MultiplayerHUD: React.FC = () => {
  const isMultiplayerActive = useMultiplayerStore((s) => s.isMultiplayerActive);
  const roomStatus = useMultiplayerStore((s) => s.roomStatus);
  const role = useMultiplayerStore((s) => s.role);
  const localPlayer = useMultiplayerStore((s) => s.localPlayer);
  const remotePlayer = useMultiplayerStore((s) => s.remotePlayer);
  const currentTurnPlayerId = useMultiplayerStore((s) => s.currentTurnPlayerId);
  const scores = useMultiplayerStore((s) => s.scores);
  const pingMs = useMultiplayerStore((s) => s.pingMs);
  const rematchRequestedBy = useMultiplayerStore((s) => s.rematchRequestedBy);
  const leaveRoom = useMultiplayerStore((s) => s.leaveRoom);
  const requestRematch = useMultiplayerStore((s) => s.requestRematch);
  const acceptRematch = useMultiplayerStore((s) => s.acceptRematch);

  const isGameOver = useGameStore((s) => s.isGameOver);
  const currentScreen = useGameStore((s) => s.currentScreen);
  const matchPhase = useMultiplayerStore((s) => s.matchPhase);
  const tossBannerMessage = useMultiplayerStore((s) => s.tossBannerMessage);
  const turnTimeLimitSeconds = useMultiplayerStore((s) => s.turnTimeLimitSeconds);
  const turnTimer = useGameStore((s) => s.turnTimer);

  // Only show when in game and multiplayer is active
  if (!isMultiplayerActive || currentScreen !== 'PLAYING' || roomStatus !== 'CONNECTED') {
    return null;
  }

  const isMyTurn = currentTurnPlayerId === localPlayer.id;
  const isHost = role === 'HOST';

  // Determine scores
  const p1Score = scores.host;
  const p2Score = scores.guest;
  const myScore = isHost ? p1Score : p2Score;
  const opponentScore = isHost ? p2Score : p1Score;

  const handleLeave = () => {
    if (window.confirm('Yakin ingin keluar dari pertandingan multiplayer?')) {
      marbleAudio.playWoodKnockSound(0.9);
      leaveRoom();
    }
  };

  return (
    <>
      {/* TOP CONTAINER: ROW 1 (SCOREBOARD) & ROW 2 (TURN STATUS & TIMER) */}
      <div
        data-testid="multiplayer-hud-container"
        className="fixed top-3 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-2 pointer-events-auto select-none max-w-[95vw]"
      >
        {/* ROW 1: DUAL-PLAYER SCOREBOARD BAR */}
        <div
          data-testid="multiplayer-hud-scoreboard-row"
          className="flex items-center gap-2 sm:gap-3 bg-[#fdfbf7]/95 border-2 border-[#eee6dc] border-b-[4px] border-b-[#ded4c5] px-3 py-1.5 rounded-2xl shadow-lg backdrop-blur-sm"
        >
          {/* P1 Box (Host - Blue) */}
          <div
            data-testid="multiplayer-p1-card"
            className={`px-2.5 py-1 rounded-xl border flex items-center gap-2 transition-all ${
              currentTurnPlayerId === (isHost ? localPlayer.id : remotePlayer?.id)
                ? 'bg-blue-600 border-blue-700 text-white font-black shadow-sm'
                : 'bg-white border-stone-200 text-stone-800'
            }`}
          >
            <div className="w-6 h-6 rounded-full bg-blue-100 border border-blue-400 flex items-center justify-center text-[11px] font-bold shadow-inner">
              🔵
            </div>
            <div className="flex flex-col">
              <span className="font-heading font-black text-xs leading-none truncate max-w-[70px] sm:max-w-[100px]">
                {isHost ? localPlayer.name : remotePlayer?.name || 'Tuan Rumah'}
              </span>
              <span className="text-[10px] font-bold opacity-80 leading-tight">Skor: {p1Score}</span>
            </div>
          </div>

          {/* VS Divider */}
          <div className="font-heading font-black text-stone-400 text-xs px-1">
            VS
          </div>

          {/* P2 Box (Guest - Red) */}
          <div
            data-testid="multiplayer-p2-card"
            className={`px-2.5 py-1 rounded-xl border flex items-center gap-2 transition-all ${
              currentTurnPlayerId === (!isHost ? localPlayer.id : remotePlayer?.id)
                ? 'bg-red-600 border-red-700 text-white font-black shadow-sm'
                : 'bg-white border-stone-200 text-stone-800'
            }`}
          >
            <div className="flex flex-col text-right">
              <span className="font-heading font-black text-xs leading-none truncate max-w-[70px] sm:max-w-[100px]">
                {!isHost ? localPlayer.name : remotePlayer?.name || 'Lawan'}
              </span>
              <span className="text-[10px] font-bold opacity-80 leading-tight">Skor: {p2Score}</span>
            </div>
            <div className="w-6 h-6 rounded-full bg-red-100 border border-red-400 flex items-center justify-center text-[11px] font-bold shadow-inner">
              🔴
            </div>
          </div>

          {/* Leave Room Button */}
          <button
            data-testid="multiplayer-leave-btn"
            onClick={handleLeave}
            title="Keluar dari Kamar"
            className="w-7 h-7 rounded-lg bg-stone-200 hover:bg-red-500 hover:text-white border border-stone-300 flex items-center justify-center text-stone-600 transition-colors shadow-sm cursor-pointer ml-1"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* ROW 2: TURN STATUS BADGE + TIMER / SANTAI + PING */}
        <div
          data-testid="multiplayer-hud-turn-row"
          className="flex items-center gap-2 animate-in fade-in slide-in-from-top-1"
        >
          {matchPhase === 'TOSS_PHASE' ? (
            <div
              data-testid="multiplayer-toss-badge"
              className="px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 border-2 border-amber-600 text-white font-heading font-black text-xs sm:text-sm tracking-wide shadow-md flex items-center gap-2 animate-pulse"
            >
              <span>🎯</span>
              <span>{tossBannerMessage || 'FASE LEMPAR NIAT: Lempar mendekati lingkaran!'}</span>
            </div>
          ) : (
            <>
              {/* Turn Badge */}
              <div
                data-testid="multiplayer-turn-badge"
                className={`px-3.5 py-1 rounded-full border-2 font-heading font-black text-xs sm:text-sm tracking-wide shadow-md flex items-center gap-1.5 transition-all ${
                  isMyTurn
                    ? 'bg-emerald-500 border-emerald-600 text-white animate-pulse'
                    : 'bg-amber-500 border-amber-600 text-white'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                <span>{isMyTurn ? 'GILIRANMU!' : 'GILIRAN LAWAN'}</span>
              </div>

              {/* Timer Badge (or Santai) */}
              <div
                data-testid="multiplayer-timer-badge"
                className="px-3 py-1 rounded-full bg-stone-800/90 border border-stone-700 text-white font-heading font-black text-xs shadow-md flex items-center gap-1"
              >
                {turnTimeLimitSeconds === null ? (
                  <span className="text-amber-300">☕ Santai</span>
                ) : (
                  <span className={turnTimer !== null && turnTimer <= 5 ? 'text-red-400 animate-pulse font-mono' : 'font-mono'}>
                    ⏱️ {turnTimer !== null ? `${turnTimer}s` : `${turnTimeLimitSeconds}s`}
                  </span>
                )}
              </div>

              {/* Ping Latency */}
              {pingMs > 0 && (
                <div
                  data-testid="multiplayer-ping-badge"
                  className="px-2 py-0.5 rounded-full bg-stone-900/60 text-stone-300 font-mono text-[10px] font-bold"
                >
                  ⚡ {pingMs}ms
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* MATCH OVER MODAL FOR MULTIPLAYER */}
      {isGameOver && (
        <div
          data-testid="multiplayer-gameover-modal"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in select-none"
        >
          <div className="w-full max-w-sm bg-[#fdfbf7] rounded-3xl border-4 border-[#eee6dc] border-b-[8px] border-b-[#ded4c5] p-6 shadow-2xl flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-amber-100 border-2 border-amber-300 flex items-center justify-center text-3xl shadow-inner animate-bounce">
              <Trophy className="w-8 h-8 text-amber-600" />
            </div>

            <div className="flex flex-col gap-1">
              <h2 className="font-heading font-black text-2xl text-stone-900">
                {myScore > opponentScore
                  ? 'KAMU MENANG! 🎉'
                  : myScore < opponentScore
                  ? 'LAWAN MENANG! 🎖️'
                  : 'HASIL IMBANG! 🤝'}
              </h2>
              <p className="text-xs font-bold text-stone-500">
                Pertandingan Kelereng Selesai
              </p>
            </div>

            {/* Score Comparison */}
            <div className="flex items-center justify-center gap-6 w-full py-3 bg-stone-100 rounded-2xl border border-stone-200">
              <div className="flex flex-col items-center">
                <span className="text-[11px] font-bold text-stone-500">Kamu</span>
                <span className="font-heading font-black text-2xl text-stone-900">{myScore}</span>
              </div>
              <div className="font-heading font-black text-stone-400 text-lg">VS</div>
              <div className="flex flex-col items-center">
                <span className="text-[11px] font-bold text-stone-500">Lawan</span>
                <span className="font-heading font-black text-2xl text-stone-900">{opponentScore}</span>
              </div>
            </div>

            {/* Rematch Actions */}
            <div className="flex flex-col gap-2 w-full mt-2">
              {rematchRequestedBy ? (
                <button
                  data-testid="multiplayer-accept-rematch-btn"
                  onClick={acceptRematch}
                  className="w-full bg-[#84cc16] hover:bg-[#94dc26] border-2 border-[#65a30d] border-b-[4px] border-b-[#3f6212] text-white font-heading font-black text-sm py-2.5 px-4 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Terima Tanding Ulang!</span>
                </button>
              ) : (
                <button
                  data-testid="multiplayer-request-rematch-btn"
                  onClick={requestRematch}
                  className="w-full bg-[#0284c7] hover:bg-[#38bdf8] border-2 border-[#0369a1] border-b-[4px] border-b-[#075985] text-white font-heading font-black text-sm py-2.5 px-4 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Ajak Tanding Ulang</span>
                </button>
              )}

              <button
                data-testid="multiplayer-exit-menu-btn"
                onClick={leaveRoom}
                className="w-full py-2.5 px-4 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-700 font-heading font-bold text-xs transition-all cursor-pointer"
              >
                Kembali ke Menu Utama
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
