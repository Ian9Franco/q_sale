import React from 'react';
import { motion } from 'motion/react';
import { PlayerStatus } from '../types';

interface SquadListProps {
  players: PlayerStatus[];
  activePlayerId: string;
  maxSquad: number;
  isLoading: boolean;
}

const SPRING = { type: 'spring' as const, stiffness: 380, damping: 30 };

const BG_MAP: Record<string, string> = {
  ian: '/vesperwing1.webp',
  chango: '/Bandit.webp',
  el_mati: '/Farsight.webp',
  volvo_milei: '/Outrider.webp',
};

export default function SquadList({ players, activePlayerId, isLoading }: SquadListProps) {
  return (
    <div className="flex flex-col gap-3 w-full p-0.5">
      {/* Header Pill */}
      <div className="w-full flex items-center justify-center py-2 rounded-xl bg-[#EAE8D4] border-2 border-black shadow-[0_0_0_2px_#F4F4E6,0_3px_0_2px_#141414]">
        <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-black truncate px-2">
          SQUAD STATUS
        </span>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-[#A0A0A0] text-xs font-black">CARGANDO SATÉLITES…</div>
      ) : (
        /* Vertical Cards Grid (2x2 tall portrait cards) */
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 w-full">
          {players.map((p, i) => {
            const isReady = p.availability === 'now';
            const isSoon = p.availability === 'soon';
            const isScheduled = p.availability === 'scheduled';
            const isOffline = p.availability === 'offline';
            const isUserActive = p.id === activePlayerId;
            const bgImage = p.avatar && p.avatar.startsWith('/') ? p.avatar : (BG_MAP[p.id] || '/vesperwing1.webp');

            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...SPRING, delay: i * 0.05 }}
                whileHover={{ y: -3, scale: 1.02 }}
                className={`relative flex flex-col justify-between p-2.5 rounded-2xl border-2 border-black shadow-[0_0_0_2px_#F4F4E6,0_4px_0_2px_#141414] overflow-hidden min-h-[175px] sm:min-h-[195px] select-none transition-all ${
                  isUserActive ? 'ring-3 ring-[#52E010] ring-offset-2 ring-offset-black' : ''
                }`}
              >
                {/* Character Background Image */}
                <img
                  src={bgImage}
                  alt={p.name}
                  className="absolute inset-0 w-full h-full object-cover object-center transform transition-transform duration-300 group-hover:scale-105"
                />

                {/* Dark Cinematic Gradient Overlay for Maximum Readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/75 pointer-events-none" />

                {/* Top: Name & "TÚ" Badge */}
                <div className="relative z-10 flex flex-col items-center justify-center text-center gap-0.5 w-full">
                  <div className="flex items-center justify-center gap-1.5 w-full px-0.5 min-w-0">
                    <span className="font-black text-[11px] sm:text-xs text-white uppercase tracking-wider truncate drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                      {p.name}
                    </span>
                    {isUserActive && (
                      <span className="text-[8px] sm:text-[9px] font-black px-1.5 py-0.5 rounded bg-black text-[#52E010] border border-[#52E010] leading-none flex-shrink-0 shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                        TÚ
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom: Custom Note & Status Pill Badge */}
                <div className="relative z-10 flex flex-col items-center justify-end text-center gap-1.5 w-full mt-auto pt-4">
                  {/* Note if present */}
                  {p.customNote && (
                    <div className="w-full px-1 min-w-0">
                      <p className="text-[9px] sm:text-[10px] text-[#F4F4E6] font-bold italic truncate bg-black/70 backdrop-blur-xs py-0.5 px-1.5 rounded-md border border-white/20">
                        &ldquo;{p.customNote}&rdquo;
                      </p>
                    </div>
                  )}

                  {/* Status Pill Badge */}
                  <div className="w-full flex justify-center">
                    {isReady && (
                      <span className="inline-flex items-center justify-center gap-1 px-3 py-1 rounded-full bg-[#52E010] border-2 border-black text-black text-[10px] sm:text-[11px] font-black shadow-[0_2px_0_#2D7A08] uppercase tracking-wide leading-none w-full max-w-[100px]">
                        <span className="w-2 h-2 rounded-full bg-black lime-pulse flex-shrink-0" />
                        YA
                      </span>
                    )}
                    {isSoon && (
                      <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-[#00B5E2] border-2 border-black text-black text-[10px] sm:text-[11px] font-black shadow-[0_2px_0_#007A99] uppercase tracking-wide leading-none w-full max-w-[100px]">
                        {p.scheduledTime || '30M'}
                      </span>
                    )}
                    {isScheduled && (
                      <span className="inline-flex items-center justify-center px-2 py-1 rounded-full bg-[#FFB800] border-2 border-black text-black text-[9px] sm:text-[10px] font-black shadow-[0_2px_0_#B38100] uppercase tracking-wider leading-none w-full max-w-[110px] truncate">
                        {p.scheduledDate || 'Hoy'} {p.scheduledTime || '22:00'}
                      </span>
                    )}
                    {isOffline && (
                      <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-[#2D2D2D] border-2 border-black text-[#F4F4E6] text-[10px] sm:text-[11px] font-black shadow-[0_2px_0_#141414] uppercase tracking-wide leading-none w-full max-w-[100px]">
                        OFFLINE
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
