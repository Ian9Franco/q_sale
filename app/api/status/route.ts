import { NextResponse } from 'next/server';
import { PlayerStatus, AppState } from '../../types';
import { broadcastPushNotification } from '../../lib/push';
import { getDbAppState, saveDbAppState, INITIAL_STATE } from '../../lib/redis';

export async function GET() {
  const state = await getDbAppState();
  return NextResponse.json(state);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const currentState = await getDbAppState();
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
      await saveDbAppState(currentState);

      // Trigger Web Push Notification if player marked active/available (NEVER on offline)
      if (body.sendNotification !== false && updatedPlayer.availability !== 'offline') {
        let pushTitle = '¿Qué Sale? - R6 Squad 🎯';
        let pushBody = '';

        if (updatedPlayer.availability === 'now') {
          if (updatedPlayer.discordStatus === 'in_voice') {
            pushBody = `⚡ ¡${finalPlayerName} está en Discord y entrando a R6 Siege!`;
          } else {
            pushBody = `🟢 ${finalPlayerName} está disponible YA para jugar.`;
          }
        } else if (updatedPlayer.availability === 'soon') {
          pushBody = `⏳ ${finalPlayerName} entra ${updatedPlayer.scheduledTime ? (updatedPlayer.scheduledTime.toLowerCase().startsWith('en') ? updatedPlayer.scheduledTime : `en ${updatedPlayer.scheduledTime}`) : 'en 15-30 min'}.`;
        } else if (updatedPlayer.availability === 'scheduled') {
          pushBody = `🕒 ${finalPlayerName} avisó que juega ${updatedPlayer.scheduledDate || 'Hoy'} a las ${updatedPlayer.scheduledTime || '22:00'}.`;
        }

        if (updatedPlayer.customNote) {
          pushBody += ` ("${updatedPlayer.customNote}")`;
        }

        if (pushBody) {
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
      await saveDbAppState(currentState);
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
      await saveDbAppState(currentState);
      return NextResponse.json({ success: true, state: currentState });
    }

    if (body.action === 'reset_all') {
      const resetState: AppState = {
        ...INITIAL_STATE,
        lastUpdated: now,
      };
      await saveDbAppState(resetState);
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
