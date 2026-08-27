'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'motion/react';
import { AppState, PlayerStatus, AvailabilityType, DiscordStatus } from './types';
import { playTacticalSound } from './utils/audio';

import Header from './components/Header';
import ControlPanel from './components/ControlPanel';
import SquadList from './components/SquadList';
import SquadSummary from './components/SquadSummary';
import GamesCatalog from './components/GamesCatalog';
import PwaModal from './components/PwaModal';
import QSosModal from './components/QSosModal';

export default function HomePage() {
  const [appState, setAppState] = useState<AppState | null>(null);
  const [activePlayerId, setActivePlayerId] = useState<string>('ian');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [showPwaModal, setShowPwaModal] = useState<boolean>(false);
  const [showCatalog, setShowCatalog] = useState<boolean>(false);
  const [showQSosModal, setShowQSosModal] = useState<boolean>(true);
  const [lastSyncTime, setLastSyncTime] = useState<string>('');

  const [isPushSubscribed, setIsPushSubscribed] = useState<boolean>(false);
  const [isPushSupported, setIsPushSupported] = useState<boolean>(false);
  const [isSubscribingPush, setIsSubscribingPush] = useState<boolean>(false);
  const [pushStatusMessage, setPushStatusMessage] = useState<string>('');

  const [draftAvailability, setDraftAvailability] = useState<AvailabilityType>('now');
  const [draftScheduledTime, setDraftScheduledTime] = useState<string>('22:00');
  const [draftScheduledDate, setDraftScheduledDate] = useState<string>('Hoy');
  const [draftDiscordStatus, setDraftDiscordStatus] = useState<DiscordStatus>('in_voice');
  const [draftCustomNote, setDraftCustomNote] = useState<string>('');

  const initializedRef = useRef(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
      setIsPushSupported(true);
      navigator.serviceWorker.register('/sw.js').then(async (reg) => {
        const sub = await reg.pushManager.getSubscription();
        if (sub) setIsPushSubscribed(true);
      }).catch((err) => console.warn('SW error:', err));
    }
  }, []);

  const handleTogglePush = async () => {
    if (!isPushSupported) {
      alert('Para notificaciones en iPhone: abrí en Safari › Compartir › Agregar a Inicio › abrir la app desde inicio.');
      return;
    }
    setIsSubscribingPush(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      if (isPushSubscribed) {
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await sub.unsubscribe();
          await fetch('/api/push/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'unsubscribe', subscription: sub }),
          });
        }
        setIsPushSubscribed(false);
        setPushStatusMessage('Notificaciones desactivadas');
      } else {
        const keyRes = await fetch('/api/push/subscribe');
        const { publicKey } = await keyRes.json();
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          setIsSubscribingPush(false);
          return;
        }
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: (function (base64String: string) {
            const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
            const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
            const rawData = window.atob(base64);
            const outputArray = new Uint8Array(rawData.length);
            for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
            return outputArray;
          })(publicKey),
        });
        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription: sub, userId: activePlayerId }),
        });
        setIsPushSubscribed(true);
        setPushStatusMessage('¡Notificaciones activadas!');
        if (soundEnabled) playTacticalSound('ready');
      }
    } catch (err) {
      console.error('Push error:', err);
    } finally {
      setIsSubscribingPush(false);
      setTimeout(() => setPushStatusMessage(''), 3000);
    }
  };

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/status', { cache: 'no-store' });
      if (!res.ok) throw new Error();
      const data: AppState = await res.json();
      setAppState((prev) => {
        if (prev && soundEnabled) {
          const prevReady = prev.players.filter((p) => p.availability === 'now').length;
          const newReady = data.players.filter((p) => p.availability === 'now').length;
          if (newReady > prevReady) {
            if (newReady >= 5) playTacticalSound('squad_full');
            else playTacticalSound('ready');
          }
        }
        return data;
      });
      setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setIsLoading(false);
    } catch {
      setIsLoading(false);
    }
  }, [soundEnabled]);

  useEffect(() => {
    fetchStatus();
    const t = setInterval(fetchStatus, 4000);
    return () => clearInterval(t);
  }, [fetchStatus]);

  useEffect(() => {
    const s = localStorage.getItem('q_sale_active_user');
    if (s) setActivePlayerId(s);
  }, []);

  useEffect(() => {
    if (!appState?.players.length || initializedRef.current) return;
    const current = appState.players.find((p) => p.id === activePlayerId) ?? appState.players[0];
    if (current) {
      setDraftAvailability(current.availability);
      setDraftScheduledTime(current.scheduledTime || '22:00');
      setDraftScheduledDate(current.scheduledDate || 'Hoy');
      setDraftDiscordStatus(current.discordStatus);
      setDraftCustomNote(current.customNote || '');
      initializedRef.current = true;
    }
  }, [appState, activePlayerId]);

  const handleSelectUser = (id: string) => {
    setActivePlayerId(id);
    localStorage.setItem('q_sale_active_user', id);
    const p = appState?.players.find((x) => x.id === id);
    if (p) {
      setDraftAvailability(p.availability);
      setDraftScheduledTime(p.scheduledTime || '22:00');
      setDraftScheduledDate(p.scheduledDate || 'Hoy');
      setDraftDiscordStatus(p.discordStatus);
      setDraftCustomNote(p.customNote || '');
    }
    if (soundEnabled) playTacticalSound('ping');
  };

  const handleSaveStatus = async (overrides?: Partial<PlayerStatus>) => {
    if (!activePlayerId || !appState) return;
    setIsUpdating(true);

    const targetAvailability = overrides?.availability ?? draftAvailability;
    const targetDiscord = overrides?.discordStatus ?? draftDiscordStatus;
    const targetTime =
      overrides?.scheduledTime ??
      (targetAvailability === 'scheduled' || targetAvailability === 'soon' ? draftScheduledTime : undefined);
    const targetDate = overrides?.scheduledDate ?? (targetAvailability === 'scheduled' ? draftScheduledDate : undefined);
    const targetNote = overrides?.customNote ?? draftCustomNote;

    const payload: Partial<PlayerStatus> & { id: string } = {
      id: activePlayerId,
      availability: targetAvailability,
      scheduledTime: targetTime,
      scheduledDate: targetDate,
      discordStatus: targetDiscord,
      gameId: 'r6_siege',
      gameMode: 'Ranked',
      customNote: targetNote,
    };

    // Optimistic UI update
    setAppState((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        players: prev.players.map((p) =>
          p.id === activePlayerId
            ? {
                ...p,
                availability: targetAvailability,
                discordStatus: targetDiscord,
                scheduledTime: targetTime,
                scheduledDate: targetDate,
                customNote: targetNote,
              }
            : p
        ),
      };
    });

    if (soundEnabled) {
      if (payload.availability === 'now') playTacticalSound('ready');
      else playTacticalSound('ping');
    }

    try {
      const res = await fetch('/api/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_player', player: payload, sendNotification: true }),
      });
      const data = await res.json();
      if (data.state) {
        setAppState(data.state);
      }
    } catch (err) {
      console.error('Error saving status:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleQuickReady = () => {
    setDraftAvailability('now');
    setDraftDiscordStatus('in_voice');
    handleSaveStatus({ availability: 'now', discordStatus: 'in_voice' });
  };

  const players = appState?.players || [];
  const readyNowPlayers = players.filter((p) => p.availability === 'now');
  const inVoicePlayers = players.filter((p) => p.discordStatus === 'in_voice');
  const readyCount = readyNowPlayers.length;
  const maxSquad = 5;
  const isSquadFull = readyCount >= maxSquad;
  const activePlayer = players.find((p) => p.id === activePlayerId);

  return (
    <main className="min-h-svh w-full flex items-center justify-center p-3 sm:p-6 pb-16 sm:pb-20 bg-black overflow-x-hidden">
      {/* 🎮 Retro Arcade Console Frame with Generous Padding */}
      <div className="console-outer w-full max-w-[680px] p-4 sm:p-6 pt-5 sm:pt-6 pb-5 sm:pb-6 flex flex-col gap-4 sm:gap-5">
        {/* Top Header (contains the 1st Marquee Stripe directly under the logo) */}
        <Header
          appState={appState}
          lastSyncTime={lastSyncTime}
          soundEnabled={soundEnabled}
          setSoundEnabled={setSoundEnabled}
          isPushSubscribed={isPushSubscribed}
          handleTogglePush={handleTogglePush}
          isSubscribingPush={isSubscribingPush}
          pushStatusMessage={pushStatusMessage}
        />

        {/* Responsive Dashboard: Stacked flow on Mobile (<md), 3-Column Arcade Grid on Tablet/Desktop (md+) */}
        <div className="flex flex-col md:grid md:grid-cols-[minmax(0,140px)_minmax(0,1.55fr)_minmax(0,150px)] gap-4 sm:gap-5 items-start w-full px-0.5">
          {/* Col 1 on Desktop, 2nd on Mobile (Disponibilidad) */}
          <div className="order-2 md:order-1 min-w-0 w-full p-1">
            <ControlPanel
              players={players}
              activePlayerId={activePlayerId}
              activePlayer={activePlayer}
              handleSelectUser={handleSelectUser}
              draftAvailability={draftAvailability}
              setDraftAvailability={setDraftAvailability}
              draftScheduledDate={draftScheduledDate}
              setDraftScheduledDate={setDraftScheduledDate}
              draftScheduledTime={draftScheduledTime}
              setDraftScheduledTime={setDraftScheduledTime}
              draftDiscordStatus={draftDiscordStatus}
              setDraftDiscordStatus={setDraftDiscordStatus}
              draftCustomNote={draftCustomNote}
              setDraftCustomNote={setDraftCustomNote}
              handleSaveStatus={handleSaveStatus}
              isUpdating={isUpdating}
              onOpenQSosModal={() => setShowQSosModal(true)}
            />
          </div>

          {/* Col 2 on Desktop, 1st on Mobile (Squad Status Cards - Hero) */}
          <div className="order-1 md:order-2 min-w-0 w-full p-1">
            <SquadList
              players={players}
              activePlayerId={activePlayerId}
              maxSquad={maxSquad}
              isLoading={isLoading}
            />
          </div>

          {/* Col 3 on Desktop, 3rd on Mobile (Squad Summary & Controls) */}
          <div className="order-3 md:order-3 min-w-0 w-full p-1">
            <SquadSummary
              readyCount={readyCount}
              players={players}
              readyNowPlayers={readyNowPlayers}
              isSquadFull={isSquadFull}
              maxSquad={maxSquad}
              handleQuickReady={handleQuickReady}
              isUpdating={isUpdating}
              onOpenCatalog={() => setShowCatalog(!showCatalog)}
              onOpenPwaModal={() => setShowPwaModal(true)}
            />
          </div>
        </div>

        {/* Games Catalog Accordion */}
        <GamesCatalog showCatalog={showCatalog} setShowCatalog={setShowCatalog} />
      </div>

      {/* 🚀 Fixed Bottom Floating Arcade Bar with Animated Marquee and ¿Q-SOS? X Button */}
      <div className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-center p-2.5 sm:p-4 pointer-events-none">
        <div className="w-full max-w-[680px] relative flex items-center justify-center px-4 py-2 pointer-events-auto">
          {/* Subtle dark backdrop glass pill */}
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md rounded-full border border-white/15 shadow-[0_4px_24px_rgba(0,0,0,0.9)] -z-10" />

          {/* Reverse animated marquee stripe */}
          <div className="w-[calc(100%-2rem)] h-1.5 sm:h-2 rainbow-stripe-animated-reverse rounded-full absolute top-1/2 -translate-y-1/2 left-4" />

          {/* X button floating on top of the stripe */}
          <motion.button
            whileTap={{ scale: 0.88, y: 1 }}
            whileHover={{ scale: 1.08 }}
            onClick={() => setShowQSosModal(true)}
            className="relative z-10 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black border-2 border-black shadow-[0_0_0_2px_#F4F4E6,0_2px_10px_rgba(0,0,0,0.9)] flex items-center justify-center cursor-pointer hover:bg-[#222] transition-colors"
            title="¿Q-SOS? Elige tu personaje"
          >
            <span className="text-[#F4F4E6] font-black text-sm select-none">✖</span>
          </motion.button>
        </div>
      </div>

      {/* ¿Q-SOS? Roster Selector Modal */}
      <QSosModal
        showModal={showQSosModal}
        setShowModal={setShowQSosModal}
        players={players}
        activePlayerId={activePlayerId}
        onSelectUser={handleSelectUser}
      />

      {/* PWA Modal */}
      <PwaModal showPwaModal={showPwaModal} setShowPwaModal={setShowPwaModal} />
    </main>
  );
}
