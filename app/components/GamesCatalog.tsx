import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GAMES_CATALOG } from '../types';

interface GamesCatalogProps {
  showCatalog: boolean;
  setShowCatalog: (show: boolean) => void;
}

const SPRING = { type: 'spring' as const, stiffness: 380, damping: 30 };

export default function GamesCatalog({ showCatalog }: GamesCatalogProps) {
  return (
    <AnimatePresence>
      {showCatalog && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={SPRING}
          className="overflow-hidden flex flex-col gap-1.5 pt-2 border-t-2 border-[#1E1E1E]"
        >
          <div className="text-[10px] font-black uppercase text-[#A0A0A0] tracking-wider mb-1">
            CATÁLOGO DISPONIBLE
          </div>
          {GAMES_CATALOG.map((g) => (
            <div
              key={g.id}
              className={`tactile-card flex items-center justify-between px-3 py-2 ${
                g.statusBadge === 'coming_soon' ? 'opacity-60' : ''
              }`}
            >
              <div>
                <div className="font-black text-xs text-black uppercase tracking-wide">{g.name}</div>
                <div className="text-[9px] font-semibold text-[#444]">{g.tagline}</div>
              </div>
              <span
                className={`text-[9px] font-black px-2 py-0.5 rounded-full border border-black uppercase ${
                  g.statusBadge === 'active'
                    ? 'bg-[#52E010] text-black shadow-[0_1px_0_#2D7A08]'
                    : 'bg-black/10 text-black'
                }`}
              >
                {g.badgeLabel}
              </span>
            </div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
