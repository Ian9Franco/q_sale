'use client';

import React, { useState, useEffect, useCallback, useId } from 'react';
import { AppState, PlayerStatus, GAMES_CATALOG, AvailabilityType, DiscordStatus, GameId } from './types';

// Helper to convert base64 URL to Uint8Array for VAPID
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Web Audio API Synthesizer for tactical sounds
const playTacticalSound = (type: 'ping' | 'ready' | 'squad_full') => {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    if (type === 'ping') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } else if (type === 'ready') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08);
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.16);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } else if (type === 'squad_full') {
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);
        gain.gain.setValueAtTime(0.2, ctx.currentTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + idx * 0.08 + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.08);
        osc.stop(ctx.currentTime + idx * 0.08 + 0.25);
      });
    }
  } catch {
    // Audio might be blocked before user interaction
  }
};

const OPERATOR_AVATARS = [
  { id: 'ash', name: 'Ash', role: 'Entry Fragger', icon: '⚡' },
  { id: 'sledge', name: 'Sledge', role: 'Soft Breacher', icon: '🔨' },
  { id: 'smoke', name: 'Smoke', role: 'Area Denial', icon: '💨' },
  { id: 'jager', name: 'Jäger', role: 'Anti-Gadget', icon: '🎯' },
  { id: 'thermite', name: 'Thermite', role: 'Hard Breacher', icon: '💥' },
  { id: 'valkyrie', name: 'Valkyrie', role: 'Intel / Cams', icon: '📷' },
  { id: 'doc', name: 'Doc', role: 'Healer / Support', icon: '💉' },
  { id: 'recruit', name: 'Recruit', role: 'Flex Operator', icon: '🎖️' },
];

export default function HomePage() {
  const [appState, setAppState] = useState<AppState | null>(null);
  const [activePlayerId, setActivePlayerId] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [showPwaModal, setShowPwaModal] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [discordInviteInput, setDiscordInviteInput] = useState<string>('');
  const [lastSyncTime, setLastSyncTime] = useState<string>('');

  // Push Notifications state
  const [isPushSubscribed, setIsPushSubscribed] = useState<boolean>(false);
  const [isPushSupported, setIsPushSupported] = useState<boolean>(false);
  const [isSubscribingPush, setIsSubscribingPush] = useState<boolean>(false);
  const [pushStatusMessage, setPushStatusMessage] = useState<string>('');

  // Player draft edit state
  const [draftAvailability, setDraftAvailability] = useState<AvailabilityType>('now');
  const [draftScheduledTime, setDraftScheduledTime] = useState<string>('22:00');
  const [draftScheduledDate, setDraftScheduledDate] = useState<string>('Hoy');
  const [draftDiscordStatus, setDraftDiscordStatus] = useState<DiscordStatus>('in_voice');
  const [draftGameMode, setDraftGameMode] = useState<string>('Ranked 🏆');
  const [draftCustomNote, setDraftCustomNote] = useState<string>('');
  const [draftGameId, setDraftGameId] = useState<GameId>('r6_siege');

  // Register Service Worker & check Push status
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
      setIsPushSupported(true);
      navigator.serviceWorker.register('/sw.js').then(async (registration) => {
        const sub = await registration.pushManager.getSubscription();
        if (sub) {
          setIsPushSubscribed(true);
        }
      }).catch(err => {
        console.warn('Service worker registration failed:', err);
      });
    }
  }, []);

  const handleTogglePushNotification = async () => {
    if (!isPushSupported) {
      alert('Tu navegador no soporta notificaciones push directamente. Si estás en iPhone, añade primero la web a la pantalla de inicio (Compartir -> Agregar a Inicio).');
      return;
    }

    setIsSubscribingPush(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      
      if (isPushSubscribed) {
        // Unsubscribe
        const sub = await registration.pushManager.getSubscription();
        if (sub) {
          await sub.unsubscribe();
          await fetch('/api/push/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'unsubscribe', subscription: sub }),
          });
        }
        setIsPushSubscribed(false);
        setPushStatusMessage('Notificaciones desactivadas.');
      } else {
        // Subscribe
        const keyRes = await fetch('/api/push/subscribe');
        const { publicKey } = await keyRes.json();
        
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          alert('Debes permitir las notificaciones en tu navegador para recibir los avisos del squad.');
          setIsSubscribingPush(false);
          return;
        }

        const sub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });

        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription: sub, userId: activePlayerId }),
        });

        setIsPushSubscribed(true);
        setPushStatusMessage('✅ ¡Notificaciones push activadas! Te avisará al celular cuando jueguen.');
        if (soundEnabled) playTacticalSound('ready');
      }
    } catch (err) {
      console.error('Error con push notifications:', err);
      alert('Error activando notificaciones: ' + String(err));
    } finally {
      setIsSubscribingPush(false);
      setTimeout(() => setPushStatusMessage(''), 4000);
    }
  };

  const handleSendTestPush = async () => {
    try {
      await fetch('/api/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: '¿Qué Sale? - Prueba 🎯',
          message: '¡Las notificaciones al celular están funcionando perfecto!',
        }),
      });
      alert('Notificación enviada. Deberías verla en tu celular/navegador en unos segundos.');
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch state from backend API
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/status', { cache: 'no-store' });
      if (!res.ok) throw new Error('Error al sincronizar');
      const data: AppState = await res.json();
      
      setAppState(prev => {
        if (prev && soundEnabled) {
          const prevReady = prev.players.filter(p => p.availability === 'now').length;
          const newReady = data.players.filter(p => p.availability === 'now').length;
          if (newReady > prevReady) {
            if (newReady >= 5) {
              playTacticalSound('squad_full');
            } else {
              playTacticalSound('ready');
            }
          }
        }
        return data;
      });
      setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setIsLoading(false);
    } catch (err) {
      console.error('Error cargando estado:', err);
      setIsLoading(false);
    }
  }, [soundEnabled]);

  // Initial load & Polling
  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 4000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  // Read active user from localStorage
  useEffect(() => {
    const savedUserId = localStorage.getItem('q_sale_active_user');
    if (savedUserId) {
      setActivePlayerId(savedUserId);
    }
  }, []);

  // Update draft form when active player changes or state loads
  useEffect(() => {
    if (appState && appState.players.length > 0) {
      const current = appState.players.find(p => p.id === activePlayerId) || appState.players[0];
      if (current) {
        if (!activePlayerId) {
          setActivePlayerId(current.id);
          localStorage.setItem('q_sale_active_user', current.id);
        }
        setDraftAvailability(current.availability);
        setDraftScheduledTime(current.scheduledTime || '22:00');
        setDraftScheduledDate(current.scheduledDate || 'Hoy');
        setDraftDiscordStatus(current.discordStatus);
        setDraftGameMode(current.gameMode || 'Ranked 🏆');
        setDraftCustomNote(current.customNote || '');
        setDraftGameId(current.gameId || 'r6_siege');
      }
      setDiscordInviteInput(appState.discordInviteUrl || '');
    }
  }, [appState, activePlayerId]);

  const handleSelectUser = (id: string) => {
    setActivePlayerId(id);
    localStorage.setItem('q_sale_active_user', id);
    const p = appState?.players.find(item => item.id === id);
    if (p) {
      setDraftAvailability(p.availability);
      setDraftScheduledTime(p.scheduledTime || '22:00');
      setDraftScheduledDate(p.scheduledDate || 'Hoy');
      setDraftDiscordStatus(p.discordStatus);
      setDraftGameMode(p.gameMode || 'Ranked 🏆');
      setDraftCustomNote(p.customNote || '');
      setDraftGameId(p.gameId || 'r6_siege');
    }
    if (soundEnabled) playTacticalSound('ping');
  };

  const handleSaveStatus = async (overrides?: Partial<PlayerStatus>) => {
    if (!activePlayerId || !appState) return;
    setIsUpdating(true);

    const activePlayer = appState.players.find(p => p.id === activePlayerId);
    if (!activePlayer) return;

    const payload: Partial<PlayerStatus> & { id: string } = {
      id: activePlayerId,
      availability: overrides?.availability ?? draftAvailability,
      scheduledTime: overrides?.scheduledTime ?? (draftAvailability === 'scheduled' || draftAvailability === 'soon' ? draftScheduledTime : undefined),
      scheduledDate: overrides?.scheduledDate ?? (draftAvailability === 'scheduled' ? draftScheduledDate : undefined),
      discordStatus: overrides?.discordStatus ?? draftDiscordStatus,
      gameId: overrides?.gameId ?? draftGameId,
      gameMode: overrides?.gameMode ?? draftGameMode,
      customNote: overrides?.customNote ?? draftCustomNote,
    };

    try {
      const res = await fetch('/api/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_player', player: payload, sendNotification: true }),
      });
      const data = await res.json();
      if (data.state) {
        setAppState(data.state);
        if (soundEnabled) {
          if (payload.availability === 'now') playTacticalSound('ready');
          else playTacticalSound('ping');
        }
      }
    } catch (err) {
      console.error('Error guardando estado:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleQuickReadyAndDiscord = () => {
    setDraftAvailability('now');
    setDraftDiscordStatus('in_voice');
    handleSaveStatus({ availability: 'now', discordStatus: 'in_voice' });
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_settings',
          discordInviteUrl: discordInviteInput,
        }),
      });
      const data = await res.json();
      if (data.state) {
        setAppState(data.state);
        setShowSettingsModal(false);
      }
    } catch (err) {
      console.error('Error guardando configuración:', err);
    }
  };

  const players = appState?.players || [];
  const readyNowPlayers = players.filter(p => p.availability === 'now');
  const scheduledPlayers = players.filter(p => p.availability === 'scheduled' || p.availability === 'soon');
  const inVoiceCount = players.filter(p => p.discordStatus === 'in_voice').length;
  
  const currentGame = GAMES_CATALOG.find(g => g.id === (appState?.activeGameId || 'r6_siege')) || GAMES_CATALOG[0];
  const maxSquad = currentGame.maxSquad;
  const readyCount = readyNowPlayers.length;
  const isSquadFull = readyCount >= maxSquad;

  const activePlayer = players.find(p => p.id === activePlayerId);

  const newPlayerNameInputId = useId();
  const newPlayerAvatarSelectId = useId();
  const discordInviteInputId = useId();

  return (
    <main style={{ minHeight: '100vh', padding: '16px 12px 60px 12px', maxWidth: '1100px', margin: '0 auto' }}>
      
      {/* Top Navbar */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        marginBottom: '16px',
        borderRadius: '16px',
        background: 'rgba(15, 23, 42, 0.8)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(12px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #ff9f1c, #ff3838)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(255, 159, 28, 0.4)',
          }}>
            <span style={{ fontSize: '22px', fontWeight: 900, color: '#fff' }}>Q</span>
          </div>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 900, letterSpacing: '1px', textTransform: 'uppercase', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
              ¿Qué Sale? <span style={{ fontSize: '0.75rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(255, 159, 28, 0.2)', color: 'var(--accent-r6)', border: '1px solid var(--accent-r6)' }}>R6 SQUAD</span>
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00e676', display: 'inline-block', boxShadow: '0 0 8px #00e676' }}></span>
              <span>En vivo {lastSyncTime && `• ${lastSyncTime}`}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="btn btn-ghost"
            style={{ padding: '8px 12px', fontSize: '0.85rem' }}
            title={soundEnabled ? 'Silenciar sonidos' : 'Activar sonidos'}
          >
            {soundEnabled ? '🔊' : '🔇'}
          </button>

          <button
            onClick={() => setShowPwaModal(true)}
            className="btn btn-ghost"
            style={{ padding: '8px 12px', fontSize: '0.85rem', border: '1px solid rgba(0, 240, 255, 0.3)', color: '#00f0ff' }}
          >
            📱 Instalar App
          </button>

          {appState?.discordInviteUrl && (
            <a
              href={appState.discordInviteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-discord"
              style={{ padding: '8px 14px', fontSize: '0.85rem', textDecoration: 'none' }}
            >
              🎙️ Discord
            </a>
          )}

          <button
            onClick={() => setShowSettingsModal(true)}
            className="btn btn-ghost"
            style={{ padding: '8px 10px', fontSize: '0.9rem' }}
            title="Configuración"
          >
            ⚙️
          </button>
        </div>
      </header>

      {/* Push Notification Activation Banner */}
      <div style={{
        padding: '10px 16px',
        borderRadius: '12px',
        marginBottom: '20px',
        background: isPushSubscribed ? 'rgba(0, 230, 118, 0.1)' : 'rgba(88, 101, 242, 0.15)',
        border: `1px solid ${isPushSubscribed ? 'rgba(0, 230, 118, 0.3)' : 'rgba(88, 101, 242, 0.4)'}`,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '10px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '20px' }}>{isPushSubscribed ? '🔔' : '🔕'}</span>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: isPushSubscribed ? '#00e676' : '#fff' }}>
              {isPushSubscribed ? 'Notificaciones Push activadas en este dispositivo' : '¿Querés que te suene el celular cuando alguien avise que juega?'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {isPushSubscribed ? 'Recibirás un aviso cuando un amigo entre a Discord o a R6.' : 'Activá las alertas para que te llegue la notificación directo a la pantalla de bloqueo.'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {isPushSubscribed && (
            <button
              onClick={handleSendTestPush}
              className="btn btn-ghost"
              style={{ padding: '6px 12px', fontSize: '0.75rem' }}
            >
              Test Alerta 🚀
            </button>
          )}
          <button
            onClick={handleTogglePushNotification}
            disabled={isSubscribingPush}
            className={`btn ${isPushSubscribed ? 'btn-ghost' : 'btn-primary'}`}
            style={{ padding: '8px 14px', fontSize: '0.8rem' }}
          >
            {isSubscribingPush ? 'Configurando...' : isPushSubscribed ? 'Desactivar 🔕' : 'Activar Notificaciones 🔔'}
          </button>
        </div>
      </div>

      {pushStatusMessage && (
        <div style={{ padding: '8px 14px', borderRadius: '8px', background: 'rgba(0, 230, 118, 0.2)', color: '#00e676', fontSize: '0.85rem', marginBottom: '16px', textAlign: 'center', fontWeight: 700 }}>
          {pushStatusMessage}
        </div>
      )}

      {/* Main Squad Hero Banner */}
      <section style={{
        position: 'relative',
        borderRadius: '20px',
        padding: '24px 20px',
        marginBottom: '24px',
        overflow: 'hidden',
        background: 'linear-gradient(145deg, rgba(16, 24, 40, 0.95), rgba(10, 15, 26, 0.98))',
        border: isSquadFull ? '2px solid #00e676' : '1px solid rgba(255, 159, 28, 0.3)',
        boxShadow: isSquadFull ? '0 0 35px rgba(0, 230, 118, 0.25)' : '0 10px 30px rgba(0, 0, 0, 0.5)',
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          width: '40%',
          opacity: 0.12,
          backgroundImage: 'radial-gradient(#ff9f1c 1.5px, transparent 1.5px)',
          backgroundSize: '16px 16px',
          pointerEvents: 'none',
        }} />

        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px', position: 'relative', zIndex: 2 }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 12px', borderRadius: '999px', background: 'rgba(255, 159, 28, 0.15)', border: '1px solid rgba(255, 159, 28, 0.3)', marginBottom: '10px' }}>
              <span style={{ fontSize: '13px' }}>🎯</span>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--accent-r6)', letterSpacing: '1px', textTransform: 'uppercase' }}>
                {currentGame.name}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
              <h2 style={{ fontSize: '2rem', fontWeight: 900, margin: 0, color: '#fff', letterSpacing: '-0.5px' }}>
                {readyCount} <span style={{ fontSize: '1.2rem', color: 'var(--text-muted)', fontWeight: 600 }}>/ {maxSquad} Listos</span>
              </h2>
              {isSquadFull && (
                <span className="live-pulse" style={{ padding: '4px 10px', borderRadius: '6px', background: '#00e676', color: '#000', fontWeight: 900, fontSize: '0.75rem', letterSpacing: '1px' }}>
                  ¡ESCUADRA COMPLETA! 🔥
                </span>
              )}
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '6px' }}>
              {isSquadFull
                ? '¡Hay 5 jugadores listos! Métanse a Discord para rankear ya.'
                : readyCount === 0
                ? 'Nadie está listo ahora mismo. Marcá tu disponibilidad abajo para convocar al squad.'
                : `Faltan ${maxSquad - readyCount} jugadores para armar el equipo de 5.`}
            </p>
          </div>

          {/* Quick Action Button */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              onClick={handleQuickReadyAndDiscord}
              disabled={isUpdating}
              className="btn btn-success"
              style={{
                padding: '14px 24px',
                fontSize: '1rem',
                borderRadius: '12px',
                transform: activePlayer?.availability === 'now' && activePlayer?.discordStatus === 'in_voice' ? 'scale(0.98)' : 'scale(1)',
              }}
            >
              Avisar Squad
            </button>
          </div>
        </div>

        {/* 5-Slot Squad Indicator */}
        <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
          {[0, 1, 2, 3, 4].map((index) => {
            const playerInSlot = readyNowPlayers[index];
            const isFilled = !!playerInSlot;
            return (
              <div
                key={index}
                style={{
                  height: '52px',
                  borderRadius: '10px',
                  border: isFilled ? '1px solid rgba(0, 230, 118, 0.5)' : '1px dashed rgba(255, 255, 255, 0.15)',
                  background: isFilled ? 'linear-gradient(135deg, rgba(0, 230, 118, 0.15), rgba(0, 184, 148, 0.1))' : 'rgba(15, 23, 42, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 10px',
                  gap: '8px',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {isFilled ? (
                  <>
                    <span style={{ fontSize: '18px' }}>
                      {OPERATOR_AVATARS.find(o => o.id === playerInSlot.avatar)?.icon || '🎮'}
                    </span>
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                        {playerInSlot.name}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#00e676', fontWeight: 700 }}>
                        Slot {index + 1}
                      </div>
                    </div>
                  </>
                ) : (
                  <div style={{ width: '100%', textAlign: 'center', color: 'rgba(255, 255, 255, 0.25)', fontSize: '0.75rem', fontWeight: 600 }}>
                    Slot {index + 1} Libre
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Discord Voice Status Row */}
        <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-muted)', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '16px' }}>🎙️</span>
            <span><strong>{inVoiceCount}</strong> amigos ya en el canal de voz de Discord</span>
          </div>
          {scheduledPlayers.length > 0 && (
            <div style={{ color: 'var(--status-scheduled)' }}>
              ⏳ <strong>{scheduledPlayers.length}</strong> se suman más tarde
            </div>
          )}
        </div>
      </section>

      {/* Main Grid: Control Panel + Live Squad List */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        
        {/* Left Column: Your Status Control Panel */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          
          {/* Who are you selector */}
          <div style={{ marginBottom: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Jugador Activo
              </label>
            </div>

            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '6px' }}>
              {players.map(p => {
                const isSelected = p.id === activePlayerId;
                const op = OPERATOR_AVATARS.find(o => o.id === p.avatar);
                return (
                  <button
                    key={p.id}
                    onClick={() => handleSelectUser(p.id)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '10px',
                      border: isSelected ? '2px solid var(--accent-r6)' : '1px solid rgba(255, 255, 255, 0.1)',
                      background: isSelected ? 'rgba(255, 159, 28, 0.2)' : 'rgba(15, 23, 42, 0.6)',
                      color: isSelected ? '#fff' : 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: isSelected ? 800 : 500,
                      whiteSpace: 'nowrap',
                      transition: 'all 0.2s',
                    }}
                  >
                    <span>{op?.icon || '🎮'}</span>
                    <span>{p.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <hr style={{ borderColor: 'rgba(255, 255, 255, 0.08)', margin: '16px 0' }} />

          {/* Availability State Picker */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>
              Disponibilidad
            </label>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setDraftAvailability('now')}
                style={{
                  padding: '12px',
                  borderRadius: '10px',
                  border: draftAvailability === 'now' ? '2px solid #00e676' : '1px solid rgba(255, 255, 255, 0.08)',
                  background: draftAvailability === 'now' ? 'rgba(0, 230, 118, 0.15)' : 'rgba(15, 23, 42, 0.6)',
                  color: draftAvailability === 'now' ? '#00e676' : 'var(--text-main)',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                Disponible YA
              </button>

              <button
                type="button"
                onClick={() => setDraftAvailability('soon')}
                style={{
                  padding: '12px',
                  borderRadius: '10px',
                  border: draftAvailability === 'soon' ? '2px solid #00d2d3' : '1px solid rgba(255, 255, 255, 0.08)',
                  background: draftAvailability === 'soon' ? 'rgba(0, 210, 211, 0.15)' : 'rgba(15, 23, 42, 0.6)',
                  color: draftAvailability === 'soon' ? '#00d2d3' : 'var(--text-main)',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                En 15-30 min
              </button>

              <button
                type="button"
                onClick={() => setDraftAvailability('scheduled')}
                style={{
                  padding: '12px',
                  borderRadius: '10px',
                  border: draftAvailability === 'scheduled' ? '2px solid #ffb800' : '1px solid rgba(255, 255, 255, 0.08)',
                  background: draftAvailability === 'scheduled' ? 'rgba(255, 184, 0, 0.15)' : 'rgba(15, 23, 42, 0.6)',
                  color: draftAvailability === 'scheduled' ? '#ffb800' : 'var(--text-main)',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                Programado
              </button>

              <button
                type="button"
                onClick={() => setDraftAvailability('offline')}
                style={{
                  padding: '12px',
                  borderRadius: '10px',
                  border: draftAvailability === 'offline' ? '2px solid #64748b' : '1px solid rgba(255, 255, 255, 0.08)',
                  background: draftAvailability === 'offline' ? 'rgba(100, 116, 139, 0.2)' : 'rgba(15, 23, 42, 0.6)',
                  color: draftAvailability === 'offline' ? '#94a3b8' : 'var(--text-muted)',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                No disponible
              </button>
            </div>
          </div>

          {/* If Scheduled or Soon, pick time & day */}
          {(draftAvailability === 'scheduled' || draftAvailability === 'soon') && (
            <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '12px', borderRadius: '10px', marginBottom: '16px', border: '1px solid rgba(255, 184, 0, 0.2)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Día</label>
                  <select
                    value={draftScheduledDate}
                    onChange={(e) => setDraftScheduledDate(e.target.value)}
                  >
                    <option value="Hoy">Hoy</option>
                    <option value="Mañana">Mañana</option>
                    <option value="Viernes">Viernes</option>
                    <option value="Sábado">Sábado</option>
                    <option value="Domingo">Domingo</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Hora aproximada</label>
                  {draftAvailability === 'soon' ? (
                    <select
                      value={draftScheduledTime}
                      onChange={(e) => setDraftScheduledTime(e.target.value)}
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
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Discord Status Picker */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>
              Estado en Discord
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
              <button
                type="button"
                onClick={() => setDraftDiscordStatus('in_voice')}
                style={{
                  padding: '8px 6px',
                  borderRadius: '8px',
                  border: draftDiscordStatus === 'in_voice' ? '2px solid #5865f2' : '1px solid rgba(255, 255, 255, 0.08)',
                  background: draftDiscordStatus === 'in_voice' ? 'rgba(88, 101, 242, 0.25)' : 'rgba(15, 23, 42, 0.6)',
                  color: draftDiscordStatus === 'in_voice' ? '#fff' : 'var(--text-muted)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                En Canal
              </button>

              <button
                type="button"
                onClick={() => setDraftDiscordStatus('joining')}
                style={{
                  padding: '8px 6px',
                  borderRadius: '8px',
                  border: draftDiscordStatus === 'joining' ? '2px solid #00f0ff' : '1px solid rgba(255, 255, 255, 0.08)',
                  background: draftDiscordStatus === 'joining' ? 'rgba(0, 240, 255, 0.2)' : 'rgba(15, 23, 42, 0.6)',
                  color: draftDiscordStatus === 'joining' ? '#00f0ff' : 'var(--text-muted)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Entrando
              </button>

              <button
                type="button"
                onClick={() => setDraftDiscordStatus('offline')}
                style={{
                  padding: '8px 6px',
                  borderRadius: '8px',
                  border: draftDiscordStatus === 'offline' ? '2px solid #64748b' : '1px solid rgba(255, 255, 255, 0.08)',
                  background: draftDiscordStatus === 'offline' ? 'rgba(100, 116, 139, 0.2)' : 'rgba(15, 23, 42, 0.6)',
                  color: draftDiscordStatus === 'offline' ? '#94a3b8' : 'var(--text-muted)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Desconectado
              </button>
            </div>
          </div>

          {/* Mode & Note */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Modo de Juego</label>
                <select
                  value={draftGameMode}
                  onChange={(e) => setDraftGameMode(e.target.value)}
                >
                  {currentGame.availableModes.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Juego</label>
                <select
                  value={draftGameId}
                  onChange={(e) => setDraftGameId(e.target.value as GameId)}
                >
                  {GAMES_CATALOG.filter(g => g.isSelectable).map(g => (
                    <option key={g.id} value={g.id}>
                      {g.shortName} {g.statusBadge === 'unclassified' ? '(Desclasificado)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Mensaje para el grupo (opcional)</label>
              <input
                type="text"
                placeholder="ej: Termino de cenar y me sumo / Juego 2 rankeds"
                value={draftCustomNote}
                onChange={(e) => setDraftCustomNote(e.target.value)}
              />
            </div>
          </div>

          {/* Submit Update Button */}
          <button
            onClick={() => handleSaveStatus()}
            disabled={isUpdating}
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', fontSize: '1rem' }}
          >
            {isUpdating ? 'Notificando al squad...' : 'Actualizar y Notificar'}
          </button>
        </div>

        {/* Right Column: Live Friends Squad Board */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              Estado del Squad
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {players.length} amigos en el radar
            </span>
          </div>

          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              Cargando disponibilidad de la escuadra...
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {players.map((p) => {
                const op = OPERATOR_AVATARS.find(o => o.id === p.avatar);
                const isReady = p.availability === 'now';
                const isScheduled = p.availability === 'scheduled' || p.availability === 'soon';
                const isUserActive = p.id === activePlayerId;

                return (
                  <div
                    key={p.id}
                    className="glass-panel tactical-border"
                    style={{
                      padding: '14px 16px',
                      display: 'flex',
                      flexWrap: 'wrap',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '12px',
                      borderLeft: `4px solid ${isReady ? '#00e676' : isScheduled ? '#ffb800' : '#64748b'}`,
                      background: isUserActive ? 'rgba(30, 41, 59, 0.85)' : 'rgba(15, 23, 42, 0.65)',
                    }}
                  >
                    {/* Left: Avatar + Name + Note */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1 1 200px' }}>
                      <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '12px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '22px',
                        position: 'relative',
                      }}>
                        {op?.icon || '🎮'}
                        {p.discordStatus === 'in_voice' && (
                          <span
                            title="En canal de voz de Discord"
                            style={{
                              position: 'absolute',
                              bottom: '-3px',
                              right: '-3px',
                              width: '14px',
                              height: '14px',
                              borderRadius: '50%',
                              background: '#5865f2',
                              border: '2px solid #0a0e17',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '8px',
                              color: '#fff',
                            }}
                          >
                            🎙️
                          </span>
                        )}
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 800, fontSize: '1rem', color: '#fff' }}>
                            {p.name}
                          </span>
                          {isUserActive && (
                            <span style={{ fontSize: '0.65rem', padding: '1px 6px', borderRadius: '4px', background: 'rgba(255, 159, 28, 0.2)', color: 'var(--accent-r6)', fontWeight: 800 }}>
                              TÚ
                            </span>
                          )}
                        </div>

                        {p.customNote ? (
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px', fontStyle: 'italic' }}>
                            &ldquo;{p.customNote}&rdquo;
                          </div>
                        ) : (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                            {op?.name} ({op?.role})
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Availability Badge + Discord Tag */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      {/* Availability Badge */}
                      {isReady && (
                        <div style={{
                          padding: '6px 12px',
                          borderRadius: '8px',
                          background: 'rgba(0, 230, 118, 0.15)',
                          border: '1px solid #00e676',
                          color: '#00e676',
                          fontSize: '0.8rem',
                          fontWeight: 800,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00e676' }} className="live-pulse"></span>
                          DISPONIBLE YA
                        </div>
                      )}

                      {p.availability === 'soon' && (
                        <div style={{
                          padding: '6px 12px',
                          borderRadius: '8px',
                          background: 'rgba(0, 210, 211, 0.15)',
                          border: '1px solid #00d2d3',
                          color: '#00d2d3',
                          fontSize: '0.8rem',
                          fontWeight: 800,
                        }}>
                          ⏳ {p.scheduledTime || 'En breve'}
                        </div>
                      )}

                      {p.availability === 'scheduled' && (
                        <div style={{
                          padding: '6px 12px',
                          borderRadius: '8px',
                          background: 'rgba(255, 184, 0, 0.15)',
                          border: '1px solid #ffb800',
                          color: '#ffb800',
                          fontSize: '0.8rem',
                          fontWeight: 800,
                        }}>
                          🕒 {p.scheduledDate || 'Hoy'} {p.scheduledTime || '22:00'}
                        </div>
                      )}

                      {p.availability === 'offline' && (
                        <div style={{
                          padding: '6px 12px',
                          borderRadius: '8px',
                          background: 'rgba(100, 116, 139, 0.15)',
                          border: '1px solid #64748b',
                          color: '#94a3b8',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                        }}>
                          🔴 No disponible
                        </div>
                      )}

                      {/* Discord Status Pill */}
                      {p.discordStatus === 'in_voice' && (
                        <span style={{ fontSize: '0.75rem', padding: '4px 8px', borderRadius: '6px', background: '#5865f2', color: '#fff', fontWeight: 800 }}>
                          🎙️ En Discord
                        </span>
                      )}
                      {p.discordStatus === 'joining' && (
                        <span style={{ fontSize: '0.75rem', padding: '4px 8px', borderRadius: '6px', background: 'rgba(88, 101, 242, 0.2)', color: '#8ea1e1', border: '1px solid #5865f2', fontWeight: 700 }}>
                          ⏳ Conectando
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Catalog & Games Section */}
      <section style={{ marginBottom: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>
              Catálogo de Juegos
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 }}>
              Juego principal seleccionado: <strong>{currentGame.name}</strong>
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
          {GAMES_CATALOG.map((g) => {
            const isCurrent = g.id === currentGame.id;
            const playersForGame = players.filter(p => p.gameId === g.id && p.availability === 'now').length;

            return (
              <div
                key={g.id}
                className="glass-panel"
                style={{
                  padding: '16px',
                  borderRadius: '14px',
                  border: isCurrent
                    ? '2px solid var(--accent-r6)'
                    : g.statusBadge === 'unclassified'
                    ? '1px solid rgba(231, 76, 60, 0.4)'
                    : '1px solid rgba(255, 255, 255, 0.08)',
                  background: isCurrent
                    ? 'linear-gradient(145deg, rgba(255, 159, 28, 0.1), rgba(15, 23, 42, 0.8))'
                    : g.statusBadge === 'unclassified'
                    ? 'linear-gradient(145deg, rgba(231, 76, 60, 0.08), rgba(15, 23, 42, 0.8))'
                    : 'rgba(15, 23, 42, 0.6)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '12px',
                  opacity: g.statusBadge === 'coming_soon' ? 0.75 : 1,
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 900, color: '#fff', margin: 0 }}>
                      {g.name}
                    </h4>
                    
                    {/* Badge */}
                    <span style={{
                      fontSize: '0.68rem',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontWeight: 900,
                      letterSpacing: '0.5px',
                      background:
                        g.statusBadge === 'active'
                          ? 'var(--accent-r6)'
                          : g.statusBadge === 'unclassified'
                          ? 'rgba(231, 76, 60, 0.25)'
                          : 'rgba(168, 85, 247, 0.25)',
                      color:
                        g.statusBadge === 'active'
                          ? '#000'
                          : g.statusBadge === 'unclassified'
                          ? '#ff6b6b'
                          : '#c084fc',
                      border:
                        g.statusBadge === 'unclassified'
                          ? '1px solid #e74c3c'
                          : g.statusBadge === 'coming_soon'
                          ? '1px solid #a855f7'
                          : 'none',
                    }}>
                      {g.badgeLabel}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 10px 0' }}>
                    {g.tagline}
                  </p>

                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.7rem', padding: '3px 8px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.06)', color: 'var(--text-muted)' }}>
                      Escuadra: {g.maxSquad} personas
                    </span>
                    {g.isSelectable && (
                      <span style={{ fontSize: '0.7rem', padding: '3px 8px', borderRadius: '4px', background: 'rgba(0, 230, 118, 0.15)', color: '#00e676', fontWeight: 700 }}>
                        {playersForGame} listos ahora
                      </span>
                    )}
                  </div>
                </div>

                {g.isSelectable && !isCurrent && (
                  <button
                    onClick={async () => {
                      try {
                        const res = await fetch('/api/status', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ action: 'update_settings', activeGameId: g.id }),
                        });
                        const data = await res.json();
                        if (data.state) setAppState(data.state);
                      } catch (err) {
                        console.error(err);
                      }
                    }}
                    className="btn btn-ghost"
                    style={{ fontSize: '0.8rem', padding: '8px 12px', width: '100%' }}
                  >
                    Seleccionar como juego del grupo
                  </button>
                )}

                {!g.isSelectable && (
                  <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-dim)', padding: '6px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '6px' }}>
                    ⏳ Próximamente disponible
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* PWA Installation Modal */}
      {showPwaModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '16px',
        }}>
          <div className="glass-panel" style={{ maxWidth: '440px', width: '100%', padding: '24px', borderRadius: '20px', border: '1px solid var(--accent-cyan)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#00f0ff', margin: 0 }}>
                Instalar PWA
              </h3>
              <button
                onClick={() => setShowPwaModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', marginBottom: '16px' }}>
              Podés anclar <strong>Q-Sale?</strong> al escritorio de tu celular para recibir notificaciones y abrirla al instante como una app:
            </p>

            <div style={{ background: 'rgba(0, 0, 0, 0.4)', padding: '14px', borderRadius: '12px', marginBottom: '14px' }}>
              <div style={{ fontWeight: 800, color: '#fff', fontSize: '0.85rem', marginBottom: '6px' }}>
                🍏 En iPhone (Safari):
              </div>
              <ol style={{ paddingLeft: '20px', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                <li>Toca el botón <strong>Compartir</strong> (icono de cuadrado con flecha arriba).</li>
                <li>Baja y selecciona <strong>&ldquo;Agregar a Inicio&rdquo;</strong> (o &ldquo;Add to Home Screen&rdquo;).</li>
                <li>Toca <strong>Agregar</strong> en la esquina superior derecha.</li>
              </ol>
            </div>

            <div style={{ background: 'rgba(0, 0, 0, 0.4)', padding: '14px', borderRadius: '12px', marginBottom: '20px' }}>
              <div style={{ fontWeight: 800, color: '#fff', fontSize: '0.85rem', marginBottom: '6px' }}>
                🤖 En Android (Chrome / Edge):
              </div>
              <ol style={{ paddingLeft: '20px', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                <li>Toca los <strong>tres puntos (⋮)</strong> en la esquina superior derecha.</li>
                <li>Selecciona <strong>&ldquo;Instalar aplicación&rdquo;</strong> o <strong>&ldquo;Agregar a la pantalla principal&rdquo;</strong>.</li>
              </ol>
            </div>

            <button
              onClick={() => setShowPwaModal(false)}
              className="btn btn-primary"
              style={{ width: '100%' }}
            >
              ¡Entendido!
            </button>
          </div>
        </div>
      )}



      {/* Settings Modal (Discord link, etc.) */}
      {showSettingsModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '16px',
        }}>
          <form onSubmit={handleSaveSettings} className="glass-panel" style={{ maxWidth: '420px', width: '100%', padding: '24px', borderRadius: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#fff', margin: 0 }}>
                Configuración del Grupo
              </h3>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label htmlFor={discordInviteInputId} style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Enlace de Invitación a su Servidor de Discord
              </label>
              <input
                id={discordInviteInputId}
                type="url"
                placeholder="https://discord.gg/tu-servidor"
                value={discordInviteInput}
                onChange={(e) => setDiscordInviteInput(e.target.value)}
              />
              <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '4px', display: 'block' }}>
                Tus amigos podrán hacer clic en &ldquo;🎙️ Discord&rdquo; para unirse directo al canal.
              </span>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="btn btn-ghost"
                style={{ flex: 1 }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-discord"
                style={{ flex: 1 }}
              >
                Guardar Enlace
              </button>
            </div>
          </form>
        </div>
      )}

    </main>
  );
}
