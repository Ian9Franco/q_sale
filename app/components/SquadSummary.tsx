import React from 'react';
import { motion } from 'motion/react';
import { Zap, Download } from 'lucide-react';
import { PlayerStatus } from '../types';

interface SquadSummaryProps {
  readyCount: number;
  players: PlayerStatus[];
  readyNowPlayers: PlayerStatus[];
  isSquadFull: boolean;
  maxSquad: number;
  handleQuickReady: () => void;
  isUpdating: boolean;
  onOpenCatalog: () => void;
  onOpenPwaModal: () => void;
  onOpenBattlePass?: () => void;
}

const BG_MAP: Record<string, string> = {
  ian: '/vesperwing1.webp',
  chango: '/Bandit.webp',
  el_mati: '/Farsight.webp',
  volvo_milei: '/Outrider.webp',
  aegis: '/Uandi.webp',
  uandi: '/Uandi.webp',
};

export default function SquadSummary({
  readyCount,
  readyNowPlayers,
  maxSquad,
  handleQuickReady,
  isUpdating,
  onOpenCatalog,
  onOpenPwaModal,
}: SquadSummaryProps) {
  return (
    <div className="flex flex-col gap-3 w-full min-w-0 p-1.5">
      {/* 1 / 5 LISTOS with guaranteed no-wrap */}
      <div className="flex flex-col items-center sm:items-start w-full px-0.5">
        <div className="flex items-baseline gap-1 whitespace-nowrap leading-none">
          <span className="text-[#52E010] text-2xl sm:text-3xl font-black">{readyCount}</span>
          <span className="text-[#F4F4E6] text-sm sm:text-base font-bold">/ {maxSquad}</span>
          <span className="text-[#52E010] text-xs sm:text-sm font-black ml-0.5 tracking-wider">LISTOS</span>
        </div>
        <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-[#EAE8D4] mt-1 whitespace-nowrap">
          Dale que llueve
        </span>
      </div>

      {/* Slot Grid: 5 slots in 1 horizontal row on mobile, 2 columns on desktop */}
      <div className="grid grid-cols-5 md:grid-cols-2 gap-1.5 sm:gap-2 w-full p-0.5">
        {[0, 1, 2, 3, 4].map((idx) => {
          const player = readyNowPlayers[idx];
          const filled = !!player;
          const bgImage = player ? (player.avatar && player.avatar.startsWith('/') ? player.avatar : (BG_MAP[player.id] || '/vesperwing1.webp')) : '';

          return (
            <div
              key={idx}
              className={`h-14 sm:h-16 rounded-xl flex flex-col items-center justify-center p-1 text-center relative overflow-hidden transition-all ${
                filled
                  ? 'border-2 border-black shadow-[0_0_0_2px_#52E010,0_3px_0_2px_#2D7A08]'
                  : 'bg-[#2D2D2D] border-2 border-black shadow-[0_0_0_1.5px_#444,inset_0_2px_4px_rgba(0,0,0,0.6)] text-[#888]'
              }`}
            >
              {filled ? (
                <>
                  {/* Background Artwork */}
                  <img
                    src={bgImage}
                    alt={player.name}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/40" />
                  <span className="relative z-10 text-[8px] sm:text-[9px] font-black text-white truncate max-w-full uppercase tracking-wider mt-auto drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
                    {player.name}
                  </span>
                </>
              ) : (
                <span className="text-[11px] sm:text-xs font-black text-[#777]">#{idx + 1}</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Controls & Action Buttons */}
      <div className="flex flex-col gap-2 w-full mt-0.5 pb-6 sm:pb-8">
        <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-[#EAE8D4]">
          CON-TROLO
        </span>

        {/* Big Green CTA Button */}
        <motion.button
          whileTap={{ scale: 0.94, y: 2 }}
          onClick={handleQuickReady}
          disabled={isUpdating}
          className="tactile-btn-green w-full py-2.5 sm:py-3 px-1.5 rounded-xl text-[11px] sm:text-xs font-black flex items-center justify-center gap-1 cursor-pointer uppercase tracking-wider shadow-md whitespace-nowrap"
        >
          <Zap size={14} className="text-black fill-black flex-shrink-0" />
          <span>¡Entrando YA!</span>
        </motion.button>

        {/* Catalog Button */}
        <motion.button
          whileTap={{ scale: 0.94, y: 2 }}
          onClick={onOpenCatalog}
          className="tactile-btn w-full py-2 sm:py-2.5 px-1 rounded-xl text-[10px] sm:text-xs font-black text-black flex items-center justify-center cursor-pointer uppercase tracking-wider whitespace-nowrap"
        >
          CATÁLOGO
        </motion.button>

        {/* PWA Anchor Link */}
        <button
          onClick={onOpenPwaModal}
          className="text-[9px] sm:text-[10px] font-bold text-[#A0A0A0] hover:text-[#52E010] inline-flex items-center justify-center gap-1 mt-0.5 transition-colors cursor-pointer text-center"
        >
          <Download size={11} className="flex-shrink-0" />
          <span className="truncate">Instalar en celular</span>
        </button>
      </div>
    </div>
  );
}
