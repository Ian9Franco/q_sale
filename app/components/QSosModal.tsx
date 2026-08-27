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
            className="tactile-card w-full max-w-[460px] p-4 sm:p-5 relative z-10 rounded-2xl border-3 border-black shadow-[0_0_0_3px_#F4F4E6,0_8px_32px_rgba(0,0,0,0.9)]"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 mb-4 border-b-2 border-black">
              <div>
                <h3 className="text-xl font-black text-black tracking-wider uppercase flex items-center gap-2">
                  <span>¿Q-SOS?</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#52E010] text-black border border-black shadow-[0_1px_0_#2D7A08]">
                    ELIGE TU PERSONAJE
                  </span>
                </h3>
                <p className="text-[11px] font-bold text-[#555] mt-0.5">
                  Seleccioná tu personaje para cambiar tu disponibilidad
                </p>
              </div>
              <motion.button
                whileTap={{ scale: 0.88 }}
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-xl bg-black text-[#F4F4E6] flex items-center justify-center cursor-pointer border border-black shadow-[0_2px_0_#333]"
              >
                <X size={18} />
              </motion.button>
            </div>

            {/* 4 Player Roster Cards Grid with Background Art */}
            <div className="grid grid-cols-2 gap-3">
              {players.map((p) => {
                const isSelected = p.id === activePlayerId;
                const bgImage = p.avatar && p.avatar.startsWith('/') ? p.avatar : (BG_MAP[p.id] || '/vesperwing1.webp');

                return (
                  <motion.button
                    key={p.id}
                    type="button"
                    whileTap={{ scale: 0.94, y: 2 }}
                    onClick={() => {
                      onSelectUser(p.id);
                      setShowModal(false);
                    }}
                    className={`relative flex flex-col items-center justify-between p-3 rounded-2xl border-2 overflow-hidden h-[160px] cursor-pointer transition-all ${
                      isSelected
                        ? 'border-black shadow-[0_0_0_3px_#52E010,0_4px_0_#2D7A08]'
                        : 'border-black shadow-[0_3px_0_#2D2D2D]'
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

                    {/* Name */}
                    <span className="relative z-10 font-black text-sm text-white uppercase tracking-wider truncate max-w-full drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                      {p.name}
                    </span>

                    {/* Select Badge */}
                    <div className="relative z-10 mt-auto w-full">
                      {isSelected ? (
                        <span className="w-full py-1.5 px-2 rounded-xl bg-[#52E010] text-black text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1 border border-black shadow-[0_2px_0_#2D7A08]">
                          <Check size={12} strokeWidth={3} />
                          <span>SOS VOS</span>
                        </span>
                      ) : (
                        <span className="w-full py-1.5 px-2 rounded-xl bg-black/75 backdrop-blur-xs text-white text-[10px] font-black uppercase tracking-wider block text-center border border-white/30 hover:bg-black/90">
                          SELECCIONAR
                        </span>
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Close CTA */}
            <motion.button
              whileTap={{ scale: 0.96, y: 2 }}
              onClick={() => setShowModal(false)}
              className="tactile-btn-dark mt-4 w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-[#F4F4E6]"
            >
              CERRAR
            </motion.button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
