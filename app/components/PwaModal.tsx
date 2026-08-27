import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

interface PwaModalProps {
  showPwaModal: boolean;
  setShowPwaModal: (show: boolean) => void;
}

const SPRING = { type: 'spring' as const, stiffness: 380, damping: 30 };

export default function PwaModal({ showPwaModal, setShowPwaModal }: PwaModalProps) {
  return (
    <AnimatePresence>
      {showPwaModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 pb-8 sm:pb-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setShowPwaModal(false)}
            className="fixed inset-0 bg-black/85 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={SPRING}
            className="tactile-card w-full max-w-sm p-5 relative z-10 rounded-2xl border-3 border-black shadow-[0_8px_24px_rgba(0,0,0,0.8)]"
          >
            <div className="flex items-center justify-between mb-4 border-b-2 border-black pb-2">
              <h3 className="text-base font-black text-black uppercase tracking-wider">
                Instalar App en Celular
              </h3>
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={() => setShowPwaModal(false)}
                className="w-7 h-7 rounded-lg bg-black text-[#EAE8D4] flex items-center justify-center cursor-pointer"
              >
                <X size={16} />
              </motion.button>
            </div>
            {[
              {
                title: 'En iPhone (Safari):',
                steps: [
                  'Tocá Compartir (cuadrado con flecha).',
                  'Seleccioná "Agregar a Inicio".',
                  'Abrí la app desde el ícono para activar notificaciones.',
                ],
              },
              {
                title: 'En Android (Chrome):',
                steps: ['Tocá los tres puntos (⋮).', 'Seleccioná "Instalar aplicación" o "Agregar a Inicio".'],
              },
            ].map((s) => (
              <div key={s.title} className="bg-black/5 p-3 rounded-xl mb-2.5 border border-black/20">
                <div className="font-black text-black text-xs mb-1.5 uppercase">{s.title}</div>
                <ol className="pl-4 list-decimal text-xs font-semibold text-[#333] space-y-1">
                  {s.steps.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
              </div>
            ))}
            <motion.button
              whileTap={{ scale: 0.95, y: 2 }}
              onClick={() => setShowPwaModal(false)}
              className="tactile-btn-green mt-3 w-full py-2.5 rounded-xl text-black font-black text-xs uppercase tracking-wider"
            >
              ¡Entendido!
            </motion.button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
