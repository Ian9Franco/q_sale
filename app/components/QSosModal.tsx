import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check } from 'lucide-react';
import { PlayerStatus } from '../types';

interface QSosModalProps {
  showModal: boolean;
  setShowModal: (show: boolean) => void;
  players: PlayerStatus[];
  activePlayerId: string;
  onSelectUser: (id: string) => void;
}

const SPRING = { type: 'spring' as const, stiffness: 380, damping: 30 };

const BG_MAP: Record<string, string> = {
  ian: '/vesperwing1.webp',
  chango: '/Bandit.webp',
  el_mati: '/Farsight.webp',
  volvo_milei: '/Outrider.webp',
  aegis: '/Uandi.webp',
  uandi: '/Uandi.webp',
};

export default function QSosModal({
  showModal,
  setShowModal,
  players,
  activePlayerId,
  onSelectUser,
}: QSosModalProps) {
  return (
    <AnimatePresence>
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowModal(false)}
            className="fixed inset-0 bg-black/85 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={SPRING}
            className="tactile-card w-full max-w-[500px] sm:max-w-[540px] p-4 sm:p-6 pb-6 sm:pb-7 relative z-10 rounded-2xl border-3 border-black shadow-[0_0_0_3px_#F4F4E6,0_8px_32px_rgba(0,0,0,0.9)] max-h-[92vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-start justify-between pb-2.5 mb-3 border-b-2 border-black/80 gap-2">
              <div className="min-w-0 flex-1">
                <h3 className="text-base sm:text-lg font-black text-black tracking-wider uppercase flex flex-wrap items-center gap-2">
                  <span>¿Q-SOS?</span>
                  <span className="text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded bg-[#52E010] text-black border border-black shadow-[0_1px_0_#2D7A08]">
                    ELIGE TU OPERADOR
                  </span>
                </h3>
              </div>
              <motion.button
                whileTap={{ scale: 0.88 }}
                onClick={() => setShowModal(false)}
                className="w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-xl bg-black text-[#F4F4E6] flex items-center justify-center cursor-pointer border-2 border-black shadow-[0_2px_0_#333] flex-shrink-0 ml-1"
              >
                <X size={15} />
              </motion.button>
            </div>

            {/* Brief App Explanation — Square Retro Box */}
            <div className="bg-black/90 p-2.5 sm:p-3 rounded-none border-2 border-black mb-4 sm:mb-5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]">
              <p className="text-[11px] sm:text-xs font-bold text-[#EAE8D4] leading-snug">
                🎮 <strong className="text-[#52E010]">Q-SALE?</strong> es el radar en tiempo real para coordinar partidas de <strong className="text-[#FFB800]">R6 Siege</strong>.
              </p>
              <p className="text-[10px] sm:text-[10.5px] text-[#A0A0A0] font-semibold mt-1.5 leading-tight">
                Elegí tu personaje para avisar si estás listo <span className="text-[#52E010] font-black">YA</span> o a qué hora entrás, y recibir alertas cuando el squad se arme.
              </p>
            </div>

            {/* 5 Compact Player Roster Cards Grid with Background Art */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3 p-1">
              {players.map((p, idx) => {
                const isSelected = p.id === activePlayerId;
                const bgImage = p.avatar && p.avatar.startsWith('/') ? p.avatar : (BG_MAP[p.id] || '/vesperwing1.webp');
                const isAegis = p.id === 'aegis' || p.id === 'uandi';
                const isLastOdd = players.length === 5 && idx === 4;

                return (
                  <motion.button
                    key={p.id}
                    type="button"
                    whileTap={{ scale: 0.94, y: 2 }}
                    onClick={() => {
                      onSelectUser(p.id);
                      setShowModal(false);
                    }}
                    className={`relative flex flex-col items-center justify-between p-2 sm:p-2.5 rounded-xl border-2 overflow-hidden h-[125px] sm:h-[135px] cursor-pointer transition-all ${
                      isLastOdd ? 'col-span-2 sm:col-span-1' : ''
                    } ${
                      isSelected
                        ? 'border-black ring-3 ring-[#52E010] ring-offset-2 ring-offset-[#EAE8D4] shadow-[0_2px_0_#141414]'
                        : isAegis
                        ? 'border-[#FF1D25] shadow-[0_0_8px_rgba(255,29,37,0.4)]'
                        : 'border-black shadow-[0_2px_0_#141414] hover:shadow-[0_3px_0_#141414]'
                    }`}
                  >
                    {/* Background Image */}
                    <img
                      src={bgImage}
                      alt={p.name}
                      className="absolute inset-0 w-full h-full object-cover object-center"
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-black/75" />

                    {/* Name & Role */}
                    <div className="relative z-10 flex flex-col items-center text-center w-full min-w-0">
                      <span className="font-black text-[11px] sm:text-xs text-white uppercase tracking-wider truncate max-w-full drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                        {p.name}
                      </span>
                      {isAegis && (
                        <span className="text-[7.5px] font-black px-1 rounded bg-[#FF1D25] text-white uppercase mt-0.5 tracking-wider">
                          NUEVO // THE LAST WALL
                        </span>
                      )}
                    </div>

                    {/* Select Badge */}
                    <div className="relative z-10 mt-auto w-full">
                      {isSelected ? (
                        <span className="w-full py-0.5 px-1.5 rounded-lg bg-[#52E010] text-black text-[9px] sm:text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1 border border-black shadow-[0_1px_0_#2D7A08]">
                          <Check size={11} strokeWidth={3} />
                          <span>SOS VOS</span>
                        </span>
                      ) : (
                        <span className="w-full py-0.5 px-1.5 rounded-lg bg-black/75 backdrop-blur-xs text-white text-[9px] sm:text-[10px] font-black uppercase tracking-wider block text-center border border-white/30 hover:bg-black/90">
                          SELECCIONAR
                        </span>
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
