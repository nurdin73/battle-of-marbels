import React, { useState } from 'react';
import {
  Users,
  Copy,
  Check,
  Play,
  X,
  Wifi,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { useMultiplayerStore } from '../../store/useMultiplayerStore';
import { useGameStore } from '../../store/useGameStore';
import { MarbleMaterialType } from '../../types/physics.types';

const MATERIAL_OPTIONS: { id: MarbleMaterialType; name: string; desc: string; color: string }[] = [
  {
    id: 'GLASS_CLASSIC',
    name: 'Kaca Beling',
    desc: 'Lincah & pantulan tinggi',
    color: '#38bdf8',
  },
  {
    id: 'MARBLE_STONE',
    name: 'Batu Kali',
    desc: 'Bobot padat & stabil',
    color: '#a8a29e',
  },
  {
    id: 'BEARING_STEEL',
    name: 'Besi Gotri',
    desc: 'Benturan berat & telak',
    color: '#cbd5e1',
  },
];

export const PvPLobbyModal: React.FC = () => {
  const isLobbyModalOpen = useMultiplayerStore((s) => s.isLobbyModalOpen);
  const closeLobbyModal = useMultiplayerStore((s) => s.closeLobbyModal);
  const status = useMultiplayerStore((s) => s.status);
  const role = useMultiplayerStore((s) => s.role);
  const roomId = useMultiplayerStore((s) => s.roomId);
  const errorMessage = useMultiplayerStore((s) => s.errorMessage);
  const localPlayer = useMultiplayerStore((s) => s.localPlayer);
  const opponentPlayer = useMultiplayerStore((s) => s.opponentPlayer);

  const setLocalPlayerName = useMultiplayerStore((s) => s.setLocalPlayerName);
  const setLocalGacoanMaterial = useMultiplayerStore((s) => s.setLocalGacoanMaterial);
  const createRoom = useMultiplayerStore((s) => s.createRoom);
  const joinRoom = useMultiplayerStore((s) => s.joinRoom);
  const startPvPMatch = useMultiplayerStore((s) => s.startPvPMatch);
  const leaveMatch = useMultiplayerStore((s) => s.leaveMatch);

  const [activeTab, setActiveTab] = useState<'HOST' | 'JOIN'>('HOST');
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isLobbyModalOpen) return null;

  const handleCopyCode = () => {
    if (roomId) {
      navigator.clipboard.writeText(roomId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleStartHostGame = () => {
    startPvPMatch(9);
    // Switch game screen to PLAYING
    useGameStore.getState().startMatchWithMarbleCount(9);
    useGameStore.getState().setGacoanMaterial(localPlayer.gacoanMaterial);
  };

  const isConnected = status === 'CONNECTED';
  const isWaiting = status === 'WAITING_FOR_OPPONENT';
  const isConnecting = status === 'CONNECTING' || status === 'CREATING_ROOM';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in pointer-events-auto select-none"
      data-testid="pvp-lobby-modal"
      onClick={() => {
        if (role !== 'OFFLINE') leaveMatch();
        closeLobbyModal();
      }}
    >
      <div
        className="relative w-full max-w-lg bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 text-stone-100 shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow accent */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-5 border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white font-sans">
                Adu Kelereng 1 vs 1
              </h2>
              <p className="text-xs text-stone-400">
                Multiplayer Online P2P WebRTC (Tanpa Lag)
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              if (role !== 'OFFLINE') leaveMatch();
              closeLobbyModal();
            }}
            className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="mt-4 p-3 rounded-2xl bg-red-950/60 border border-red-800 text-red-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Step 1: Local Player Customization */}
        {!isConnected && !isWaiting && (
          <div className="mt-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wider mb-1.5">
                Nama Pemain
              </label>
              <input
                type="text"
                value={localPlayer.name}
                onChange={(e) => setLocalPlayerName(e.target.value)}
                maxLength={16}
                placeholder="Masukkan namamu..."
                className="w-full px-4 py-2.5 rounded-xl bg-stone-950/80 border border-stone-800 text-white placeholder-stone-600 focus:outline-none focus:border-amber-500 text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">
                Pilih Material Gacoan
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {MATERIAL_OPTIONS.map((opt) => {
                  const isSelected = localPlayer.gacoanMaterial === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => setLocalGacoanMaterial(opt.id)}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        isSelected
                          ? 'border-amber-500 bg-amber-500/10 shadow-sm shadow-amber-500/20'
                          : 'border-stone-800 bg-stone-950/40 hover:border-stone-700'
                      }`}
                    >
                      <div
                        className="w-4 h-4 rounded-full mb-2"
                        style={{ backgroundColor: opt.color }}
                      />
                      <div className="text-xs font-bold text-stone-200">{opt.name}</div>
                      <div className="text-[10px] text-stone-400 mt-0.5 leading-tight">
                        {opt.desc}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mode Tabs */}
            <div className="pt-2">
              <div className="flex rounded-2xl bg-stone-950/80 p-1 border border-stone-800">
                <button
                  onClick={() => setActiveTab('HOST')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
                    activeTab === 'HOST'
                      ? 'bg-stone-800 text-white shadow-sm'
                      : 'text-stone-400 hover:text-white'
                  }`}
                >
                  Buat Kamar (Host)
                </button>
                <button
                  onClick={() => setActiveTab('JOIN')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
                    activeTab === 'JOIN'
                      ? 'bg-stone-800 text-white shadow-sm'
                      : 'text-stone-400 hover:text-white'
                  }`}
                >
                  Gabung Kamar
                </button>
              </div>
            </div>

            {/* Tab Actions */}
            {activeTab === 'HOST' ? (
              <div className="pt-2">
                <button
                  onClick={() => createRoom()}
                  disabled={isConnecting}
                  className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-stone-950 font-bold text-sm tracking-wide shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-transform active:scale-[0.98] disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isConnecting ? 'Membuat Kamar...' : 'Buat Kamar Baru'}</span>
                </button>
              </div>
            ) : (
              <div className="pt-2 space-y-3">
                <input
                  type="text"
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                  placeholder="KODE KAMAR (MISAL: KLRNG-7842)"
                  maxLength={12}
                  className="w-full px-4 py-3 rounded-xl bg-stone-950/80 border border-stone-800 text-white placeholder-stone-600 focus:outline-none focus:border-amber-500 text-sm font-mono tracking-widest text-center"
                />
                <button
                  onClick={() => joinRoom(joinCodeInput)}
                  disabled={!joinCodeInput.trim() || isConnecting}
                  className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-sm tracking-wide shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-transform active:scale-[0.98] disabled:opacity-50"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>{isConnecting ? 'Menghubungkan...' : 'Gabung Pertandingan'}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Waiting for Guest in Host Room */}
        {isWaiting && roomId && (
          <div className="mt-6 text-center space-y-5 animate-fade-in">
            <div className="p-5 rounded-2xl bg-stone-950/80 border border-stone-800 space-y-2">
              <span className="text-xs uppercase tracking-widest text-stone-400 font-semibold">
                Kode Kamar Pertandingan
              </span>
              <div className="text-3xl font-mono font-black text-amber-400 tracking-wider">
                {roomId}
              </div>
              <p className="text-xs text-stone-400 max-w-xs mx-auto">
                Bagikan kode ini kepada temanmu. Mereka tinggal memasukkan kode ini di tab "Gabung Kamar".
              </p>
              <div className="pt-2">
                <button
                  onClick={handleCopyCode}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-xs font-semibold text-white transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Tersalin ke Clipboard!' : 'Salin Kode Kamar'}</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 text-xs text-amber-400/90 font-medium">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
              <span>Menunggu lawan bergabung ke arena...</span>
            </div>

            <button
              onClick={() => leaveMatch()}
              className="text-xs text-stone-400 hover:text-stone-300 underline"
            >
              Batalkan Kamar
            </button>
          </div>
        )}

        {/* Step 3: Connected Match Lobby */}
        {isConnected && opponentPlayer && (
          <div className="mt-6 space-y-5 animate-fade-in">
            <div className="grid grid-cols-2 gap-3">
              {/* Player 1 Card */}
              <div className="p-4 rounded-2xl bg-stone-950/80 border border-amber-500/40 space-y-2">
                <div className="text-[10px] uppercase font-bold tracking-wider text-amber-400 flex items-center justify-between">
                  <span>{role === 'HOST' ? 'Kamu (Host)' : 'Lawan (Host)'}</span>
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <div className="text-sm font-bold text-white truncate">
                  {role === 'HOST' ? localPlayer.name : opponentPlayer.name}
                </div>
                <div className="text-xs text-stone-400">
                  Gacoan: {role === 'HOST' ? localPlayer.gacoanMaterial : opponentPlayer.gacoanMaterial}
                </div>
              </div>

              {/* Player 2 Card */}
              <div className="p-4 rounded-2xl bg-stone-950/80 border border-emerald-500/40 space-y-2">
                <div className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 flex items-center justify-between">
                  <span>{role === 'GUEST' ? 'Kamu (Guest)' : 'Lawan (Guest)'}</span>
                  <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="text-sm font-bold text-white truncate">
                  {role === 'GUEST' ? localPlayer.name : opponentPlayer.name}
                </div>
                <div className="text-xs text-stone-400">
                  Gacoan: {role === 'GUEST' ? localPlayer.gacoanMaterial : opponentPlayer.gacoanMaterial}
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-2">
              {role === 'HOST' ? (
                <button
                  onClick={handleStartHostGame}
                  className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-stone-950 font-black text-sm tracking-wide shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>MULAI PERTANDINGAN ADU KELERENG</span>
                </button>
              ) : (
                <div className="p-4 rounded-2xl bg-stone-950/60 border border-stone-800 text-center space-y-1">
                  <div className="text-xs text-amber-400 font-semibold flex items-center justify-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    <span>Tersambung dengan Host!</span>
                  </div>
                  <p className="text-xs text-stone-400">
                    Menunggu Host menekan tombol mulai pertandingan...
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
