import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { AppState, PlayerStatus } from '../../types';
import { broadcastPushNotification } from '../../lib/push';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'app_state.json');

const INITIAL_STATE: AppState = {
  activeGameId: 'r6_siege',
  discordInviteUrl: 'https://discord.com',
  lastUpdated: new Date().toISOString(),
  players: [
    {
      id: 'ian',
      name: 'Ian',
      avatar: 'ash',
      color: '#ff4757',
      availability: 'now',
      discordStatus: 'in_voice',
      gameId: 'r6_siege',
      gameMode: 'Ranked 🏆',
      customNote: '¡Listo para rankeds de Siege!',
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'mateo',
      name: 'Mateo',
      avatar: 'sledge',
      color: '#2ed573',
      availability: 'scheduled',
      scheduledTime: '22:30',
      scheduledDate: 'Hoy',
      discordStatus: 'offline',
      gameId: 'r6_siege',
      gameMode: 'Ranked 🏆',
      customNote: 'Ceno y me conecto',
      updatedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    },
    {
      id: 'lucas',
      name: 'Lucas',
      avatar: 'smoke',
      color: '#1e90ff',
      availability: 'soon',
      scheduledTime: 'En 15 min',
      discordStatus: 'joining',
      gameId: 'r6_siege',
      gameMode: 'Standard 🛡️',
      customNote: 'Prendiendo la PC',
      updatedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    },
    {
      id: 'franco',
      name: 'Franco',
      avatar: 'jager',
      color: '#ffa502',
      availability: 'offline',
      discordStatus: 'offline',
      gameId: 'r6_siege',
      gameMode: 'Ranked 🏆',
      customNote: 'Capaz más tarde',
      updatedAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    },
  ],
};

let memoryCache: AppState | null = null;

function getStoredState(): AppState {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      memoryCache = parsed;
      return parsed;
    }
  } catch (err) {
    console.warn('Could not read persistent file, using cache/defaults:', err);
  }

  if (!memoryCache) {
    memoryCache = { ...INITIAL_STATE };
    saveState(memoryCache);
  }
  return memoryCache;
}

function saveState(state: AppState) {
  memoryCache = state;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not write persistent file:', err);
  }
}

export async function GET() {
  const state = getStoredState();
  return NextResponse.json(state);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const currentState = getStoredState();
    const now = new Date().toISOString();

    if (body.action === 'update_player') {
      const updatedPlayer: Partial<PlayerStatus> & { id: string } = body.player;
      
      const playerIndex = currentState.players.findIndex(p => p.id === updatedPlayer.id);
      let finalPlayerName = 'Un amigo';

      if (playerIndex >= 0) {
        finalPlayerName = currentState.players[playerIndex].name;
        currentState.players[playerIndex] = {
          ...currentState.players[playerIndex],
          ...updatedPlayer,
          updatedAt: now,
        };
      } else {
        const newPlayer: PlayerStatus = {
          id: updatedPlayer.id || `player_${Date.now()}`,
          name: updatedPlayer.name || 'Nuevo Jugador',
          avatar: updatedPlayer.avatar || 'recruit',
          color: updatedPlayer.color || '#3742fa',
          availability: updatedPlayer.availability || 'now',
          discordStatus: updatedPlayer.discordStatus || 'offline',
          gameId: updatedPlayer.gameId || currentState.activeGameId || 'r6_siege',
          gameMode: updatedPlayer.gameMode || 'Ranked 🏆',
          customNote: updatedPlayer.customNote || '',
          scheduledTime: updatedPlayer.scheduledTime,
          scheduledDate: updatedPlayer.scheduledDate,
          updatedAt: now,
        };
        finalPlayerName = newPlayer.name;
        currentState.players.push(newPlayer);
      }

      currentState.lastUpdated = now;
      saveState(currentState);

      // Trigger Web Push Notification if player marked active/available
      if (body.sendNotification !== false) {
        let pushTitle = '¿Qué Sale? - R6 Squad 🎯';
        let pushBody = '';

        if (updatedPlayer.availability === 'now') {
          if (updatedPlayer.discordStatus === 'in_voice') {
            pushBody = `⚡ ¡${finalPlayerName} está en Discord y entrando a R6 Siege!`;
          } else {
            pushBody = `🟢 ${finalPlayerName} está disponible YA para jugar.`;
          }
        } else if (updatedPlayer.availability === 'soon') {
          pushBody = `⏳ ${finalPlayerName} entra en 15-30 min.`;
        } else if (updatedPlayer.availability === 'scheduled') {
          pushBody = `🕒 ${finalPlayerName} avisó que juega ${updatedPlayer.scheduledDate || 'Hoy'} a las ${updatedPlayer.scheduledTime || '22:00'}.`;
        }

        if (updatedPlayer.customNote) {
          pushBody += ` ("${updatedPlayer.customNote}")`;
        }

        if (pushBody) {
          // Send in background without blocking response
          broadcastPushNotification({
            title: pushTitle,
            body: pushBody,
            senderUserId: updatedPlayer.id,
            url: '/',
          }).catch(e => console.error('Push broadcast error:', e));
        }
      }

      return NextResponse.json({ success: true, state: currentState });
    }

    if (body.action === 'remove_player') {
      const { id } = body;
      currentState.players = currentState.players.filter(p => p.id !== id);
      currentState.lastUpdated = now;
      saveState(currentState);
      return NextResponse.json({ success: true, state: currentState });
    }

    if (body.action === 'update_settings') {
      if (body.discordInviteUrl !== undefined) {
        currentState.discordInviteUrl = body.discordInviteUrl;
      }
      if (body.activeGameId !== undefined) {
        currentState.activeGameId = body.activeGameId;
      }
      currentState.lastUpdated = now;
      saveState(currentState);
      return NextResponse.json({ success: true, state: currentState });
    }

    if (body.action === 'reset_all') {
      const resetState: AppState = {
        ...INITIAL_STATE,
        lastUpdated: now,
      };
      saveState(resetState);
      return NextResponse.json({ success: true, state: resetState });
    }

    return NextResponse.json({ error: 'Acción no reconocida' }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error procesando solicitud', details: String(error) },
      { status: 500 }
    );
  }
}
