import React, { useState } from 'react';
import { PowerMeter } from './PowerMeter';
import { DebugControls } from './DebugControls';
import { TurnTimer } from './TurnTimer';
import { TurnFeedbackBanner } from './TurnFeedbackBanner';
import { GameOverModal } from './GameOverModal';
import { CardDeckOverlay } from './CardDeckOverlay';
import { LevelSelectModal } from './LevelSelectModal';
import { GameMenuDrawer } from './GameMenuDrawer';
import { HelpModal } from './HelpModal';
import { Menu } from 'lucide-react';

export const HUDOverlay: React.FC = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '?' || e.key === 'h' || e.key === 'H') {
        setIsHelpOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      {/* Sliding Menu & Info Drawer */}
      <GameMenuDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />

      {/* User Guide & Keyboard Controls Help Modal (?) */}
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      {/* Dynamic Feedback Banner (transient notifications) */}
      <TurnFeedbackBanner />

      {/* Game Over Victory Modal */}
      <GameOverModal />

      {/* Level Select Modal */}
      <LevelSelectModal />

      {/* Tactical Card Deck Overlay (bottom hand) */}
      <CardDeckOverlay />

      <div
        data-testid="hud-overlay"
        className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 sm:p-6 select-none"
      >
        {/* Top In-Game Bar: Menu, Turn Timer, Controls (Eye/Sound/Reset/Help) */}
        <header className="flex items-center justify-between w-full pointer-events-auto">
          {/* Left: Menu Drawer Trigger */}
          <button
            data-testid="open-menu-drawer-btn"
            onClick={() => setIsDrawerOpen(true)}
            className="timbul-btn-cream px-3.5 py-2 flex items-center gap-2 text-xs font-black text-stone-700 cursor-pointer shadow-sm"
            title="Buka Menu & Info Permainan"
          >
            <Menu className="w-4 h-4 text-stone-600" />
            <span className="hidden sm:inline">Menu</span>
          </button>

          {/* Center: Sisa Waktu Turn Timer */}
          <div className="flex items-center justify-center">
            <TurnTimer />
          </div>

          {/* Right: Eye, Sound, Reset & Help (?) Controls */}
          <DebugControls onOpenHelp={() => setIsHelpOpen(true)} />
        </header>

        {/* Dynamic Power Meter (appears only when aiming/dragging) */}
        <PowerMeter />

        {/* Clean Bottom Spacing (Hands of Cards occupy bottom) */}
        <div className="pointer-events-none h-16 sm:h-20" />
      </div>
    </>
  );
};

