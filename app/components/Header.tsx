import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, Bell, BellOff, Volume2, VolumeX, Check } from 'lucide-react';
import { AppState } from '../types';

interface HeaderProps {
  appState: AppState | null;
  lastSyncTime: string;
  soundEnabled: boolean;
  setSoundEnabled: (val: boolean) => void;
  isPushSubscribed: boolean;
  handleTogglePush: () => void;
  isSubscribingPush: boolean;
  pushStatusMessage: string;
}

const SPRING_FAST = { type: 'spring' as const, stiffness: 500, damping: 36 };

export default function Header({
  appState,
  lastSyncTime,
  soundEnabled,
  setSoundEnabled,
  isPushSubscribed,
  handleTogglePush,
  isSubscribingPush,
  pushStatusMessage,
}: HeaderProps) {
  return (
    <div className="w-full flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: R6 SQUAD badge & Live info */}
        <div className="flex flex-col items-start justify-center flex-shrink-0">
          <span className="text-[10px] sm:text-[11px] font-black tracking-widest px-2.5 py-0.5 rounded-md border-2 border-black bg-[#FFB800] text-black uppercase shadow-[0_0_0_1.5px_#F4F4E6,0_2px_0_1.5px_#141414]">
            R6 SQUAD
          </span>
          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-[#EAE8D4] font-bold mt-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#52E010] flex-shrink-0 lime-pulse shadow-[0_0_8px_#52E010]" />
            <span className="tracking-wide whitespace-nowrap">En vivo{lastSyncTime ? ` • ${lastSyncTime}` : ''}</span>
          </div>
        </div>

        {/* Center: Big prominent Logo */}
        <motion.div whileTap={{ scale: 0.96 }} className="flex items-center justify-center flex-1 min-w-0">
          <img
            src="/logo.png"
            alt="Q-SALE?"
            className="h-12 sm:h-16 w-auto max-w-[210px] object-contain cursor-pointer drop-shadow-[0_4px_16px_rgba(82,224,16,0.35)]"
          />
        </motion.div>

        {/* Right: 3 square tactile buttons with sticker outline */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0 pr-1">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl tactile-btn cursor-pointer"
            title={soundEnabled ? 'Silenciar' : 'Activar sonido'}
          >
            {soundEnabled ? <Volume2 size={16} className="text-black stroke-[2.5]" /> : <VolumeX size={16} className="text-[#888] stroke-[2.5]" />}
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleTogglePush}
            disabled={isSubscribingPush}
            className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl cursor-pointer ${
              isPushSubscribed ? 'tactile-btn-green' : 'tactile-btn'
            }`}
            title={isPushSubscribed ? 'Notificaciones activas' : 'Activar notificaciones'}
          >
            {isPushSubscribed ? <Bell size={16} className="text-black stroke-[2.5]" /> : <BellOff size={16} className="text-[#888] stroke-[2.5]" />}
          </motion.button>

          {appState?.discordInviteUrl && (
            <motion.a
              whileTap={{ scale: 0.9 }}
              href={appState.discordInviteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl bg-[#0045D8] text-white border-2 border-black shadow-[0_0_0_2px_#F4F4E6,0_3px_0_2px_#002C8A] cursor-pointer"
              title="Unirse a Discord"
            >
              <Mic size={16} className="text-white stroke-[2.5]" />
            </motion.a>
          )}
        </div>
      </div>

      {/* Animated Marquee Rainbow Stripe */}
      <div className="w-full h-1.5 sm:h-2 rounded-full rainbow-stripe-animated mt-0.5" />

      {/* Toast Notification */}
      <AnimatePresence>
        {pushStatusMessage && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={SPRING_FAST}
            className="mt-1 px-3 py-1.5 rounded-xl bg-[#52E010] text-black text-xs font-black text-center flex items-center justify-center gap-2 border-2 border-black shadow-[0_0_0_2px_#F4F4E6]"
          >
            <Check size={16} strokeWidth={3} />
            <span>{pushStatusMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
