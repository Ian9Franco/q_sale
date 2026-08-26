'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Zap,
  Clock,
  Calendar,
  Mic,
  MicOff,
  Bell,
  BellOff,
  Volume2,
  VolumeX,
  Download,
  ExternalLink,
  Shield,
  Gamepad2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Radio,
} from 'lucide-react';
import { AppState, PlayerStatus, GAMES_CATALOG, AvailabilityType, DiscordStatus } from './types';
import OperatorIcon from './components/OperatorIcon';

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

// Tactical Web Audio feedback
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
      osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } else if (type === 'ready') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08);
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.16);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.28);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.28);
    } else if (type === 'squad_full') {
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);
        gain.gain.setValueAtTime(0.18, ctx.currentTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + idx * 0.08 + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.08);
        osc.stop(ctx.currentTime + idx * 0.08 + 0.25);
      });
    }
  } catch {
    // Audio might fail before user interaction
  }
};

export default function HomePage() {
  const [appState, setAppState] = useState<AppState | null>(null);
  const [activePlayerId, setActivePlayerId] = useState<string>('ian');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [showPwaModal, setShowPwaModal] = useState<boolean>(false);
  const [showCatalog, setShowCatalog] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('');

  // Push notifications state
  const [isPushSubscribed, setIsPushSubscribed] = useState<boolean>(false);
  const [isPushSupported, setIsPushSupported] = useState<boolean>(false);
  const [isSubscribingPush, setIsSubscribingPush] = useState<boolean>(false);
  const [pushStatusMessage, setPushStatusMessage] = useState<string>('');

  // Draft status editing
  const [draftAvailability, setDraftAvailability] = useState<AvailabilityType>('now');
  const [draftScheduledTime, setDraftScheduledTime] = useState<string>('22:00');
  const [draftScheduledDate, setDraftScheduledDate] = useState<string>('Hoy');
  const [draftDiscordStatus, setDraftDiscordStatus] = useState<DiscordStatus>('in_voice');
  const [draftCustomNote, setDraftCustomNote] = useState<string>('');

  // Service Worker setup & Push check
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
      setIsPushSupported(true);
      navigator.serviceWorker.register('/sw.js').then(async (registration) => {
        const sub = await registration.pushManager.getSubscription();
        if (sub) {
          setIsPushSubscribed(true);
        }
      }).catch(err => {
        console.warn('SW error:', err);
      });
    }
  }, []);

  const handleTogglePush = async () => {
    if (!isPushSupported) {
      alert('Para notificaciones en iPhone: Abrí en Safari > Compartir > Agregar a Inicio > Abrir la app desde el inicio.');
      return;
    }

    setIsSubscribingPush(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      
      if (isPushSubscribed) {
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
        setPushStatusMessage('Notificaciones desactivadas');
      } else {
        const keyRes = await fetch('/api/push/subscribe');
        const { publicKey } = await keyRes.json();
        
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          alert('Debes permitir las notificaciones para que te avise cuando jueguen.');
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
        setPushStatusMessage('¡Notificaciones push activadas!');
        if (soundEnabled) playTacticalSound('ready');
      }
    } catch (err) {
      console.error('Push error:', err);
      alert('Error activando notificaciones: ' + String(err));
    } finally {
      setIsSubscribingPush(false);
      setTimeout(() => setPushStatusMessage(''), 3000);
    }
  };

  const handleSendTestPush = async () => {
    try {
      await fetch('/api/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: '¿Qué Sale? - Test',
          message: '¡Notificación recibida en tu celular!',
        }),
      });
      alert('Alerta de prueba enviada.');
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch status from API
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
            if (newReady >= 5) playTacticalSound('squad_full');
            else playTacticalSound('ready');
          }
        }
        return data;
      });
      setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setIsLoading(false);
    } catch (err) {
      console.error('Error:', err);
      setIsLoading(false);
    }
  }, [soundEnabled]);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 4000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  // Load saved user from local storage
  useEffect(() => {
    const savedUserId = localStorage.getItem('q_sale_active_user');
    if (savedUserId) {
      setActivePlayerId(savedUserId);
    }
  }, []);

  // Update draft form when active player changes
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
        setDraftCustomNote(current.customNote || '');
      }
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
      setDraftCustomNote(p.customNote || '');
    }
    if (soundEnabled) playTacticalSound('ping');
  };

  const handleSaveStatus = async (overrides?: Partial<PlayerStatus>) => {
    if (!activePlayerId || !appState) return;
    setIsUpdating(true);

    const payload: Partial<PlayerStatus> & { id: string } = {
      id: activePlayerId,
      availability: overrides?.availability ?? draftAvailability,
      scheduledTime: overrides?.scheduledTime ?? (draftAvailability === 'scheduled' || draftAvailability === 'soon' ? draftScheduledTime : undefined),
      scheduledDate: overrides?.scheduledDate ?? (draftAvailability === 'scheduled' ? draftScheduledDate : undefined),
      discordStatus: overrides?.discordStatus ?? draftDiscordStatus,
      gameId: 'r6_siege',
      gameMode: 'Ranked',
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

  const handleQuickReady = () => {
    setDraftAvailability('now');
    setDraftDiscordStatus('in_voice');
    handleSaveStatus({ availability: 'now', discordStatus: 'in_voice' });
  };

  const players = appState?.players || [];
  const readyNowPlayers = players.filter(p => p.availability === 'now');
  const inVoiceCount = players.filter(p => p.discordStatus === 'in_voice').length;
  const readyCount = readyNowPlayers.length;
  const maxSquad = 5;
  const isSquadFull = readyCount >= maxSquad;

  return (
    <main style={{ minHeight: '100vh', padding: '12px 12px 60px 12px', maxWidth: '580px', margin: '0 auto' }}>
      
      {/* Top Navbar */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 14px',
        marginBottom: '12px',
        borderRadius: '14px',
        background: 'rgba(12, 18, 29, 0.85)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(16px)',
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #ff9f1c, #ff4757)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 12px rgba(255, 159, 28, 0.4)',
          }}>
            <span className="font-tactical" style={{ fontSize: '1.3rem', fontWeight: 900, color: '#fff' }}>Q</span>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <h1 className="font-tactical" style={{ fontSize: '1.1rem', fontWeight: 800, textTransform: 'uppercase', margin: 0, letterSpacing: '1px' }}>
                ¿Qué Sale?
              </h1>
              <span style={{ fontSize: '0.65rem', padding: '1px 5px', borderRadius: '4px', background: 'rgba(255, 159, 28, 0.2)', color: 'var(--accent-r6)', fontWeight: 800, border: '1px solid var(--accent-r6)' }}>
                R6 SQUAD
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00e676', display: 'inline-block' }} className="live-pulse"></span>
              <span>En vivo {lastSyncTime && `• ${lastSyncTime}`}</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="btn btn-ghost"
            style={{ padding: '6px 8px', borderRadius: '8px' }}
            title={soundEnabled ? 'Silenciar' : 'Activar sonido'}
          >
            {soundEnabled ? <Volume2 size={16} color="var(--accent-r6)" /> : <VolumeX size={16} color="var(--text-dim)" />}
          </button>

          {/* Push Bell Toggle */}
          <button
            onClick={handleTogglePush}
            disabled={isSubscribingPush}
            className="btn btn-ghost"
            style={{
              padding: '6px 8px',
              borderRadius: '8px',
              border: isPushSubscribed ? '1px solid #00e676' : '1px solid var(--border-subtle)',
              background: isPushSubscribed ? 'rgba(0, 230, 118, 0.15)' : 'rgba(255, 255, 255, 0.05)',
            }}
            title={isPushSubscribed ? 'Notificaciones activas' : 'Activar notificaciones'}
          >
            {isPushSubscribed ? <Bell size={16} color="#00e676" /> : <BellOff size={16} color="var(--text-dim)" />}
          </button>

          {/* Discord Button */}
          {appState?.discordInviteUrl && (
            <a
              href={appState.discordInviteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-discord"
              style={{ padding: '6px 10px', fontSize: '0.75rem', textDecoration: 'none', borderRadius: '8px' }}
            >
              <Mic size={14} /> Discord
            </a>
          )}
        </div>
      </header>

      {/* Push Status Toast */}
      {pushStatusMessage && (
        <div style={{ padding: '8px 12px', borderRadius: '8px', background: 'rgba(0, 230, 118, 0.2)', color: '#00e676', fontSize: '0.8rem', marginBottom: '10px', textAlign: 'center', fontWeight: 700 }}>
          {pushStatusMessage}
        </div>
      )}

      {/* Squad Readiness Summary Card */}
      <section className="glass-panel tactical-border" style={{
        padding: '16px 14px',
        marginBottom: '14px',
        background: 'linear-gradient(145deg, rgba(16, 24, 40, 0.95), rgba(10, 15, 26, 0.98))',
        border: isSquadFull ? '1px solid #00e676' : '1px solid rgba(255, 159, 28, 0.3)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <div className="font-tactical" style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>
              {readyCount} <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 600 }}>/ {maxSquad} LISTOS</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              {isSquadFull ? '¡Escuadra de 5 completa para rankear!' : `Faltan ${maxSquad - readyCount} jugadores`}
            </div>
          </div>

          <button
            onClick={handleQuickReady}
            disabled={isUpdating}
            className="btn btn-success"
            style={{ padding: '8px 14px', fontSize: '0.82rem', borderRadius: '8px' }}
          >
            <Zap size={15} /> ¡Entrando YA!
          </button>
        </div>

        {/* 5 Squad Slots */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
          {[0, 1, 2, 3, 4].map((index) => {
            const player = readyNowPlayers[index];
            const isFilled = !!player;
            return (
              <div
                key={index}
                style={{
                  height: '56px',
                  borderRadius: '8px',
                  border: isFilled ? '1px solid #00e676' : '1px dashed rgba(255, 255, 255, 0.12)',
                  background: isFilled ? 'rgba(0, 230, 118, 0.1)' : 'rgba(15, 23, 42, 0.4)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '2px',
                  padding: '4px',
                  position: 'relative',
                }}
              >
                {isFilled ? (
                  <>
                    <OperatorIcon name={player.avatar} size={24} />
                    <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>
                      {player.name}
                    </span>
                  </>
                ) : (
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)', fontWeight: 600 }}>
                    #{index + 1}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Voice Discord note */}
        <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', paddingTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Radio size={13} color="#5865f2" />
            <span><strong>{inVoiceCount}</strong> en canal de voz</span>
          </div>
          {isPushSubscribed && (
            <button
              onClick={handleSendTestPush}
              style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', fontSize: '0.7rem', cursor: 'pointer', padding: 0 }}
            >
              Test push
            </button>
          )}
        </div>
      </section>

      {/* Control Panel: Tu Estado */}
      <section className="glass-panel" style={{ padding: '14px', marginBottom: '14px' }}>
        
        {/* Step 1: Who are you (4 Operator Cards) */}
        <div style={{ marginBottom: '12px' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>
            Jugador Activo
          </label>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
            {players.map((p) => {
              const isSelected = p.id === activePlayerId;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectUser(p.id)}
                  style={{
                    padding: '8px 4px',
                    borderRadius: '8px',
                    border: isSelected ? '2px solid var(--accent-r6)' : '1px solid var(--border-subtle)',
                    background: isSelected ? 'rgba(255, 159, 28, 0.15)' : 'rgba(15, 23, 42, 0.5)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <OperatorIcon name={p.avatar} size={28} />
                  <span style={{ fontSize: '0.75rem', fontWeight: isSelected ? 800 : 600, color: isSelected ? '#fff' : 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>
                    {p.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Disponibilidad */}
        <div style={{ marginBottom: '12px' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>
            Disponibilidad
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
            <button
              type="button"
              onClick={() => setDraftAvailability('now')}
              className={`status-pill ${draftAvailability === 'now' ? 'active-now' : ''}`}
            >
              <Zap size={18} />
              <span>YA</span>
            </button>

            <button
              type="button"
              onClick={() => setDraftAvailability('soon')}
              className={`status-pill ${draftAvailability === 'soon' ? 'active-soon' : ''}`}
            >
              <Clock size={18} />
              <span>30m</span>
            </button>

            <button
              type="button"
              onClick={() => setDraftAvailability('scheduled')}
              className={`status-pill ${draftAvailability === 'scheduled' ? 'active-scheduled' : ''}`}
            >
              <Calendar size={18} />
              <span>Hora</span>
            </button>

            <button
              type="button"
              onClick={() => setDraftAvailability('offline')}
              className={`status-pill ${draftAvailability === 'offline' ? 'active-offline' : ''}`}
            >
              <Shield size={18} />
              <span>No</span>
            </button>
          </div>
        </div>

        {/* If Scheduled or Soon, compact time options */}
        {(draftAvailability === 'scheduled' || draftAvailability === 'soon') && (
          <div style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '10px', borderRadius: '8px', marginBottom: '12px', border: '1px solid rgba(255, 184, 0, 0.2)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Día</label>
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
                <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Hora</label>
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

        {/* Step 3: Discord Voice Toggle */}
        <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(15, 23, 42, 0.4)', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Mic size={16} color={draftDiscordStatus === 'in_voice' ? '#5865f2' : 'var(--text-dim)'} />
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fff' }}>¿Estás en Discord?</span>
          </div>

          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              type="button"
              onClick={() => setDraftDiscordStatus('in_voice')}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                border: 'none',
                background: draftDiscordStatus === 'in_voice' ? '#5865f2' : 'rgba(255, 255, 255, 0.05)',
                color: '#fff',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Sí
            </button>
            <button
              type="button"
              onClick={() => setDraftDiscordStatus('offline')}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                border: 'none',
                background: draftDiscordStatus === 'offline' ? '#475569' : 'rgba(255, 255, 255, 0.05)',
                color: draftDiscordStatus === 'offline' ? '#fff' : 'var(--text-muted)',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              No
            </button>
          </div>
        </div>

        {/* Note input (Slim) */}
        <div style={{ marginBottom: '14px' }}>
          <input
            type="text"
            placeholder="Mensaje opcional (ej: Juego 2 rankeds / Vengo de comer)"
            value={draftCustomNote}
            onChange={(e) => setDraftCustomNote(e.target.value)}
            style={{ fontSize: '0.8rem' }}
          />
        </div>

        {/* Main Action Button */}
        <button
          onClick={() => handleSaveStatus()}
          disabled={isUpdating}
          className="btn btn-primary"
          style={{ width: '100%', padding: '12px', fontSize: '0.95rem' }}
        >
          {isUpdating ? 'Notificando...' : 'Avisar al Squad'}
        </button>
      </section>

      {/* Squad Status List */}
      <section style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', padding: '0 4px' }}>
          <h2 className="font-tactical" style={{ fontSize: '1rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0, color: 'var(--text-muted)' }}>
            Estado del Squad
          </h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
            {players.length} amigos
          </span>
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Cargando estado...
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {players.map((p) => {
              const isReady = p.availability === 'now';
              const isSoon = p.availability === 'soon';
              const isScheduled = p.availability === 'scheduled';
              const isUserActive = p.id === activePlayerId;

              return (
                <div
                  key={p.id}
                  className="glass-panel"
                  style={{
                    padding: '10px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderLeft: `3px solid ${isReady ? '#00e676' : isSoon ? '#00d2d3' : isScheduled ? '#ffb800' : '#475569'}`,
                    background: isUserActive ? 'rgba(22, 34, 54, 0.85)' : 'rgba(15, 23, 38, 0.65)',
                  }}
                >
                  {/* Left: Avatar + Name + Note */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                    <OperatorIcon name={p.avatar} size={36} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#fff' }}>
                          {p.name}
                        </span>
                        {isUserActive && (
                          <span style={{ fontSize: '0.6rem', padding: '1px 4px', borderRadius: '4px', background: 'rgba(255, 159, 28, 0.2)', color: 'var(--accent-r6)', fontWeight: 800 }}>
                            TÚ
                          </span>
                        )}
                      </div>
                      {p.customNote ? (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          &ldquo;{p.customNote}&rdquo;
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                          Rainbow Six Siege
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Badges */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                    {p.discordStatus === 'in_voice' && (
                      <span title="En Discord" style={{ padding: '4px 6px', borderRadius: '6px', background: 'rgba(88, 101, 242, 0.2)', color: '#8ea1e1', border: '1px solid #5865f2', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Mic size={11} /> Discord
                      </span>
                    )}

                    {isReady && (
                      <span style={{ padding: '4px 8px', borderRadius: '6px', background: 'rgba(0, 230, 118, 0.15)', border: '1px solid #00e676', color: '#00e676', fontSize: '0.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#00e676' }} className="live-pulse"></span>
                        YA
                      </span>
                    )}

                    {isSoon && (
                      <span style={{ padding: '4px 8px', borderRadius: '6px', background: 'rgba(0, 210, 211, 0.15)', border: '1px solid #00d2d3', color: '#00d2d3', fontSize: '0.75rem', fontWeight: 700 }}>
                        {p.scheduledTime || '30m'}
                      </span>
                    )}

                    {isScheduled && (
                      <span style={{ padding: '4px 8px', borderRadius: '6px', background: 'rgba(255, 184, 0, 0.15)', border: '1px solid #ffb800', color: '#ffb800', fontSize: '0.75rem', fontWeight: 700 }}>
                        {p.scheduledDate || 'Hoy'} {p.scheduledTime || '22:00'}
                      </span>
                    )}

                    {p.availability === 'offline' && (
                      <span style={{ padding: '4px 8px', borderRadius: '6px', background: 'rgba(100, 116, 139, 0.15)', color: '#64748b', fontSize: '0.75rem', fontWeight: 600 }}>
                        Offline
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Collapsible Games Catalog (Secondary) */}
      <section style={{ marginBottom: '14px' }}>
        <button
          onClick={() => setShowCatalog(!showCatalog)}
          style={{
            width: '100%',
            background: 'none',
            border: 'none',
            color: 'var(--text-dim)',
            fontSize: '0.8rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            cursor: 'pointer',
            padding: '8px',
          }}
        >
          <Gamepad2 size={15} />
          <span>Catálogo de Juegos</span>
          {showCatalog ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {showCatalog && (
          <div style={{ display: 'grid', gap: '8px', marginTop: '6px' }}>
            {GAMES_CATALOG.map((g) => (
              <div
                key={g.id}
                className="glass-panel"
                style={{
                  padding: '10px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  opacity: g.statusBadge === 'coming_soon' ? 0.65 : 1,
                  borderLeft: g.id === 'r6_siege' ? '3px solid var(--accent-r6)' : '1px solid var(--border-subtle)',
                }}
              >
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#fff' }}>{g.name}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{g.tagline}</div>
                </div>
                <span style={{
                  fontSize: '0.65rem',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontWeight: 800,
                  background: g.statusBadge === 'active' ? 'var(--accent-r6)' : g.statusBadge === 'unclassified' ? 'rgba(231, 76, 60, 0.25)' : 'rgba(168, 85, 247, 0.25)',
                  color: g.statusBadge === 'active' ? '#000' : g.statusBadge === 'unclassified' ? '#ff6b6b' : '#c084fc',
                }}>
                  {g.badgeLabel}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* PWA Help Link */}
      <div style={{ textAlign: 'center' }}>
        <button
          onClick={() => setShowPwaModal(true)}
          style={{ background: 'none', border: 'none', color: 'var(--text-dim)', fontSize: '0.75rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
        >
          <Download size={12} /> ¿Cómo anclar la app a tu celular?
        </button>
      </div>

      {/* PWA Install Modal */}
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
          <div className="glass-panel" style={{ maxWidth: '380px', width: '100%', padding: '20px', borderRadius: '16px', border: '1px solid var(--accent-cyan)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#00f0ff', margin: 0 }}>
                Instalar en el Celular
              </h3>
              <button
                onClick={() => setShowPwaModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.1rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '10px 12px', borderRadius: '10px', marginBottom: '10px' }}>
              <div style={{ fontWeight: 800, color: '#fff', fontSize: '0.8rem', marginBottom: '4px' }}>
                En iPhone (Safari):
              </div>
              <ol style={{ paddingLeft: '18px', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                <li>Tocá <strong>Compartir</strong> (icono de cuadrado con flecha).</li>
                <li>Seleccioná <strong>&ldquo;Agregar a Inicio&rdquo;</strong>.</li>
                <li>Abrí la app desde el nuevo ícono y activá las notificaciones.</li>
              </ol>
            </div>

            <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '10px 12px', borderRadius: '10px', marginBottom: '16px' }}>
              <div style={{ fontWeight: 800, color: '#fff', fontSize: '0.8rem', marginBottom: '4px' }}>
                En Android (Chrome):
              </div>
              <ol style={{ paddingLeft: '18px', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                <li>Tocá los <strong>tres puntos (⋮)</strong>.</li>
                <li>Seleccioná <strong>&ldquo;Instalar aplicación&rdquo;</strong>.</li>
              </ol>
            </div>

            <button
              onClick={() => setShowPwaModal(false)}
              className="btn btn-primary"
              style={{ width: '100%', padding: '10px' }}
            >
              Entendido
            </button>
          </div>
        </div>
      )}

    </main>
  );
}
