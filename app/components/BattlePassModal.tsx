'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Award,
  Sparkles,
  Check,
  Lock,
  Shield,
  Zap,
  Target,
  Clock,
} from 'lucide-react';
import {
  BattlePassState,
  BATTLE_PASS_TIERS,
  BATTLE_PASS_MISSIONS,
  BattlePassReward,
} from '../types';
import { playTacticalSound } from '../utils/audio';

interface BattlePassModalProps {
  showModal: boolean;
  setShowModal: (show: boolean) => void;
  bpState: BattlePassState;
  onClaimTier: (tier: number) => void;
  onClaimMission: (missionId: string) => void;
  onEquipTitle: (title: string) => void;
  onEquipFrame: (frame: string) => void;
  soundEnabled: boolean;
}

const SPRING = { type: 'spring' as const, stiffness: 380, damping: 30 };

export default function BattlePassModal({
  showModal,
  setShowModal,
  bpState,
  onClaimTier,
  onClaimMission,
  onEquipTitle,
  onEquipFrame,
  soundEnabled,
}: BattlePassModalProps) {
  const [activeTab, setActiveTab] = useState<'tiers' | 'missions' | 'armory'>('tiers');

  // Calculate next tier requirements
  const nextTierObj = BATTLE_PASS_TIERS.find((t) => t.tier === bpState.level + 1);
  const progressPercent = nextTierObj
    ? Math.min(100, Math.round((bpState.currentXP / nextTierObj.requiredXP) * 100))
    : 100;

  const claimableTiersCount = BATTLE_PASS_TIERS.filter(
    (t) => bpState.currentXP >= t.requiredXP && !bpState.claimedTiers.includes(t.tier)
  ).length;

  const handleClaim = (tier: number) => {
    if (soundEnabled) playTacticalSound('claim_reward');
    onClaimTier(tier);
  };

  const handleMissionClaim = (missionId: string) => {
    if (soundEnabled) playTacticalSound('mission_complete');
    onClaimMission(missionId);
  };

  // Get all claimed rewards for armory
  const unlockedRewards = BATTLE_PASS_TIERS.filter((t) =>
    bpState.claimedTiers.includes(t.tier)
  ).map((t) => t.reward);

  const unlockedTitles = unlockedRewards.filter((r) => r.type === 'title');
  const unlockedFrames = unlockedRewards.filter((r) => r.type === 'frame');

  return (
    <AnimatePresence>
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowModal(false)}
            className="fixed inset-0 bg-black/90 backdrop-blur-md"
          />

          {/* Main Modal Window */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 15 }}
            transition={SPRING}
            className="tactile-card w-full max-w-[620px] max-h-[92vh] flex flex-col p-4 sm:p-5 relative z-10 rounded-2xl border-3 border-black shadow-[0_0_0_3px_#F4F4E6,0_8px_32px_rgba(0,0,0,0.95)] overflow-hidden"
          >
            {/* Top Bar / Header */}
            <div className="flex items-center justify-between pb-3 border-b-2 border-black/80 gap-2 flex-shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-black flex items-center justify-center border border-black shadow-[0_2px_0_#333] flex-shrink-0">
                  <Award size={18} className="text-[#FFB800]" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h2 className="text-sm sm:text-base font-black text-black uppercase tracking-wider truncate">
                      BATTLE PASS
                    </h2>
                    <span className="text-[9px] sm:text-[10px] font-black px-1.5 py-0.5 rounded bg-[#FF1D25] text-white border border-black uppercase tracking-widest shadow-[0_1px_0_#990000]">
                      TEMP. 1
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] font-bold text-[#555] uppercase tracking-wide truncate">
                    OPERACIÓN AEGIS // THE LAST WALL
                  </p>
                </div>
              </div>

              <motion.button
                whileTap={{ scale: 0.88 }}
                onClick={() => setShowModal(false)}
                className="w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-xl bg-black text-[#F4F4E6] flex items-center justify-center cursor-pointer border-2 border-black shadow-[0_2px_0_#333] flex-shrink-0 ml-1"
              >
                <X size={15} />
              </motion.button>
            </div>

            {/* Hero Progress Header Card */}
            <div className="my-3 p-3 rounded-xl bg-black text-[#F4F4E6] border-2 border-black shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)] flex flex-col gap-2.5 flex-shrink-0">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="px-2.5 py-1 rounded-lg bg-[#52E010] text-black border border-black font-black text-xs sm:text-sm uppercase tracking-wider shadow-[0_2px_0_#2D7A08] flex items-center gap-1">
                    <Zap size={14} className="fill-black" />
                    <span>NIVEL {bpState.level}</span>
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-bold text-[#A0A0A0]">
                    {bpState.currentXP.toLocaleString()} XP TOTAL
                  </span>
                </div>
                <div className="text-[10px] sm:text-xs font-black text-[#FFB800] uppercase tracking-wider flex items-center gap-1">
                  <Clock size={12} />
                  <span>24 DÍAS RESTANTES</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="flex flex-col gap-1 w-full">
                <div className="flex items-center justify-between text-[9px] sm:text-[10px] font-bold text-[#AAA]">
                  <span>Progreso al Nivel {bpState.level < 10 ? bpState.level + 1 : 10}</span>
                  <span className="text-[#52E010] font-black">
                    {nextTierObj ? `${bpState.currentXP} / ${nextTierObj.requiredXP} XP` : '¡NIVEL MÁXIMO!'}
                  </span>
                </div>
                <div className="w-full h-3 rounded-full bg-[#1F1F1F] border border-[#444] overflow-hidden p-0.5 relative">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="h-full rounded-full bg-gradient-to-r from-[#52E010] via-[#00B5E2] to-[#FFB800] shadow-[0_0_8px_#52E010]"
                  />
                </div>
              </div>
            </div>

            {/* Tabs Navigation */}
            <div className="flex items-center gap-1.5 p-0.5 mb-2.5 bg-black/10 rounded-xl flex-shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('tiers')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] sm:text-[11px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  activeTab === 'tiers'
                    ? 'bg-black text-[#52E010] border border-black shadow-[0_1.5px_0_#333]'
                    : 'text-black hover:bg-black/10'
                }`}
              >
                <Award size={13} />
                <span>Niveles (1-10)</span>
                {claimableTiersCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-[#52E010] text-black text-[9px] font-black flex items-center justify-center ml-0.5 animate-bounce">
                    {claimableTiersCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('missions')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] sm:text-[11px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  activeTab === 'missions'
                    ? 'bg-black text-[#FFB800] border border-black shadow-[0_1.5px_0_#333]'
                    : 'text-black hover:bg-black/10'
                }`}
              >
                <Target size={13} />
                <span>Misiones</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('armory')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] sm:text-[11px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  activeTab === 'armory'
                    ? 'bg-black text-[#00B5E2] border border-black shadow-[0_1.5px_0_#333]'
                    : 'text-black hover:bg-black/10'
                }`}
              >
                <Shield size={13} />
                <span>Armería ({unlockedRewards.length})</span>
              </button>
            </div>

            {/* Tab 1: TIERS TRACK */}
            {activeTab === 'tiers' && (
              <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2 min-h-0">
                {BATTLE_PASS_TIERS.map((tier) => {
                  const isUnlocked = bpState.currentXP >= tier.requiredXP;
                  const isClaimed = bpState.claimedTiers.includes(tier.tier);
                  const isAegisTier = tier.tier === 5;

                  return (
                    <div
                      key={tier.tier}
                      className={`relative p-2.5 sm:p-3 rounded-xl border-2 transition-all flex items-center justify-between gap-3 overflow-hidden ${
                        isAegisTier
                          ? 'bg-gradient-to-r from-black via-[#2b0808] to-black border-[#FF1D25] text-white shadow-[0_0_12px_rgba(255,29,37,0.35)]'
                          : isClaimed
                          ? 'bg-black/85 border-black text-[#A0A0A0]'
                          : isUnlocked
                          ? 'bg-black text-white border-[#52E010] shadow-[0_0_8px_rgba(82,224,16,0.3)]'
                          : 'bg-[#2D2D2D] text-[#888] border-black opacity-80'
                      }`}
                    >
                      {/* Left: Tier Number & Icon */}
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex flex-col items-center justify-center border-2 border-black flex-shrink-0 font-black ${
                            isAegisTier
                              ? 'bg-[#FF1D25] text-white shadow-[0_2px_0_#990000]'
                              : isUnlocked
                              ? 'bg-[#52E010] text-black shadow-[0_2px_0_#2D7A08]'
                              : 'bg-[#444] text-[#AAA]'
                          }`}
                        >
                          <span className="text-[9px] leading-none uppercase">NV</span>
                          <span className="text-xs sm:text-sm leading-none">{tier.tier}</span>
                        </div>

                        {/* Reward Details */}
                        <div className="min-w-0 flex flex-col">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-sm">{tier.reward.icon}</span>
                            <span
                              className={`font-black text-xs sm:text-sm truncate uppercase tracking-wider ${
                                isAegisTier
                                  ? 'text-[#FF4D4D]'
                                  : isUnlocked && !isClaimed
                                  ? 'text-[#52E010]'
                                  : isClaimed
                                  ? 'text-[#DDD]'
                                  : 'text-[#999]'
                              }`}
                            >
                              {tier.reward.name}
                            </span>
                            <span
                              className={`text-[8px] font-black px-1.5 py-0.2 rounded uppercase ${
                                tier.reward.rarity === 'mythic'
                                  ? 'bg-[#FF1D25] text-white'
                                  : tier.reward.rarity === 'legendary'
                                  ? 'bg-[#FFB800] text-black'
                                  : tier.reward.rarity === 'epic'
                                  ? 'bg-[#9b59b6] text-white'
                                  : 'bg-black/50 text-[#AAA]'
                              }`}
                            >
                              {tier.reward.rarity}
                            </span>
                          </div>
                          <p className="text-[9px] sm:text-[10px] text-[#A0A0A0] line-clamp-1 mt-0.5 font-medium">
                            {tier.reward.description}
                          </p>
                          <span className="text-[8px] font-black text-[#FFB800] uppercase mt-0.5">
                            Requiere {tier.requiredXP.toLocaleString()} XP
                          </span>
                        </div>
                      </div>

                      {/* Right: Action Button / Status */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {isClaimed ? (
                          <span className="px-2.5 py-1 rounded-lg bg-black text-[#52E010] text-[9px] sm:text-[10px] font-black uppercase tracking-wider flex items-center gap-1 border border-[#52E010]">
                            <Check size={12} strokeWidth={3} />
                            <span>OBTENIDO</span>
                          </span>
                        ) : isUnlocked ? (
                          <motion.button
                            whileTap={{ scale: 0.92, y: 1 }}
                            whileHover={{ scale: 1.04 }}
                            onClick={() => handleClaim(tier.tier)}
                            className="tactile-btn-green px-3 py-1.5 rounded-lg text-[10px] sm:text-[11px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer animate-pulse"
                          >
                            <Sparkles size={13} className="fill-black" />
                            <span>RECLAMAR</span>
                          </motion.button>
                        ) : (
                          <div className="flex items-center gap-1 text-[9px] sm:text-[10px] font-black text-[#777] bg-black/40 px-2 py-1 rounded-lg border border-white/10">
                            <Lock size={11} />
                            <span>BLOQUEADO</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Tab 2: MISSIONS */}
            {activeTab === 'missions' && (
              <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2 min-h-0">
                <div className="text-[10px] font-black text-[#555] uppercase tracking-wider px-1">
                  COMPLETA ACCIONES TÁCTICAS PARA SUBIR DE NIVEL
                </div>
                {BATTLE_PASS_MISSIONS.map((mission) => {
                  const isClaimed = bpState.claimedMissions.includes(mission.id);

                  return (
                    <div
                      key={mission.id}
                      className={`p-2.5 sm:p-3 rounded-xl border-2 border-black flex items-center justify-between gap-3 transition-all ${
                        isClaimed
                          ? 'bg-black/80 text-[#888]'
                          : 'bg-black text-[#F4F4E6] shadow-[inset_0_1px_3px_rgba(0,0,0,0.6)]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#222] border border-white/20 flex items-center justify-center text-base flex-shrink-0">
                          {mission.icon}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-black text-xs text-white uppercase tracking-wider truncate">
                              {mission.title}
                            </span>
                            <span className="text-[8px] font-black px-1.5 py-0.2 rounded bg-[#00B5E2] text-black uppercase">
                              {mission.category}
                            </span>
                          </div>
                          <p className="text-[9px] sm:text-[10px] text-[#A0A0A0] line-clamp-1 mt-0.5">
                            {mission.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-[10px] font-black text-[#52E010] whitespace-nowrap">
                          +{mission.xp} XP
                        </span>

                        {isClaimed ? (
                          <span className="px-2 py-1 rounded-lg bg-black text-[#888] text-[9px] font-black uppercase flex items-center gap-1 border border-white/10">
                            <Check size={11} />
                            <span>LISTO</span>
                          </span>
                        ) : (
                          <motion.button
                            whileTap={{ scale: 0.92, y: 1 }}
                            onClick={() => handleMissionClaim(mission.id)}
                            className="tactile-btn-yellow px-2.5 py-1 rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-wider cursor-pointer"
                          >
                            COMPLETAR
                          </motion.button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Tab 3: ARMORY & COSMETICS */}
            {activeTab === 'armory' && (
              <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3 min-h-0">
                {/* Aegis Operator Card Spotlight */}
                <div className="p-3 rounded-xl bg-gradient-to-r from-black via-[#1c0707] to-black border-2 border-[#FF1D25] shadow-[0_0_16px_rgba(255,29,37,0.4)] flex flex-col sm:flex-row items-center gap-3">
                  <img
                    src="/Uandi.webp"
                    alt="Aegis"
                    className="w-20 h-28 object-cover rounded-lg border-2 border-[#FF1D25] shadow-md flex-shrink-0"
                  />
                  <div className="flex flex-col gap-1 text-center sm:text-left min-w-0">
                    <div className="flex items-center justify-center sm:justify-start gap-1.5 flex-wrap">
                      <span className="text-xs sm:text-sm font-black text-[#FF4D4D] uppercase tracking-wider">
                        NUEVO OPERADOR: AEGIS
                      </span>
                      <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-[#FF1D25] text-white">
                        THE LAST WALL
                      </span>
                    </div>
                    <p className="text-[10px] text-[#EAE8D4] italic font-semibold">
                      &ldquo;The more you hurt him, the harder he hits back.&rdquo;
                    </p>
                    <p className="text-[9px] text-[#A0A0A0]">
                      Operador de asalto pesado blindado. Ya está disponible en el squad y selector ¿Q-SOS?.
                    </p>
                  </div>
                </div>

                {/* Equipped Titles Section */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-black uppercase text-black tracking-wider px-0.5">
                    TÍTULOS DESBLOQUEADOS (EQUIPAR EN TU TARJETA)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {unlockedTitles.length === 0 ? (
                      <div className="col-span-full py-4 text-center text-xs font-bold text-[#777] bg-black/10 rounded-xl border border-black/20">
                        Sube de nivel en el Pase de Batalla para desbloquear títulos exclusivos.
                      </div>
                    ) : (
                      unlockedTitles.map((t) => {
                        const isEquipped = bpState.equippedTitle === t.value;
                        return (
                          <div
                            key={t.id}
                            className={`p-2 rounded-xl border-2 border-black flex items-center justify-between gap-2 ${
                              isEquipped ? 'bg-black text-[#52E010]' : 'bg-black/80 text-white'
                            }`}
                          >
                            <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider truncate">
                              [{t.value}]
                            </span>
                            <motion.button
                              whileTap={{ scale: 0.9 }}
                              onClick={() => onEquipTitle(isEquipped ? '' : (t.value || ''))}
                              className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase cursor-pointer border ${
                                isEquipped
                                  ? 'bg-[#52E010] text-black border-black'
                                  : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                              }`}
                            >
                              {isEquipped ? 'EQUIPADO' : 'EQUIPAR'}
                            </motion.button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Frames Section */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-black uppercase text-black tracking-wider px-0.5">
                    MARCOS TÁCTICOS DESBLOQUEADOS
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {unlockedFrames.length === 0 ? (
                      <div className="col-span-full py-4 text-center text-xs font-bold text-[#777] bg-black/10 rounded-xl border border-black/20">
                        Alcanza los niveles 2, 6 y 10 para desbloquear marcos especiales.
                      </div>
                    ) : (
                      unlockedFrames.map((f) => {
                        const isEquipped = bpState.equippedFrame === f.value;
                        return (
                          <div
                            key={f.id}
                            className={`p-2 rounded-xl border-2 border-black flex items-center justify-between gap-2 ${
                              isEquipped ? 'bg-black text-[#00B5E2]' : 'bg-black/80 text-white'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span>{f.icon}</span>
                              <span className="text-[10px] font-black uppercase tracking-wider truncate">
                                {f.name}
                              </span>
                            </div>
                            <motion.button
                              whileTap={{ scale: 0.9 }}
                              onClick={() => onEquipFrame(isEquipped ? '' : (f.value || ''))}
                              className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase cursor-pointer border ${
                                isEquipped
                                  ? 'bg-[#00B5E2] text-black border-black'
                                  : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                              }`}
                            >
                              {isEquipped ? 'EQUIPADO' : 'EQUIPAR'}
                            </motion.button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
