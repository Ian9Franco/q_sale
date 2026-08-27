import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Clock, Calendar, ShieldOff, UserCheck, Send } from 'lucide-react';
import { PlayerStatus, AvailabilityType, DiscordStatus } from '../types';

interface ControlPanelProps {
  players: PlayerStatus[];
  activePlayerId: string;
  activePlayer: PlayerStatus | undefined;
  handleSelectUser: (id: string) => void;
  draftAvailability: AvailabilityType;
  setDraftAvailability: (val: AvailabilityType) => void;
  draftScheduledDate: string;
  setDraftScheduledDate: (val: string) => void;
  draftScheduledTime: string;
  setDraftScheduledTime: (val: string) => void;
  draftDiscordStatus: DiscordStatus;
  setDraftDiscordStatus: (val: DiscordStatus) => void;
  draftCustomNote: string;
  setDraftCustomNote: (val: string) => void;
  handleSaveStatus: (overrides?: Partial<PlayerStatus>, options?: { sendNotification?: boolean }) => void;
  isUpdating: boolean;
  onOpenQSosModal: () => void;
}

const availabilityOpts = [
  { id: 'now', label: 'YA', Icon: Zap, activeClass: 'tactile-btn-green', color: '#52E010' },
  { id: 'soon', label: '30M', Icon: Clock, activeClass: 'tactile-btn-cyan', color: '#00B5E2' },
  { id: 'scheduled', label: 'HORA', Icon: Calendar, activeClass: 'tactile-btn-yellow', color: '#FFB800' },
  { id: 'offline', label: 'NO', Icon: ShieldOff, activeClass: 'tactile-btn-dark ring-2 ring-[#FF1D25]', color: '#FF1D25' },
] as const;

export default function ControlPanel({
  activePlayer,
  draftAvailability,
  setDraftAvailability,
  draftScheduledDate,
  setDraftScheduledDate,
  draftScheduledTime,
  setDraftScheduledTime,
  draftCustomNote,
  setDraftCustomNote,
  handleSaveStatus,
  isUpdating,
  onOpenQSosModal,
}: ControlPanelProps) {
  return (
    <div className="flex flex-col gap-2.5 w-full p-1.5">
      {/* Title */}
      <div className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#EAE8D4] text-center sm:text-left truncate px-0.5">
        DISPONIBILIDAD
      </div>

      {/* Styled Active User Pill (Click to open ¿Q-SOS?) */}
      <div className="w-full p-0.5">
        <motion.button
          type="button"
          whileTap={{ scale: 0.94, y: 1.5 }}
          onClick={onOpenQSosModal}
          className="w-full flex items-center justify-between bg-[#2D2D2D] text-[#F4F4E6] font-black text-[11px] sm:text-xs py-2.5 px-3 rounded-xl border-2 border-black shadow-[0_0_0_2px_#F4F4E6,0_3px_0_2px_#141414] cursor-pointer hover:bg-[#383838] transition-colors"
          title="Cambiar quién sos"
        >
          <div className="flex items-center gap-2 min-w-0">
            <UserCheck size={15} className="text-[#52E010] flex-shrink-0" />
            <span className="truncate uppercase tracking-wider">{activePlayer?.name || 'IAN'}</span>
          </div>
          <span className="text-[9px] font-black px-2 py-0.5 rounded bg-[#52E010] text-black border border-black uppercase flex-shrink-0 shadow-[0_1px_0_#2D7A08]">
            ¿SOS?
          </span>
        </motion.button>
      </div>

      {/* Availability Buttons: 4 in a row on mobile, 2x2 grid on desktop */}
      <div className="grid grid-cols-4 md:grid-cols-2 gap-2 sm:gap-2.5 w-full mt-1 p-0.5">
        {availabilityOpts.map((opt) => {
          const isSelected = draftAvailability === opt.id;

          return (
            <motion.button
              key={opt.id}
              type="button"
              whileTap={{ scale: 0.92, y: 2 }}
              onClick={() => {
                setDraftAvailability(opt.id as AvailabilityType);
              }}
              className={`flex flex-col items-center justify-center gap-1 py-2.5 sm:py-3 px-1 rounded-xl cursor-pointer transition-all ${
                isSelected ? opt.activeClass : 'tactile-btn'
              }`}
            >
              <opt.Icon
                size={18}
                className={isSelected && opt.id === 'offline' ? 'text-[#FF1D25]' : 'text-current'}
                strokeWidth={2.6}
              />
              <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider leading-none">
                {opt.label}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Scheduled Time Pickers — px-1 py-2 give box-shadows visible breathing room */}
      <AnimatePresence>
        {(draftAvailability === 'scheduled' || draftAvailability === 'soon') && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflowY: 'hidden' }}
            className="px-1 pb-2 pt-1 mt-0.5"
          >
            <div className="p-3 rounded-xl bg-[#2D2D2D] border-2 border-black shadow-[0_0_0_2px_#F4F4E6,0_3px_0_2px_#141414] flex flex-col gap-2.5">
              {draftAvailability === 'scheduled' && (
                <div>
                  <label className="block text-[10px] text-[#FFB800] font-black uppercase mb-1 px-0.5">Día</label>
                  <select
                    value={draftScheduledDate}
                    onChange={(e) => setDraftScheduledDate(e.target.value)}
                    className="w-full text-xs font-black bg-[#EAE8D4] text-black rounded-lg py-1.5 px-2.5 border-2 border-black truncate shadow-[0_1px_0_#141414]"
                  >
                    <option value="Hoy">Hoy</option>
                    <option value="Mañana">Mañana</option>
                    <option value="Viernes">Viernes</option>
                    <option value="Sábado">Sábado</option>
                    <option value="Domingo">Domingo</option>
                  </select>
                </div>
              )}
              <div>
                <label className="block text-[10px] text-[#00B5E2] font-black uppercase mb-1 px-0.5">Hora</label>
                {draftAvailability === 'soon' ? (
                  <select
                    value={draftScheduledTime}
                    onChange={(e) => setDraftScheduledTime(e.target.value)}
                    className="w-full text-xs font-black bg-[#EAE8D4] text-black rounded-lg py-1.5 px-2.5 border-2 border-black truncate shadow-[0_1px_0_#141414]"
                  >
                    <option value="En 15 min">En 15 min</option>
                    <option value="En 30 min">En 30 min</option>
                    <option value="En 45 min">En 45 min</option>
                    <option value="En 1 hora">En 1 hora</option>
                  </select>
                ) : (
                  <input
                    type="time"
                    value={draftScheduledTime}
                    onChange={(e) => setDraftScheduledTime(e.target.value)}
                    className="w-full text-xs font-black bg-[#EAE8D4] text-black rounded-lg py-1.5 px-2.5 border-2 border-black shadow-[0_1px_0_#141414]"
                  />
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bigger Retro Terminal Note Box */}
      <div className="mt-1 w-full flex flex-col gap-1 p-0.5">
        <span className="text-[9px] font-black text-[#A0A0A0] uppercase tracking-widest px-0.5">
          NOTA / MENSAJE
        </span>
        <textarea
          rows={2}
          placeholder="Escribí una nota para el squad… (ej: ceno y entro)"
          value={draftCustomNote}
          onChange={(e) => setDraftCustomNote(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSaveStatus(undefined, { sendNotification: draftAvailability !== 'offline' });
            }
          }}
          className="w-full min-h-[60px] sm:min-h-[70px] text-[11px] py-2 px-2.5 rounded-xl bg-[#2D2D2D] border-2 border-black text-[#F4F4E6] placeholder:text-[#777] font-bold outline-none focus:border-[#52E010] shadow-[0_0_0_2px_#F4F4E6,0_3px_0_2px_#141414] resize-none leading-relaxed transition-all"
        />
      </div>

      {/* Explicit Send / Confirm Status Button */}
      <div className="mt-1 w-full p-0.5">
        <motion.button
          type="button"
          whileTap={{ scale: 0.94, y: 2 }}
          onClick={() => handleSaveStatus(undefined, { sendNotification: draftAvailability !== 'offline' })}
          disabled={isUpdating}
          className={`w-full py-2.5 sm:py-3 px-2 rounded-xl font-black text-[11px] sm:text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-md ${
            draftAvailability === 'offline'
              ? 'tactile-btn-dark ring-2 ring-[#FF1D25]'
              : draftAvailability === 'now'
              ? 'tactile-btn-green'
              : draftAvailability === 'soon'
              ? 'tactile-btn-cyan'
              : 'tactile-btn-yellow'
          }`}
        >
          <Send size={14} className="flex-shrink-0" />
          <span className="truncate">
            {isUpdating
              ? 'GUARDANDO…'
              : draftAvailability === 'offline'
              ? 'OFFLINE'
              : draftAvailability === 'now'
              ? 'ENVIAR'
              : draftAvailability === 'soon'
              ? `ENVIAR: ${draftScheduledTime || 'EN 15 MIN'}`
              : `ENVIAR: ${draftScheduledDate || 'HOY'} ${draftScheduledTime || '22:00'}`}
          </span>
        </motion.button>
      </div>
    </div>
  );
}
