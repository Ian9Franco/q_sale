import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, BellOff, Check, Award } from 'lucide-react';
import { AppState } from '../types';

interface HeaderProps {
  appState: AppState | null;
  lastSyncTime: string;
  soundEnabled?: boolean;
  setSoundEnabled?: (val: boolean) => void;
  isPushSubscribed: boolean;
  handleTogglePush: () => void;
  isSubscribingPush: boolean;
  pushStatusMessage: string;
  bpLevel?: number;
  hasClaimableBP?: boolean;
  onOpenBattlePass?: () => void;
}

const SPRING_FAST = { type: 'spring' as const, stiffness: 500, damping: 36 };

export default function Header({
  lastSyncTime,
  isPushSubscribed,
  handleTogglePush,
  isSubscribingPush,
  pushStatusMessage,
  bpLevel = 1,
  hasClaimableBP = false,
  onOpenBattlePass,
}: HeaderProps) {
  return (
    <div className="w-full flex flex-col gap-2.5 sm:gap-3 px-2 sm:px-3 pt-1.5 sm:pt-2">
      <div className="flex items-center justify-between gap-2 sm:gap-3">
        {/* Left: R6 SQUAD badge & Live info */}
        <div className="flex flex-col items-start justify-center flex-shrink-0">
          <span className="text-[9px] sm:text-[11px] font-black tracking-wider sm:tracking-widest px-2 sm:px-2.5 py-0.5 rounded-md border-2 border-black bg-[#FFB800] text-black uppercase shadow-[0_0_0_1.5px_#F4F4E6,0_2px_0_1.5px_#141414]">
            R6 SQUAD
          </span>
          <div className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs text-[#EAE8D4] font-bold mt-1 sm:mt-1.5">
            <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-[#52E010] flex-shrink-0 lime-pulse shadow-[0_0_8px_#52E010]" />
            <span className="tracking-wide whitespace-nowrap">En vivo{lastSyncTime ? ` • ${lastSyncTime}` : ''}</span>
          </div>
        </div>

        {/* Center: Big prominent Logo */}
        <motion.div whileTap={{ scale: 0.96 }} className="flex items-center justify-center flex-1 min-w-0 px-1">
          <img
            src="/logo.png"
            alt="Q-SALE?"
            className="h-10 sm:h-16 w-auto max-w-[140px] sm:max-w-[200px] object-contain cursor-pointer drop-shadow-[0_4px_16px_rgba(82,224,16,0.35)]"
          />
        </motion.div>

        {/* Right: Battle Pass Button & Notification Bell */}
        <div className="flex items-center gap-1.5 sm:gap-2 justify-end flex-shrink-0">
          {/* Battle Pass Trigger */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
            onClick={onOpenBattlePass}
            className={`h-8.5 sm:h-10 px-2 sm:px-2.5 flex items-center justify-center gap-1 sm:gap-1.5 rounded-xl cursor-pointer font-black text-[10px] sm:text-xs uppercase tracking-wider relative ${
              hasClaimableBP
                ? 'tactile-btn-green animate-pulse'
                : 'tactile-btn-yellow'
            }`}
            title="Pase de Batalla Temporada 1"
          >
            <Award size={15} className="text-black flex-shrink-0" />
            <span className="truncate">NV.{bpLevel}</span>
            {hasClaimableBP && (
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF1D25] border border-white absolute -top-1 -right-1" />
            )}
          </motion.button>

          {/* Bell button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleTogglePush}
            disabled={isSubscribingPush}
            className={`w-8.5 h-8.5 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl cursor-pointer ${
              isPushSubscribed ? 'tactile-btn-green' : 'tactile-btn'
            }`}
            title={isPushSubscribed ? 'Notificaciones activas' : 'Activar notificaciones'}
          >
            {isPushSubscribed ? (
              <Bell size={17} className="text-black stroke-[2.5]" />
            ) : (
              <BellOff size={17} className="text-[#888] stroke-[2.5]" />
            )}
          </motion.button>
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
