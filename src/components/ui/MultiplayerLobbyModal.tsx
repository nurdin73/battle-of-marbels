import React, { useState } from 'react';
import { useMultiplayerStore } from '../../store/useMultiplayerStore';
import { usePlayerWalletStore } from '../../store/usePlayerWalletStore';
import { useRouter } from '../../router';
import { marbleAudio } from '../../utils/soundSynth.utils';
import { Users, AlertCircle } from 'lucide-react';

const TIMER_OPTIONS: { seconds: number | null; label: string; desc: string }[] = [
  { seconds: 15, label: '15 Detik', desc: 'Kilat' },
  { seconds: 20, label: '20 Detik', desc: 'Standar' },
  { seconds: 30, label: '30 Detik', desc: 'Taktis' },
  { seconds: null, label: '☕ Santai', desc: 'Bebas' },
];

export const MultiplayerLobbyModal: React.FC = () => {
  const { navigate } = useRouter();
  const isLobbyModalOpen = useMultiplayerStore((s) => s.isLobbyModalOpen);
  const closeLobbyModal = useMultiplayerStore((s) => s.closeLobbyModal);
  const localPlayer = useMultiplayerStore((s) => s.localPlayer);
  const errorMessage = useMultiplayerStore((s) => s.errorMessage);
  const hostRoom = useMultiplayerStore((s) => s.hostRoom);
  const leaveRoom = useMultiplayerStore((s) => s.leaveRoom);
  const setLocalPlayerName = useMultiplayerStore((s) => s.setLocalPlayerName);

  const walletBalance = usePlayerWalletStore((s) => s.balance);
  const refillBalance = usePlayerWalletStore((s) => s.refillBalance);

  const [activeTab, setActiveTab] = useState<'HOST' | 'JOIN'>('HOST');
  const [selectedBetAmount, setSelectedBetAmount] = useState<number>(5);
  const [selectedTimer, setSelectedTimer] = useState<number | null>(20);
  const [inputCode, setInputCode] = useState<string>('');
  const [playerNameInput, setPlayerNameInput] = useState<string>(localPlayer.name);

  if (!isLobbyModalOpen) return null;

  const handleStartHosting = async () => {
    marbleAudio.playWoodKnockSound(1.2);
    setLocalPlayerName(playerNameInput);
    closeLobbyModal();
    const createdCode = await hostRoom(selectedBetAmount, selectedTimer);
    if (createdCode) {
      navigate(`/rooms/${createdCode}`);
    }
  };

  const handleJoin = async () => {
    const clean = inputCode.trim().toUpperCase();
    if (!clean) return;
    marbleAudio.playWoodKnockSound(1.2);
    setLocalPlayerName(playerNameInput);
    closeLobbyModal();
    navigate(`/rooms/${clean}`);
  };

  const handleCancel = () => {
    marbleAudio.playWoodKnockSound(1.0);
    leaveRoom();
    closeLobbyModal();
  };

  return (
    <div
      data-testid="multiplayer-lobby-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
    >
      <div
        data-testid="multiplayer-lobby-card"
        className="relative w-full max-w-md bg-[#fdfbf7] rounded-3xl border-4 border-[#eee6dc] border-b-[8px] border-b-[#ded4c5] shadow-2xl p-5 sm:p-6 flex flex-col gap-4 text-stone-800 select-none max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-stone-200/80 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-red-100 border-2 border-red-300 flex items-center justify-center text-red-600 shadow-inner">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-heading font-black text-xl sm:text-2xl text-stone-900 leading-tight">
                MULTIPLAYER PvP
              </h2>
              <p className="text-xs font-semibold text-stone-500">Tanding Kelereng 1-vs-1 Real-Time</p>
            </div>
          </div>

          <button
            data-testid="multiplayer-close-btn"
            onClick={handleCancel}
            className="w-9 h-9 rounded-xl bg-stone-200 hover:bg-stone-300 active:translate-y-[1px] flex items-center justify-center text-stone-600 font-bold transition-all cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Player Name Input */}
        <div className="flex flex-col gap-1.5 bg-amber-50/70 p-3 rounded-2xl border border-amber-200/80">
          <label className="text-xs font-heading font-black text-amber-900 flex items-center gap-1.5">
            <span>NAMA JAWARAMU:</span>
          </label>
          <input
            data-testid="multiplayer-player-name-input"
            type="text"
            maxLength={16}
            value={playerNameInput}
            onChange={(e) => setPlayerNameInput(e.target.value)}
            placeholder="Ketik nama pemain..."
            className="w-full px-3 py-1.5 rounded-xl border-2 border-amber-300/80 bg-white font-heading font-bold text-stone-800 text-sm focus:outline-none focus:border-amber-500 shadow-inner"
          />
        </div>

        {/* Dompet Kelereng Pemain */}
        <div
          data-testid="multiplayer-wallet-card"
          className="flex items-center justify-between bg-amber-100/70 border-2 border-amber-300/80 p-2.5 rounded-2xl shadow-inner"
        >
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-white border border-amber-400 flex items-center justify-center text-sm shadow-sm">
              ⚪
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-heading font-black text-amber-900 leading-none">
                DOMPET KELERENG
              </span>
              <span className="font-heading font-black text-sm text-stone-900 leading-tight">
                {walletBalance} <span className="text-xs font-bold text-stone-600">Butir</span>
              </span>
            </div>
          </div>
          <button
            data-testid="multiplayer-refill-wallet-btn"
            onClick={() => {
              marbleAudio.playWoodKnockSound(1.0);
              refillBalance();
            }}
            className="px-2.5 py-1 rounded-xl bg-amber-400 hover:bg-amber-500 active:translate-y-[1px] text-amber-950 font-heading font-black text-[11px] shadow-xs cursor-pointer border border-amber-500"
            title="Isi ulang modal awal ke 50 kelereng"
          >
            + Isi Ulang (50)
          </button>
        </div>

        {/* Error Alert if any */}
        {errorMessage && (
          <div
            data-testid="multiplayer-error-banner"
            className="flex items-center gap-2 p-3 rounded-2xl bg-red-100 border-2 border-red-300 text-red-800 text-xs font-bold"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Mode Selector (Tabs Host vs Join) */}
        <div className="flex flex-col gap-4">
          {/* Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-stone-200/80 rounded-2xl">
            <button
              data-testid="multiplayer-tab-host"
              onClick={() => {
                marbleAudio.playWoodKnockSound(0.9);
                setActiveTab('HOST');
              }}
              className={`py-2 rounded-xl font-heading font-black text-xs sm:text-sm transition-all cursor-pointer ${
                activeTab === 'HOST'
                  ? 'bg-white text-stone-900 shadow-sm border border-stone-300'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              📡 BUAT KAMAR
            </button>
            <button
              data-testid="multiplayer-tab-join"
              onClick={() => {
                marbleAudio.playWoodKnockSound(0.9);
                setActiveTab('JOIN');
              }}
              className={`py-2 rounded-xl font-heading font-black text-xs sm:text-sm transition-all cursor-pointer ${
                activeTab === 'JOIN'
                  ? 'bg-white text-stone-900 shadow-sm border border-stone-300'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              🎮 GABUNG KAMAR
            </button>
          </div>

          {/* TAB CONTENT: HOST */}
          {activeTab === 'HOST' && (
            <div className="flex flex-col gap-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-heading font-black text-stone-700">
                    TARUHAN KELERENG PER PEMAIN:
                  </label>
                  <span className="text-[11px] font-black text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full">
                    Arena: {selectedBetAmount * 2} Butir
                  </span>
                </div>
                <div role="radiogroup" aria-label="Taruhan Kelereng Per Pemain" className="grid grid-cols-4 gap-2">
                  {[3, 5, 7, 10].map((bet) => {
                    const isSelected = selectedBetAmount === bet;
                    const isAffordable = walletBalance >= bet;
                    return (
                      <button
                        key={bet}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        disabled={!isAffordable}
                        onClick={() => {
                          marbleAudio.playWoodKnockSound(1.0);
                          setSelectedBetAmount(bet);
                        }}
                        className={`py-2 px-1 rounded-xl text-center border-2 transition-all cursor-pointer flex flex-col items-center justify-between gap-0.5 ${
                          !isAffordable
                            ? 'opacity-40 bg-stone-100 border-stone-200 cursor-not-allowed'
                            : isSelected
                            ? 'bg-amber-100 border-amber-500 border-b-[3px] border-b-amber-700 text-amber-950 font-black shadow-sm ring-2 ring-amber-400/30'
                            : 'bg-stone-50 border-stone-300 border-b-[3px] border-b-stone-400 text-stone-700 hover:bg-stone-100 font-bold active:translate-y-[1px]'
                        }`}
                      >
                        <span className="font-heading font-black text-xs">{bet} Butir</span>
                        <span className="text-[9px] text-stone-500 font-bold">Arena: {bet * 2}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="mt-1.5 p-2 rounded-xl bg-amber-50/80 border border-amber-200 text-[11px] font-medium text-stone-600 flex items-center justify-between">
                  <span>Kamu: <strong>{selectedBetAmount}</strong> + Lawan: <strong>{selectedBetAmount}</strong></span>
                  <span className="font-bold text-amber-900">Total Taruhan: {selectedBetAmount * 2} Bola</span>
                </div>
              </div>

              {/* Option Buttons: Batas Waktu Giliran */}
              <div>
                <label className="text-xs font-heading font-black text-stone-700 mb-1.5 block">
                  BATAS WAKTU GILIRAN (TIMER):
                </label>
                <div role="radiogroup" aria-label="Batas Waktu Giliran" className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {TIMER_OPTIONS.map((opt) => {
                    const isSelected = selectedTimer === opt.seconds;
                    return (
                      <button
                        key={`lobby-timer-${opt.seconds ?? 'santai'}`}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        data-testid={`lobby-timer-opt-${opt.seconds ?? 'santai'}`}
                        onClick={() => {
                          marbleAudio.playWoodKnockSound(1.0);
                          setSelectedTimer(opt.seconds);
                        }}
                        className={`py-2 px-2.5 rounded-xl text-left border-2 transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-emerald-50 border-emerald-500 border-b-[3px] border-b-emerald-700 text-emerald-950 font-black shadow-sm ring-2 ring-emerald-400/30'
                            : 'bg-stone-50 border-stone-300 border-b-[3px] border-b-stone-400 text-stone-700 hover:bg-stone-100 font-bold active:translate-y-[1px]'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <span className="font-heading text-xs font-black">{opt.label}</span>
                          <div
                            className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                              isSelected ? 'border-emerald-600 bg-white' : 'border-stone-400 bg-stone-200'
                            }`}
                          >
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-emerald-600" />}
                          </div>
                        </div>
                        <span className="text-[10px] text-stone-500 font-semibold">{opt.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                data-testid="multiplayer-create-room-btn"
                onClick={handleStartHosting}
                disabled={walletBalance < selectedBetAmount}
                className="w-full mt-2 bg-[#84cc16] hover:bg-[#94dc26] border-2 border-[#65a30d] border-b-[5px] border-b-[#3f6212] text-white font-heading font-black text-base py-3 px-6 rounded-2xl shadow-lg active:translate-y-[2px] active:border-b-[2px] transition-all cursor-pointer flex items-center justify-center text-stroke-black-heavy disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {walletBalance < selectedBetAmount
                  ? `KELERENG TIDAK CUKUP (${walletBalance}/${selectedBetAmount})`
                  : `PASANG TARUHAN (${selectedBetAmount}) & BUAT RUANG`}
              </button>
            </div>
          )}

          {/* TAB CONTENT: JOIN */}
          {activeTab === 'JOIN' && (
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-heading font-black text-stone-700 mb-1.5 block">
                  MASUKKAN KODE KAMAR (6 DIGIT):
                </label>
                <input
                  data-testid="multiplayer-input-room-code"
                  type="text"
                  maxLength={8}
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                  placeholder="Contoh: KL79B2"
                  className="w-full px-4 py-3 rounded-2xl border-2 border-stone-300 bg-white font-heading font-black text-xl text-center text-stone-900 tracking-widest uppercase focus:outline-none focus:border-red-500 shadow-inner"
                />
              </div>

              <button
                data-testid="multiplayer-join-room-btn"
                onClick={handleJoin}
                disabled={!inputCode.trim() || walletBalance < 3}
                className="w-full mt-2 bg-[#ef4444] hover:bg-[#f87171] border-2 border-[#dc2626] border-b-[5px] border-b-[#991b1b] text-white font-heading font-black text-base py-3 px-6 rounded-2xl shadow-lg active:translate-y-[2px] active:border-b-[2px] transition-all cursor-pointer flex items-center justify-center text-stroke-black-heavy disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {walletBalance < 3 ? 'KELERENG TIDAK CUKUP UNTUK TARUHAN' : 'GABUNG KE PERTANDINGAN'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
