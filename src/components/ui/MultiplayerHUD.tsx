import React from 'react';
import { useMultiplayerStore } from '../../store/useMultiplayerStore';
import { useGameStore } from '../../store/useGameStore';
import { usePlayerWalletStore } from '../../store/usePlayerWalletStore';
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

  const isMatchOver = useMultiplayerStore((s) => s.isMatchOver);
  const betAmount = useMultiplayerStore((s) => s.betAmount);
  const targetCount = useMultiplayerStore((s) => s.targetCount);
  const cameraFocusMode = useMultiplayerStore((s) => s.cameraFocusMode);
  const setCameraFocusMode = useMultiplayerStore((s) => s.setCameraFocusMode);
  const currentScreen = useGameStore((s) => s.currentScreen);
  const matchPhase = useMultiplayerStore((s) => s.matchPhase);
  const tossBannerMessage = useMultiplayerStore((s) => s.tossBannerMessage);
  const turnTimeLimitSeconds = useMultiplayerStore((s) => s.turnTimeLimitSeconds);
  const gacoanP1Pos = useMultiplayerStore((s) => s.gacoanP1Pos);
  const gacoanP2Pos = useMultiplayerStore((s) => s.gacoanP2Pos);
  const turnTimer = useGameStore((s) => s.turnTimer);

  const walletBalance = usePlayerWalletStore((s) => s.balance);

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
  const remainingMarbles = Math.max(0, targetCount - (p1Score + p2Score));

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
              <span className="text-[10px] font-bold opacity-90 leading-tight">
                ⚪ {p1Score} Butir Didapat
              </span>
            </div>
          </div>

          {/* VS Divider & Remaining Marbles */}
          <div className="flex flex-col items-center px-1">
            <span className="font-heading font-black text-stone-400 text-[10px]">VS</span>
            {matchPhase === 'PLAYING' && (
              <span
                data-testid="multiplayer-remaining-marbles-badge"
                className="text-[9px] font-extrabold text-amber-800 bg-amber-100 border border-amber-300 px-1.5 py-0.2 rounded-full whitespace-nowrap shadow-xs"
                title="Sisa kelereng di lingkaran arena"
              >
                🎯 Sisa: {remainingMarbles}
              </span>
            )}
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
              <span className="text-[10px] font-bold opacity-90 leading-tight">
                ⚪ {p2Score} Butir Didapat
              </span>
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

        {/* ROW 3: SPECTATOR FREE-ROAM CONTROLS (WHEN WAITING FOR OPPONENT) */}
        {!isMyTurn && matchPhase === 'PLAYING' && (
          <div
            data-testid="multiplayer-spectator-controls"
            className="flex items-center gap-1.5 bg-[#fdfbf7]/95 border-2 border-[#eee6dc] border-b-[3px] border-b-[#ded4c5] px-2.5 py-1 rounded-2xl shadow-md text-xs backdrop-blur-sm animate-in fade-in"
          >
            <span className="font-heading font-black text-stone-600 text-[11px] flex items-center gap-1 mr-1">
              <span>🎥</span>
              <span>Kamera:</span>
            </span>

            <button
              data-testid="focus-auto-btn"
              onClick={() => {
                marbleAudio.playWoodKnockSound(1.0);
                setCameraFocusMode('AUTO');
              }}
              className={`px-2 py-0.5 text-[10px] font-heading font-black rounded-lg transition-all active:translate-y-[1px] cursor-pointer ${
                cameraFocusMode === 'AUTO'
                  ? 'bg-amber-400 text-stone-900 shadow-sm border border-amber-500'
                  : 'timbul-btn-cream text-stone-700'
              }`}
              title="Kamera otomatis mengikuti kelereng yang sedang aktif"
            >
              Auto
            </button>

            <button
              data-testid="focus-opponent-btn"
              onClick={() => {
                marbleAudio.playWoodKnockSound(1.0);
                setCameraFocusMode('OPPONENT');
                const targetPos = isHost ? gacoanP2Pos : gacoanP1Pos;
                useMultiplayerStore.getState().setCameraFocusTarget(targetPos);
              }}
              className={`px-2 py-0.5 text-[10px] font-heading font-black rounded-lg transition-all active:translate-y-[1px] cursor-pointer ${
                cameraFocusMode === 'OPPONENT'
                  ? 'bg-amber-400 text-stone-900 shadow-sm border border-amber-500'
                  : 'timbul-btn-cream text-stone-700'
              }`}
              title="Fokuskan kamera mengikuti gacoan lawan secara realtime"
            >
              Lawan
            </button>

            <button
              data-testid="focus-self-btn"
              onClick={() => {
                marbleAudio.playWoodKnockSound(1.0);
                setCameraFocusMode('SELF');
                const targetPos = isHost ? gacoanP1Pos : gacoanP2Pos;
                useMultiplayerStore.getState().setCameraFocusTarget(targetPos);
              }}
              className={`px-2 py-0.5 text-[10px] font-heading font-black rounded-lg transition-all active:translate-y-[1px] cursor-pointer ${
                cameraFocusMode === 'SELF'
                  ? 'bg-amber-400 text-stone-900 shadow-sm border border-amber-500'
                  : 'timbul-btn-cream text-stone-700'
              }`}
              title="Fokuskan kamera kembali ke gacoan saya"
            >
              Saya
            </button>
          </div>
        )}
      </div>

      {/* MATCH OVER MODAL FOR MULTIPLAYER */}
      {isMatchOver && (
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

            {/* Score & Marble Statistics Breakdown */}
            <div
              data-testid="multiplayer-marble-stats-card"
              className="w-full bg-[#f4ece1] rounded-2xl border-2 border-[#e6dbc9] p-3.5 flex flex-col gap-2.5 text-left"
            >
              <div className="flex items-center justify-between text-xs font-bold text-stone-600 border-b border-stone-300/80 pb-2">
                <span>Total Taruhan Di Arena</span>
                <span className="font-heading font-black text-stone-900 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 border border-amber-600 inline-block" />
                  {targetCount} Butir
                </span>
              </div>

              {/* Player 1 (Host) Detail */}
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-blue-700 flex items-center gap-1">
                  <span>🔵</span>
                  <span className="truncate max-w-[120px]">
                    {isHost ? localPlayer.name : remotePlayer?.name || 'Tuan Rumah'}
                  </span>
                  {isHost && <span className="text-[10px] text-blue-500 font-extrabold">(Kamu)</span>}
                </span>
                <span className="font-heading font-black text-stone-900">
                  {p1Score} Butir{' '}
                  <span className="text-[10px] text-stone-500 font-bold">
                    ({Math.round((p1Score / Math.max(1, targetCount)) * 100)}%)
                  </span>
                </span>
              </div>

              {/* Player 2 (Guest) Detail */}
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-red-700 flex items-center gap-1">
                  <span>🔴</span>
                  <span className="truncate max-w-[120px]">
                    {!isHost ? localPlayer.name : remotePlayer?.name || 'Lawan'}
                  </span>
                  {!isHost && <span className="text-[10px] text-red-500 font-extrabold">(Kamu)</span>}
                </span>
                <span className="font-heading font-black text-stone-900">
                  {p2Score} Butir{' '}
                  <span className="text-[10px] text-stone-500 font-bold">
                    ({Math.round((p2Score / Math.max(1, targetCount)) * 100)}%)
                  </span>
                </span>
              </div>

              {/* Sisa Kelereng (jika ada) */}
              {remainingMarbles > 0 && (
                <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1.5 border-t border-dashed border-stone-300">
                  <span>Sisa Kelereng di Lingkaran</span>
                  <span className="font-bold text-amber-800">{remainingMarbles} Butir</span>
                </div>
              )}
            </div>

            {/* Wager & Payout Accounting Card */}
            <div
              data-testid="multiplayer-wager-accounting-card"
              className="w-full bg-amber-50/95 rounded-2xl border-2 border-amber-300 p-3 flex flex-col gap-1.5 text-xs text-left shadow-xs"
            >
              <div className="flex items-center justify-between text-stone-700 font-bold">
                <span>Taruhan Disetor:</span>
                <span className="text-red-600 font-black">-{betAmount} Butir</span>
              </div>
              <div className="flex items-center justify-between text-stone-700 font-bold">
                <span>Kelereng yang Kamu Rebut:</span>
                <span className="text-emerald-600 font-black">+{myScore} Butir</span>
              </div>
              <div className="flex items-center justify-between pt-1.5 border-t border-amber-200/90 font-heading font-black">
                <span>Hasil Bersih:</span>
                <span className={myScore - betAmount >= 0 ? 'text-emerald-700 font-black' : 'text-red-700 font-black'}>
                  {myScore - betAmount >= 0 ? `+${myScore - betAmount}` : `${myScore - betAmount}`} Butir
                </span>
              </div>
              <div className="flex items-center justify-between pt-1.5 border-t border-dashed border-amber-300 font-heading font-black text-amber-950">
                <span className="flex items-center gap-1">
                  <span>⚪</span> Saldo Dompet Sekarang:
                </span>
                <span className="text-sm bg-white px-2 py-0.5 rounded-lg border border-amber-300 shadow-inner">
                  {walletBalance} Butir
                </span>
              </div>
            </div>

            {/* Narrative Summary */}
            <div
              data-testid="multiplayer-result-narrative"
              className="w-full text-xs font-bold text-stone-700 bg-[#fdfbf7] border border-amber-200/90 px-3 py-2 rounded-xl text-center leading-relaxed"
            >
              {myScore > opponentScore
                ? `🏆 Selamat! Kamu berhasil merebut ${myScore} butir kelereng taruhan dari lawan!`
                : myScore < opponentScore
                ? `🎖️ Lawan berhasil merebut ${opponentScore} butir kelereng. Coba ajak tanding ulang!`
                : `🤝 Pertandingan seimbang! Kalian sama-sama mendapatkan ${myScore} butir kelereng.`}
            </div>

            {/* Rematch Actions */}
            <div className="flex flex-col gap-2 w-full mt-2">
              {rematchRequestedBy ? (
                <button
                  data-testid="multiplayer-accept-rematch-btn"
                  onClick={acceptRematch}
                  disabled={walletBalance < betAmount}
                  className="w-full bg-[#84cc16] hover:bg-[#94dc26] border-2 border-[#65a30d] border-b-[4px] border-b-[#3f6212] text-white font-heading font-black text-sm py-2.5 px-4 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>
                    {walletBalance < betAmount
                      ? `Kelereng Tidak Cukup (${walletBalance}/${betAmount})`
                      : `Terima Tanding Ulang (${betAmount} Butir)!`}
                  </span>
                </button>
              ) : (
                <button
                  data-testid="multiplayer-request-rematch-btn"
                  onClick={requestRematch}
                  disabled={walletBalance < betAmount}
                  className="w-full bg-[#0284c7] hover:bg-[#38bdf8] border-2 border-[#0369a1] border-b-[4px] border-b-[#075985] text-white font-heading font-black text-sm py-2.5 px-4 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>
                    {walletBalance < betAmount
                      ? `Kelereng Tidak Cukup (${walletBalance}/${betAmount})`
                      : `Ajak Tanding Ulang (${betAmount} Butir)`}
                  </span>
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
